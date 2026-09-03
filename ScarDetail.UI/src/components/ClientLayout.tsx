import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { CalendarDays, Car, LogOut, MapPin, Sparkles, UserRound } from 'lucide-react';
import { useAuth } from '../contexts/useAuth';

const clientLinks = [
  { to: '/book', label: 'Agendar', icon: Sparkles },
  { to: '/appointments', label: 'Agendamentos', icon: CalendarDays },
  { to: '/vehicles', label: 'Veículos', icon: Car },
  { to: '/addresses', label: 'Endereços', icon: MapPin },
];

export const ClientLayout: React.FC = () => {
  const { user, logout } = useAuth();

  return (
    <div className="client-shell min-h-screen bg-stone-50 text-slate-900">
      <header className="sticky top-0 z-40 border-b border-stone-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <NavLink to="/book" className="flex items-center gap-3" aria-label="ScarDetail - Agendar">
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
        className="fixed inset-x-3 bottom-3 z-40 grid grid-cols-4 rounded-2xl border border-stone-200 bg-white/95 p-1.5 shadow-xl backdrop-blur md:hidden"
        aria-label="Navegação do cliente"
      >
        {clientLinks.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex min-h-14 flex-col items-center justify-center gap-1 rounded-xl text-[10px] font-bold ${
                isActive ? 'bg-slate-950 text-white' : 'text-slate-500'
              }`
            }
          >
            <Icon className="h-5 w-5" />
            {label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
};
