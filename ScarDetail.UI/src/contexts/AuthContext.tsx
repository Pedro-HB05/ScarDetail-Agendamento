import React, { useEffect, useState } from 'react';
import type { User } from '../types';
import { authService } from '../services/authService';
import { authStorage } from '../services/authStorage';
import { AuthContext } from './auth-context';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(authStorage.getUser);
  const [isLoading, setIsLoading] = useState(true);

  const logout = () => {
    authStorage.clear();
    setUser(null);
  };

  useEffect(() => {
    const verifyAuth = async () => {
      const token = authStorage.getAccessToken();
      if (token) {
        try {
          const currentUser = await authService.getMe();
          setUser(currentUser);
          authStorage.saveUser(currentUser);
        } catch {
          logout();
        }
      }
      setIsLoading(false);
    };

    verifyAuth();
  }, []);

  const login = async (email: string, senha: string) => {
    const res = await authService.login({ email, senha });
    authStorage.saveSession(res);
    setUser(res.usuario);
    return res.usuario;
  };

  const register = async (data: { nome: string; email: string; senha: string; telefone: string }) => {
    const res = await authService.register(data);
    authStorage.saveSession(res);
    setUser(res.usuario);
    return res.usuario;
  };

  const registerOwner = async (data: { nome: string; email: string; senha: string; telefone: string }) => {
    const res = await authService.registerOwner(data);
    authStorage.saveSession(res);
    setUser(res.usuario);
    return res.usuario;
  };

  const updateUser = (updatedUser: User) => {
    setUser(updatedUser);
    authStorage.saveUser(updatedUser);
  };

  const isAuthenticated = !!user;
  const isAdmin = user?.role === 'Admin';

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isAdmin,
        isLoading,
        login,
        register,
        registerOwner,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
