import { api } from './api';
import type { AuthResponse, OwnerSetupStatus, User } from '../types';

export const authService = {
  async register(data: { nome: string; email: string; senha: string; telefone: string }): Promise<AuthResponse> {
    const res = await api.post<AuthResponse>('/auth/register', data);
    return res.data;
  },

  async login(data: { email: string; senha: string }): Promise<AuthResponse> {
    const res = await api.post<AuthResponse>('/auth/login', data);
    return res.data;
  },

  async getOwnerSetupStatus(): Promise<OwnerSetupStatus> {
    const res = await api.get<OwnerSetupStatus>('/auth/owner-setup');
    return res.data;
  },

  async registerOwner(data: { nome: string; email: string; senha: string; telefone: string }): Promise<AuthResponse> {
    const res = await api.post<AuthResponse>('/auth/owner-setup', data);
    return res.data;
  },

  async getMe(): Promise<User> {
    const res = await api.get<User>('/auth/me');
    return res.data;
  },

  async updateProfile(data: { nome: string; telefone: string }): Promise<User> {
    const res = await api.put<User>('/auth/profile', data);
    return res.data;
  },
};
