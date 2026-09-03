import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';

export const AdminLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex min-h-screen min-w-0 flex-col lg:pl-72">
        <Navbar onToggleSidebar={() => setSidebarOpen(true)} />
        <div className="border-b border-amber-400/10 bg-amber-300/5 px-4 py-2 text-center text-[11px] font-semibold text-amber-200/80">
          Ambiente exclusivo do proprietário · Operação Curitiba/PR
        </div>
        <main className="mx-auto w-full max-w-7xl flex-1 p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
