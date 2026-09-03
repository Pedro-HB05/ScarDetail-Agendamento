import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/useAuth';
import { formatApiError } from '../../services/api';
import { Sparkles, User, Mail, Lock, Phone, AlertCircle, ArrowRight } from 'lucide-react';

const registerSchema = z
  .object({
    nome: z.string().min(2, 'O nome deve ter pelo menos 2 caracteres'),
    email: z.string().min(1, 'O e-mail é obrigatório').email('Formato de e-mail inválido'),
    telefone: z.string().min(10, 'Informe um telefone/WhatsApp válido (mínimo 10 dígitos)'),
    senha: z.string().min(8, 'A senha deve ter pelo menos 8 caracteres'),
    confirmarSenha: z.string().min(1, 'Confirme sua senha'),
  })
  .refine((data) => data.senha === data.confirmarSenha, {
    message: 'As senhas não conferem',
    path: ['confirmarSenha'],
  });

type RegisterFormData = z.infer<typeof registerSchema>;

export const RegisterPage: React.FC = () => {
  const { register: registerAuth } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterFormData) => {
    try {
      setErrorMessage(null);
      await registerAuth({
        nome: data.nome,
        email: data.email,
        telefone: data.telefone,
        senha: data.senha,
      });
      const requested = new URLSearchParams(location.search).get('returnTo');
      const destination = requested?.startsWith('/') && !requested.startsWith('//') ? requested : '/book';
      navigate(destination, { replace: true });
    } catch (err) {
      setErrorMessage(formatApiError(err));
    }
  };

  return (
    <div className="client-auth min-h-screen bg-stone-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md my-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-brand-600 to-brand-400 text-white shadow-xl shadow-brand-500/20 mb-4">
            <Sparkles className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-slate-950">Vamos preparar seu agendamento</h1>
          <p className="text-sm text-slate-500 mt-1">Crie sua conta para escolher o melhor horário em Curitiba</p>
        </div>

        <div className="bg-white border border-stone-200 rounded-3xl p-8 shadow-xl shadow-slate-900/5">
          {errorMessage && (
            <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-start gap-3 text-rose-400 text-sm animate-in fade-in">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Nome Completo
              </label>
              <div className="relative">
                <User className="w-5 h-5 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Seu nome"
                  {...register('nome')}
                  className="w-full pl-11 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                />
              </div>
              {errors.nome && <p className="text-xs text-rose-400 mt-1">{errors.nome.message}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                E-mail
              </label>
              <div className="relative">
                <Mail className="w-5 h-5 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  placeholder="seu.email@exemplo.com"
                  {...register('email')}
                  className="w-full pl-11 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                />
              </div>
              {errors.email && <p className="text-xs text-rose-400 mt-1">{errors.email.message}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Telefone / WhatsApp
              </label>
              <div className="relative">
                <Phone className="w-5 h-5 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="(11) 99999-9999"
                  {...register('telefone')}
                  className="w-full pl-11 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                />
              </div>
              {errors.telefone && <p className="text-xs text-rose-400 mt-1">{errors.telefone.message}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Senha (mínimo 8 caracteres)
              </label>
              <div className="relative">
                <Lock className="w-5 h-5 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  placeholder="••••••••"
                  {...register('senha')}
                  className="w-full pl-11 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                />
              </div>
              {errors.senha && <p className="text-xs text-rose-400 mt-1">{errors.senha.message}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Confirmar Senha
              </label>
              <div className="relative">
                <Lock className="w-5 h-5 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  placeholder="••••••••"
                  {...register('confirmarSenha')}
                  className="w-full pl-11 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                />
              </div>
              {errors.confirmarSenha && (
                <p className="text-xs text-rose-400 mt-1">{errors.confirmarSenha.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-4 py-3 px-4 bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white font-semibold rounded-xl shadow-lg shadow-brand-600/25 flex items-center justify-center gap-2 transition-all"
            >
              {isSubmitting ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Criar Minha Conta</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-800/80 text-center">
            <p className="text-sm text-slate-400">
              Já possui cadastro?{' '}
              <Link to={`/login${location.search}`} className="text-brand-600 font-semibold hover:underline">
                Faça login
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
