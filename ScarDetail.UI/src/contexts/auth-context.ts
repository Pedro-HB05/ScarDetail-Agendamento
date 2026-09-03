import { createContext } from 'react';
import type { User } from '../types';

export interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isLoading: boolean;
  login: (email: string, senha: string) => Promise<User>;
  register: (data: { nome: string; email: string; senha: string; telefone: string }) => Promise<User>;
  registerOwner: (data: { nome: string; email: string; senha: string; telefone: string }) => Promise<User>;
  logout: () => void;
  updateUser: (user: User) => void;
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);
