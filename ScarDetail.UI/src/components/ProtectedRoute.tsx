import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/useAuth';
import type { UserRole } from '../types';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center">
        <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm text-slate-400 font-medium">Carregando sistema...</p>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    const isAdminArea = allowedRoles?.length === 1 && allowedRoles[0] === 'Admin';
    return <Navigate to={isAdminArea ? '/admin/entrar' : '/login'} state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to={user.role === 'Admin' ? '/admin/dashboard' : '/book'} replace />;
  }

  return <>{children}</>;
};
