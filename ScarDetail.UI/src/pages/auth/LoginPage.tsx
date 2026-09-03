import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/useAuth';
import { formatApiError } from '../../services/api';
import { Sparkles, Mail, Lock, AlertCircle, ArrowRight } from 'lucide-react';

const loginSchema = z.object({
  email: z.string().min(1, 'O e-mail é obrigatório').email('Formato de e-mail inválido'),
  senha: z.string().min(1, 'A senha é obrigatória'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export const LoginPage: React.FC = () => {
  const { login, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      setErrorMessage(null);
      const signedUser = await login(data.email, data.senha);
      if (signedUser.role === 'Admin') {
        logout();
        setErrorMessage('Use a entrada exclusiva do proprietário para acessar a administração.');
        return;
      }

      const stateFrom = (location.state as { from?: { pathname: string; search?: string } })?.from;
      const requested = new URLSearchParams(location.search).get('returnTo');
      const safeRequested = requested?.startsWith('/') && !requested.startsWith('//') ? requested : null;
      const destination = safeRequested || (stateFrom ? `${stateFrom.pathname}${stateFrom.search || ''}` : '/book');
      navigate(destination, { replace: true });
    } catch (err) {
      setErrorMessage(formatApiError(err));
    }
  };

  return (
    <div className="client-auth min-h-screen bg-stone-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header Branding */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-brand-600 to-brand-400 text-white shadow-xl shadow-brand-500/20 mb-4">
            <Sparkles className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-slate-950">ScarDetail</h1>
          <p className="text-sm text-slate-500 mt-1">Seu atendimento automotivo em Curitiba</p>
        </div>

        {/* Card Form */}
        <div className="bg-white border border-stone-200 rounded-3xl p-8 shadow-xl shadow-slate-900/5">
          <h2 className="text-xl font-bold text-slate-950 mb-2">Entre para agendar</h2>
          <p className="text-sm text-slate-500 mb-6">Seus dados ficam salvos para os próximos atendimentos.</p>

          {errorMessage && (
            <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-start gap-3 text-rose-400 text-sm animate-in fade-in">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                E-mail
              </label>
              <div className="relative">
                <Mail className="w-5 h-5 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  placeholder="seu.email@exemplo.com"
                  {...register('email')}
                  className="w-full pl-11 pr-4 py-3 bg-stone-50 border border-stone-200 rounded-xl text-slate-950 placeholder-slate-400 text-sm focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all"
                />
              </div>
              {errors.email && (
                <p className="text-xs text-rose-400 mt-1.5">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                Senha
              </label>
              <div className="relative">
                <Lock className="w-5 h-5 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  placeholder="••••••••"
                  {...register('senha')}
                  className="w-full pl-11 pr-4 py-3 bg-stone-50 border border-stone-200 rounded-xl text-slate-950 placeholder-slate-400 text-sm focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all"
                />
              </div>
              {errors.senha && (
                <p className="text-xs text-rose-400 mt-1.5">{errors.senha.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-2 py-3 px-4 bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white font-semibold rounded-xl shadow-lg shadow-brand-600/25 flex items-center justify-center gap-2 transition-all"
            >
              {isSubmitting ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Continuar para o agendamento</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-stone-200 text-center">
            <p className="text-sm text-slate-500">
              Ainda não tem uma conta?{' '}
              <Link to={`/register${location.search}`} className="text-brand-600 font-semibold hover:underline">
                Cadastre-se grátis
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
