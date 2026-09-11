import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../contexts/useAuth';
import { appointmentService, vehicleService, addressService } from '../../services/appServices';
import { Link } from 'react-router-dom';
import { StatusBadge } from '../../components/StatusBadge';
import {
  Sparkles,
  Calendar,
  Car,
  MapPin,
  Clock,
  ArrowRight,
  ChevronRight,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { formatDuration } from '../../utils/format';

export const ClientDashboardPage: React.FC = () => {
  const { user } = useAuth();

  const { data: appointments = [], isLoading: loadingAppts } = useQuery({
    queryKey: ['my-appointments'],
    queryFn: () => appointmentService.getMyAppointments(),
  });

  const { data: vehicles = [] } = useQuery({
    queryKey: ['my-vehicles'],
    queryFn: () => vehicleService.getMyVehicles(),
  });

  const { data: addresses = [] } = useQuery({
    queryKey: ['my-addresses'],
    queryFn: () => addressService.getMyAddresses(),
  });

  const nextAppointment = appointments.find(
    (a) => a.status === 'Pendente' || a.status === 'Confirmado' || a.status === 'ACaminho' || a.status === 'EmExecucao'
  );

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-brand-950 via-slate-900 to-slate-900 border border-brand-500/20 rounded-3xl p-6 sm:p-8 shadow-2xl">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/10 border border-brand-500/30 text-brand-400 text-xs font-semibold mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Estética Automotiva Premium a Domicílio</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white leading-tight">
            Olá, {user?.nome.split(' ')[0]}! Pronto para deixar seu carro impecável?
          </h1>
          <p className="text-slate-400 text-sm mt-2 leading-relaxed">
            Atendimento especializado no conforto da sua casa ou trabalho, com produtos de alta performance.
          </p>
          <div className="mt-6 flex flex-wrap gap-4">
            <Link
              to="/book"
              className="inline-flex items-center gap-2 px-6 py-3 bg-brand-600 hover:bg-brand-500 text-white font-semibold rounded-2xl shadow-lg shadow-brand-600/30 transition-all hover:scale-[1.02]"
            >
              <Sparkles className="w-4 h-4" />
              <span>Agendar Agora</span>
            </Link>
            <Link
              to="/services"
              className="inline-flex items-center gap-2 px-6 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-2xl border border-slate-700 transition-all"
            >
              <span>Ver Serviços & Preços</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Overview Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
        <Link
          to="/vehicles"
          className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 flex items-center justify-between transition-all group"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <Car className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-medium">Veículos Cadastrados</p>
              <p className="text-xl font-bold text-white mt-0.5">{vehicles.length}</p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-slate-500 group-hover:text-white transition-colors" />
        </Link>

        <Link
          to="/addresses"
          className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 flex items-center justify-between transition-all group"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <MapPin className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-medium">Endereços Salvos</p>
              <p className="text-xl font-bold text-white mt-0.5">{addresses.length}</p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-slate-500 group-hover:text-white transition-colors" />
        </Link>

        <Link
          to="/appointments"
          className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 flex items-center justify-between transition-all group"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-medium">Total de Atendimentos</p>
              <p className="text-xl font-bold text-white mt-0.5">{appointments.length}</p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-slate-500 group-hover:text-white transition-colors" />
        </Link>
      </div>

      {/* Próximo Atendimento em Destaque */}
      {nextAppointment && (
        <div className="bg-slate-900 border border-brand-500/30 rounded-3xl p-6 sm:p-8 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
            <div>
              <span className="text-xs font-semibold text-brand-400 uppercase tracking-wider">
                Próximo Atendimento Confirmado
              </span>
              <h2 className="text-xl font-bold text-white mt-1">{nextAppointment.servicoNome}</h2>
            </div>
            <StatusBadge status={nextAppointment.status} size="lg" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-6">
            <div className="flex items-start gap-3">
              <Clock className="w-5 h-5 text-slate-400 mt-0.5" />
              <div>
                <p className="text-xs text-slate-400">Data e Horário</p>
                <p className="text-sm font-semibold text-white mt-0.5">
                  {format(parseISO(nextAppointment.dataHoraInicio), "EEEE, dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}
                </p>
                <p className="text-xs text-slate-500">Duração estimada: {formatDuration(nextAppointment.duracaoMinutos)}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Car className="w-5 h-5 text-slate-400 mt-0.5" />
              <div>
                <p className="text-xs text-slate-400">Veículo</p>
                <p className="text-sm font-semibold text-white mt-0.5">
                  {nextAppointment.veiculoMarca} {nextAppointment.veiculoModelo}
                </p>
                <p className="text-xs text-brand-400 font-medium">{nextAppointment.veiculoCategoriaExibicao}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-slate-400 mt-0.5" />
              <div>
                <p className="text-xs text-slate-400">Local do Atendimento</p>
                <p className="text-sm font-semibold text-white mt-0.5 line-clamp-2">
                  {nextAppointment.enderecoCompleto}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-slate-800/80 flex justify-end">
            <Link
              to="/appointments"
              className="inline-flex items-center gap-2 text-sm font-semibold text-brand-400 hover:text-brand-300"
            >
              <span>Acompanhar e gerenciar agendamento</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      )}

      {/* Histórico Recente */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-white">Histórico de Atendimentos</h3>
          <Link to="/appointments" className="text-xs font-semibold text-brand-400 hover:underline">
            Ver todos
          </Link>
        </div>

        {loadingAppts ? (
          <div className="py-8 text-center text-slate-500 text-sm">Carregando histórico...</div>
        ) : appointments.length === 0 ? (
          <div className="py-12 text-center">
            <Calendar className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400 text-sm font-medium">Você ainda não realizou nenhum agendamento.</p>
            <Link
              to="/book"
              className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 bg-brand-600 hover:bg-brand-500 text-white text-sm font-semibold rounded-xl transition-all"
            >
              <Sparkles className="w-4 h-4" />
              <span>Agendar Primeiro Atendimento</span>
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-slate-800/80">
            {appointments.slice(0, 4).map((appt) => (
              <div key={appt.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-slate-400 flex-shrink-0">
                    <Sparkles className="w-5 h-5 text-brand-400" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-white">{appt.servicoNome}</h4>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {format(parseISO(appt.dataHoraInicio), "dd 'de' MMM, yyyy 'às' HH:mm", { locale: ptBR })} •{' '}
                      {appt.veiculoMarca} {appt.veiculoModelo} ({appt.veiculoCategoriaExibicao})
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between sm:justify-end gap-4">
                  <span className="text-sm font-bold text-white">
                    {appt.valorCobrado.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </span>
                  <StatusBadge status={appt.status} size="sm" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
