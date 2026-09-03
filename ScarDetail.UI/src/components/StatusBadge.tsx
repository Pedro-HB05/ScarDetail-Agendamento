import React from 'react';
import type { AppointmentStatus, VehicleCategory } from '../types';
import { Clock, CheckCircle2, Truck, Wrench, CheckCheck, XCircle } from 'lucide-react';

interface StatusBadgeProps {
  status: AppointmentStatus;
  size?: 'sm' | 'md' | 'lg';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-xs px-2.5 py-1',
    lg: 'text-sm px-3 py-1.5',
  }[size];

  const config = {
    Pendente: {
      label: 'Pendente',
      icon: Clock,
      className: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
    },
    Confirmado: {
      label: 'Confirmado',
      icon: CheckCircle2,
      className: 'bg-blue-500/10 text-blue-400 border border-blue-500/20',
    },
    ACaminho: {
      label: 'A Caminho',
      icon: Truck,
      className: 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20',
    },
    EmExecucao: {
      label: 'Em Execução',
      icon: Wrench,
      className: 'bg-purple-500/10 text-purple-400 border border-purple-500/20 animate-pulse',
    },
    Finalizado: {
      label: 'Finalizado',
      icon: CheckCheck,
      className: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
    },
    Cancelado: {
      label: 'Cancelado',
      icon: XCircle,
      className: 'bg-rose-500/10 text-rose-400 border border-rose-500/20',
    },
  }[status] || {
    label: status,
    icon: Clock,
    className: 'bg-slate-500/10 text-slate-400 border border-slate-500/20',
  };

  const Icon = config.icon;

  return (
    <span className={`inline-flex items-center gap-1.5 font-medium rounded-full ${sizeClasses} ${config.className}`}>
      <Icon className="w-3.5 h-3.5" />
      <span>{config.label}</span>
    </span>
  );
};

export const VehicleCategoryBadge: React.FC<{ category: VehicleCategory }> = ({ category }) => {
  const displayNames: Record<VehicleCategory, string> = {
    Hatch: 'Hatch',
    Sedan: 'Sedan',
    SUV: 'SUV',
    Camionete: 'Camionete',
    Wagon: 'Wagon (Perua)',
  };

  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-slate-800 text-brand-300 border border-slate-700">
      {displayNames[category] || category}
    </span>
  );
};
