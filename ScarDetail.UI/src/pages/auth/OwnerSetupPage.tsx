import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { AlertCircle, ArrowLeft, CheckCircle2, KeyRound, LockKeyhole, Mail, Phone, User } from 'lucide-react';
import { authService } from '../../services/authService';
import { formatApiError } from '../../services/api';
import { useAuth } from '../../contexts/useAuth';

const schema = z.object({
  nome: z.string().min(2, 'Informe seu nome'),
  email: z.string().email('Informe um e-mail válido'),
  telefone: z.string().min(10, 'Informe um telefone válido'),
  senha: z.string().min(10, 'Use pelo menos 10 caracteres'),
  confirmarSenha: z.string(),
}).refine((data) => data.senha === data.confirmarSenha, {
  message: 'As senhas não conferem',
  path: ['confirmarSenha'],
});

type FormData = z.infer<typeof schema>;

export const OwnerSetupPage: React.FC = () => {
  const { registerOwner, isAuthenticated, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { data: status, isLoading } = useQuery({
    queryKey: ['owner-setup-status'],
    queryFn: authService.getOwnerSetupStatus,
    retry: false,
  });
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  if (isAuthenticated && isAdmin) return <Navigate to="/admin/dashboard" replace />;

  const onSubmit = async ({ confirmarSenha: _, ...data }: FormData) => {
    try {
      setErrorMessage(null);
      await registerOwner(data);
      navigate('/admin/dashboard', { replace: true });
    } catch (error) {
      setErrorMessage(formatApiError(error));
    }
  };

  if (isLoading) {
    return <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-400">Verificando configuração...</div>;
  }

  if (status && !status.configuracaoDisponivel) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 p-4 text-white">
        <div className="w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900 p-8 text-center">
          <CheckCircle2 className="mx-auto mb-4 h-12 w-12 text-emerald-400" />
          <h1 className="text-xl font-black">Acesso já configurado</h1>
          <p className="mt-2 text-sm text-slate-400">Por segurança, somente um proprietário pode administrar o sistema.</p>
          <Link to="/admin/entrar" className="mt-6 inline-flex rounded-xl bg-amber-300 px-5 py-3 font-bold text-slate-950">Ir para o login administrativo</Link>
        </div>
      </div>
    );
  }

  const fieldClass = 'w-full rounded-xl border border-slate-700 bg-slate-950 py-3 pl-12 pr-4 text-sm text-white outline-none focus:border-amber-300';
  const fields = [
    { name: 'nome' as const, label: 'Seu nome', type: 'text', icon: User, autoComplete: 'name' },
    { name: 'email' as const, label: 'E-mail administrativo', type: 'email', icon: Mail, autoComplete: 'username' },
    { name: 'telefone' as const, label: 'Telefone / WhatsApp', type: 'tel', icon: Phone, autoComplete: 'tel' },
    { name: 'senha' as const, label: 'Crie uma senha', type: 'password', icon: LockKeyhole, autoComplete: 'new-password' },
    { name: 'confirmarSenha' as const, label: 'Confirme a senha', type: 'password', icon: LockKeyhole, autoComplete: 'new-password' },
  ];

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-10 text-white">
      <div className="mx-auto max-w-lg">
        <Link to="/admin/entrar" className="mb-7 inline-flex items-center gap-2 text-sm font-semibold text-slate-400 hover:text-white"><ArrowLeft className="h-4 w-4" /> Voltar</Link>
        <div className="mb-7">
          <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-300 text-slate-950"><KeyRound className="h-7 w-7" /></span>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-300">Configuração única</p>
          <h1 className="mt-1 text-3xl font-black">Crie seu acesso de proprietário</h1>
          <p className="mt-2 text-sm leading-relaxed text-slate-400">Este será o único usuário com acesso à agenda, preços, bairros e relatórios.</p>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 rounded-3xl border border-slate-800 bg-slate-900 p-6 sm:p-8">
          {errorMessage && <div className="flex gap-3 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-300"><AlertCircle className="h-5 w-5 shrink-0" />{errorMessage}</div>}
          {fields.map(({ name, label, type, icon: Icon, autoComplete }) => (
            <div key={name}>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-300">{label}</label>
              <div className="relative"><Icon className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" /><input {...register(name)} type={type} autoComplete={autoComplete} className={fieldClass} /></div>
              {errors[name] && <p className="mt-1 text-xs text-rose-400">{errors[name]?.message}</p>}
            </div>
          ))}
          <button disabled={isSubmitting} className="mt-2 flex w-full justify-center rounded-xl bg-amber-300 px-5 py-3 font-black text-slate-950 hover:bg-amber-200 disabled:opacity-50">{isSubmitting ? 'Criando acesso...' : 'Criar meu painel administrativo'}</button>
        </form>
      </div>
    </div>
  );
};
