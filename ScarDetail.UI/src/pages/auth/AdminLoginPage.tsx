import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { AlertCircle, ArrowLeft, ArrowRight, KeyRound, LockKeyhole, Mail, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../contexts/useAuth';
import { authService } from '../../services/authService';
import { formatApiError } from '../../services/api';

const schema = z.object({
  email: z.string().email('Informe um e-mail válido'),
  senha: z.string().min(1, 'Informe sua senha'),
});

type FormData = z.infer<typeof schema>;

export const AdminLoginPage: React.FC = () => {
  const { login, logout, isAuthenticated, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { data: setupStatus } = useQuery({
    queryKey: ['owner-setup-status'],
    queryFn: authService.getOwnerSetupStatus,
    retry: false,
  });
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  if (isAuthenticated && isAdmin) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  const onSubmit = async (data: FormData) => {
    try {
      setErrorMessage(null);
      const signedUser = await login(data.email, data.senha);
      if (signedUser.role !== 'Admin') {
        logout();
        setErrorMessage('Este acesso é exclusivo do proprietário. Use a entrada de clientes.');
        return;
      }
      navigate('/admin/dashboard', { replace: true });
    } catch (error) {
      setErrorMessage(formatApiError(error));
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-10 text-slate-100">
      <div className="mx-auto max-w-md">
        <Link to="/login" className="mb-8 inline-flex items-center gap-2 text-sm font-semibold text-slate-400 hover:text-white">
          <ArrowLeft className="h-4 w-4" /> Entrada de clientes
        </Link>

        <div className="mb-7 flex items-center gap-4">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-300 text-slate-950 shadow-lg shadow-amber-300/10">
            <ShieldCheck className="h-7 w-7" />
          </span>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-300">Área restrita</p>
            <h1 className="text-2xl font-black">Painel do proprietário</h1>
            <p className="text-sm text-slate-400">Gestão da operação de Curitiba</p>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-2xl sm:p-8">
          {errorMessage && (
            <div className="mb-5 flex gap-3 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-300">
              <AlertCircle className="h-5 w-5 shrink-0" /> {errorMessage}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-300">E-mail administrativo</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />
                <input {...register('email')} type="email" autoComplete="username" className="w-full rounded-xl border border-slate-700 bg-slate-950 py-3 pl-12 pr-4 text-sm outline-none focus:border-amber-300" />
              </div>
              {errors.email && <p className="mt-1 text-xs text-rose-400">{errors.email.message}</p>}
            </div>
            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-300">Senha</label>
              <div className="relative">
                <LockKeyhole className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />
                <input {...register('senha')} type="password" autoComplete="current-password" className="w-full rounded-xl border border-slate-700 bg-slate-950 py-3 pl-12 pr-4 text-sm outline-none focus:border-amber-300" />
              </div>
              {errors.senha && <p className="mt-1 text-xs text-rose-400">{errors.senha.message}</p>}
            </div>
            <button disabled={isSubmitting} className="flex w-full items-center justify-center gap-2 rounded-xl bg-amber-300 px-5 py-3 font-black text-slate-950 transition hover:bg-amber-200 disabled:opacity-50">
              {isSubmitting ? 'Entrando...' : <><span>Acessar administração</span><ArrowRight className="h-4 w-4" /></>}
            </button>
          </form>

          {setupStatus?.configuracaoDisponivel && (
            <div className="mt-6 border-t border-slate-800 pt-6 text-center">
              <p className="mb-3 text-xs text-slate-400">Primeiro acesso do proprietário?</p>
              <Link to="/admin/configurar" className="inline-flex items-center gap-2 text-sm font-bold text-amber-300 hover:text-amber-200">
                <KeyRound className="h-4 w-4" /> Criar meu acesso administrativo
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
