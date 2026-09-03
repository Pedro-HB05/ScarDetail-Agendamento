import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios';
import type { AuthResponse } from '../types';
import { authStorage } from './authStorage';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Injeta Token JWT
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = authStorage.getAccessToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Tratamento de expiração e rotação de Refresh Token
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

const processQueue = (error: Error | null, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // Se o erro for 401 e não for uma requisição de auth login/register
    if (error.response?.status === 401 && !originalRequest._retry && !originalRequest.url?.includes('/auth/login') && !originalRequest.url?.includes('/auth/register')) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const accessToken = authStorage.getAccessToken();
      const refreshToken = authStorage.getRefreshToken();

      if (!refreshToken || !accessToken) {
        authStorage.clear();
        window.location.href = '/login';
        return Promise.reject(error);
      }

      try {
        const { data } = await axios.post<AuthResponse>(`${API_BASE_URL}/auth/refresh`, {
          accessToken,
          refreshToken,
        });

        authStorage.saveSession(data);

        api.defaults.headers.common.Authorization = `Bearer ${data.accessToken}`;
        processQueue(null, data.accessToken);

        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
        }
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError as Error, null);
        authStorage.clear();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export const formatApiError = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    const responseData = error.response?.data;
    if (responseData?.detail) {
      return responseData.detail;
    }
    if (responseData?.title) {
      return responseData.title;
    }
    if (responseData?.errors) {
      const errObj = responseData.errors;
      const firstKey = Object.keys(errObj)[0];
      if (firstKey && Array.isArray(errObj[firstKey])) {
        return errObj[firstKey][0];
      }
    }
    if (typeof responseData === 'string') {
      return responseData;
    }
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'Ocorreu um erro inesperado na requisição.';
};
