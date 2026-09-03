import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../contexts/useAuth';
import {
  MapPin,
  Sparkles,
  Clock,
  LayoutDashboard,
  CalendarCheck,
  Ban,
  TrendingUp,
  CreditCard,
  LogOut,
  X,
  type LucideIcon,
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  highlight?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { user, logout } = useAuth();

  const adminLinks: NavItem[] = [
    { to: '/admin/dashboard', label: 'Visão Geral', icon: LayoutDashboard },
    { to: '/admin/agenda', label: 'Agenda & Atendimentos', icon: CalendarCheck },
    { to: '/admin/services', label: 'Gestão de Serviços', icon: Sparkles },
    { to: '/admin/neighborhoods', label: 'Bairros Atendidos', icon: MapPin },
    { to: '/admin/hours', label: 'Horário de Funcionamento', icon: Clock },
    { to: '/admin/blocks', label: 'Bloqueios da Agenda', icon: Ban },
    { to: '/admin/reports', label: 'Resumo Financeiro', icon: TrendingUp },
    { to: '/admin/payments', label: 'Pagamentos', icon: CreditCard },
  ];

  const links = adminLinks;

  return (
    <>
      {/* Backdrop para mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed top-0 left-0 bottom-0 w-72 bg-slate-900 border-r border-slate-800 z-50 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Logo / Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-brand-400 flex items-center justify-center shadow-lg shadow-brand-500/20">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-lg text-white leading-tight">ScarDetail</h1>
              <p className="text-xs text-brand-400 font-medium tracking-wide">ESTÉTICA A DOMICÍLIO</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 lg:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Perfil & Role Badge */}
        <div className="px-6 py-4 border-b border-slate-800/80 bg-slate-950/30">
          <div className="flex items-center justify-between">
            <div className="truncate">
              <p className="text-sm font-medium text-white truncate">{user?.nome}</p>
              <p className="text-xs text-slate-400 truncate">{user?.email}</p>
            </div>
            <span className="rounded-full border border-amber-300/30 bg-amber-300/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-300">
              Proprietário
            </span>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-4 py-4 space-y-1.5 overflow-y-auto">
          {links.map((link) => {
            const Icon = link.icon;
            return (
              <NavLink
                key={link.to}
                to={link.to}
                onClick={() => onClose()}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-brand-600 text-white shadow-md shadow-brand-600/20'
                      : link.highlight
                      ? 'bg-brand-500/10 text-brand-400 border border-brand-500/30 hover:bg-brand-500/20'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`
                }
              >
                <Icon className="w-5 h-5" />
                <span>{link.label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Footer Logout */}
        <div className="p-4 border-t border-slate-800">
          <button
            onClick={logout}
            className="flex items-center gap-3 w-full px-3.5 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:bg-rose-500/10 hover:text-rose-400 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span>Sair da Conta</span>
          </button>
        </div>
      </aside>
    </>
  );
};
