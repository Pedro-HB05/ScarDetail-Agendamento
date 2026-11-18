import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { CalendarDays, Car, LayoutDashboard, Layers, LogOut, MapPin, Sparkles, UserRound } from 'lucide-react';
import { useAuth } from '../contexts/useAuth';

const clientLinks = [
  { to: '/dashboard', label: 'Início', icon: LayoutDashboard },
  { to: '/book', label: 'Agendar', icon: Sparkles },
  { to: '/appointments', label: 'Agendamentos', icon: CalendarDays },
  { to: '/services', label: 'Serviços', icon: Layers },
  { to: '/vehicles', label: 'Veículos', icon: Car },
  { to: '/addresses', label: 'Endereços', icon: MapPin },
];

export const ClientLayout: React.FC = () => {
  const { user, logout } = useAuth();

  return (
    <div className="client-shell min-h-screen bg-stone-50 text-slate-900">
      <header className="sticky top-0 z-40 border-b border-stone-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <NavLink to="/dashboard" className="flex items-center gap-3" aria-label="ScarDetail - Início">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-950 text-amber-300 shadow-sm">
              <Sparkles className="h-5 w-5" />
            </span>
            <span>
              <strong className="block text-base leading-none">ScarDetail</strong>
              <span className="text-[11px] font-medium text-slate-500">Estética automotiva em Curitiba</span>
            </span>
          </NavLink>

          <nav className="hidden items-center gap-1 md:flex" aria-label="Área do cliente">
            {clientLinks.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition-colors ${
                    isActive ? 'bg-slate-950 text-white' : 'text-slate-600 hover:bg-stone-100 hover:text-slate-950'
                  }`
                }
              >
                <Icon className="h-4 w-4" />
                {label}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <div className="hidden text-right sm:block">
              <p className="text-xs font-bold text-slate-900">{user?.nome}</p>
              <p className="text-[11px] text-slate-500">Área do cliente</p>
            </div>
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-stone-100 text-slate-600">
              <UserRound className="h-4 w-4" />
            </span>
            <button
              type="button"
              onClick={logout}
              className="rounded-xl p-2 text-slate-500 transition-colors hover:bg-rose-50 hover:text-rose-600"
              aria-label="Sair da conta"
              title="Sair"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-4 py-6 pb-28 sm:px-6 md:pb-10">
        <Outlet />
      </main>

      <nav
        className="fixed inset-x-2 bottom-2 z-40 grid grid-cols-6 gap-0.5 rounded-2xl border border-stone-200 bg-white/95 p-1 shadow-xl backdrop-blur md:hidden"
        aria-label="Navegação do cliente"
      >
        {clientLinks.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex min-h-13 flex-col items-center justify-center gap-1 rounded-xl px-1 py-1.5 text-[9px] font-bold transition-colors ${
                isActive ? 'bg-slate-950 text-white' : 'text-slate-500 hover:text-slate-900'
              }`
            }
          >
            <Icon className="h-4 w-4" />
            <span className="truncate max-w-[52px]">{label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
};
