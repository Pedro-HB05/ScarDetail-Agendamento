import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { reportService, appointmentService } from '../../services/appServices';
import { Link } from 'react-router-dom';
import { StatusBadge } from '../../components/StatusBadge';
import {
  TrendingUp,
  CalendarCheck,
  Clock,
  ArrowRight,
  DollarSign,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export const AdminDashboardPage: React.FC = () => {
  const { data: overview } = useQuery({
    queryKey: ['admin-overview'],
    queryFn: () => reportService.getAgendaOverview(),
  });

  const { data: todayAppointments = [], isLoading: loadingAppts } = useQuery({
    queryKey: ['admin-appointments-today'],
    queryFn: () => {
      const now = new Date();
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
      const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59).toISOString();
      return appointmentService.getAdminAppointments({ dataInicio: startOfDay, dataFim: endOfDay });
    },
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Painel Administrativo</h1>
          <p className="text-sm text-slate-400 mt-1">
            Visão consolidada da operação, agenda em tempo real e faturamento da estética.
          </p>
        </div>
        <Link
          to="/admin/agenda"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-600 hover:bg-brand-500 text-white font-semibold text-sm rounded-2xl shadow-lg shadow-brand-600/20 transition-all self-start"
        >
          <CalendarCheck className="w-4 h-4" />
          <span>Ver Agenda Completa</span>
        </Link>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Atendimentos Hoje</span>
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-black text-white mt-3">{overview?.totalHoje ?? 0}</p>
          <p className="text-xs text-slate-500 mt-1">
            {overview?.pendentesHoje ?? 0} pendentes • {overview?.confirmadosHoje ?? 0} confirmados
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Esta Semana</span>
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
              <CalendarCheck className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-black text-white mt-3">{overview?.totalSemana ?? 0}</p>
          <p className="text-xs text-slate-500 mt-1">Total agendado nos 7 dias</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Faturamento Realizado</span>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-black text-emerald-400 mt-3">
            {(overview?.faturamentoMesRealizado ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </p>
          <p className="text-xs text-slate-500 mt-1">Pagamentos registrados este mês</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Previsão Mensal</span>
            <div className="w-10 h-10 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-400">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-black text-white mt-3">
            {(overview?.faturamentoMesEstimado ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </p>
          <p className="text-xs text-slate-500 mt-1">{overview?.totalMes ?? 0} atendimentos agendados</p>
        </div>
      </div>

      {/* Agenda do Dia */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl">
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-800">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Clock className="w-5 h-5 text-brand-400" />
              <span>Agenda de Hoje ({format(new Date(), "dd 'de' MMMM", { locale: ptBR })})</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">Atendimentos programados para o dia de hoje</p>
          </div>
          <Link
            to="/admin/agenda"
            className="text-xs font-semibold text-brand-400 hover:text-brand-300 flex items-center gap-1"
          >
            <span>Gerenciar todos</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {loadingAppts ? (
          <div className="py-12 text-center text-slate-500 text-sm">Carregando atendimentos de hoje...</div>
        ) : todayAppointments.length === 0 ? (
          <div className="py-12 text-center text-slate-500 text-sm">
            Nenhum atendimento agendado para hoje até o momento.
          </div>
        ) : (
          <div className="space-y-4">
            {todayAppointments.map((appt) => (
              <div
                key={appt.id}
                className="bg-slate-950 border border-slate-800/90 rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <span className="text-base font-black text-brand-400">
                      {format(parseISO(appt.dataHoraInicio), 'HH:mm')}
                    </span>
                    <h3 className="text-sm font-bold text-white">{appt.servicoNome}</h3>
                    <StatusBadge status={appt.status} size="sm" />
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400">
                    <span className="text-white font-medium">Cliente: {appt.clienteNome} ({appt.clienteTelefone})</span>
                    <span>•</span>
                    <span>
                      {appt.veiculoMarca} {appt.veiculoModelo} ({appt.veiculoCategoriaExibicao})
                    </span>
                    <span>•</span>
                    <span className="truncate max-w-xs">{appt.enderecoCompleto}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold text-white">
                    {appt.valorCobrado.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </span>
                  <Link
                    to={`/admin/agenda?highlight=${appt.id}`}
                    className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl transition-colors"
                  >
                    Gerenciar
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
