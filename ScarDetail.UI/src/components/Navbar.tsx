import React from 'react';
import { useAuth } from '../contexts/useAuth';
import { Menu, Sparkles, User as UserIcon } from 'lucide-react';

interface NavbarProps {
  onToggleSidebar: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onToggleSidebar }) => {
  const { user } = useAuth();

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-4 lg:px-8 bg-slate-900/80 backdrop-blur-md border-b border-slate-800">
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 lg:hidden"
        >
          <Menu className="w-6 h-6" />
        </button>
        <div className="flex items-center gap-2 lg:hidden">
          <Sparkles className="w-5 h-5 text-brand-400" />
          <span className="font-bold text-white tracking-wide">ScarDetail</span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <span className="hidden rounded-full border border-amber-300/20 bg-amber-300/10 px-3 py-1 text-xs font-bold text-amber-300 sm:inline-flex">Administração</span>

        <div className="flex items-center gap-3 pl-2 border-l border-slate-800">
          <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300">
            <UserIcon className="w-4 h-4" />
          </div>
          <div className="hidden md:block text-left">
            <p className="text-xs font-semibold text-white leading-tight">{user?.nome}</p>
            <p className="text-[10px] text-slate-400">Proprietário</p>
          </div>
        </div>
      </div>
    </header>
  );
};
