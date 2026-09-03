import type { AuthResponse, User } from '../types';

const keys = {
  accessToken: 'scar_access_token',
  refreshToken: 'scar_refresh_token',
  user: 'scar_user',
} as const;

const readUser = (): User | null => {
  const rawUser = localStorage.getItem(keys.user);
  if (!rawUser) return null;

  try {
    return JSON.parse(rawUser) as User;
  } catch {
    localStorage.removeItem(keys.user);
    return null;
  }
};

export const authStorage = {
  getAccessToken: () => localStorage.getItem(keys.accessToken),
  getRefreshToken: () => localStorage.getItem(keys.refreshToken),
  getUser: readUser,

  saveSession(auth: AuthResponse) {
    localStorage.setItem(keys.accessToken, auth.accessToken);
    localStorage.setItem(keys.refreshToken, auth.refreshToken);
    localStorage.setItem(keys.user, JSON.stringify(auth.usuario));
  },

  saveUser(user: User) {
    localStorage.setItem(keys.user, JSON.stringify(user));
  },

  clear() {
    Object.values(keys).forEach((key) => localStorage.removeItem(key));
  },
};
