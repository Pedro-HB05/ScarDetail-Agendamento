import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { appointmentService } from '../../services/appServices';
import type { Appointment, AppointmentStatus } from '../../types';
import { StatusBadge, VehicleCategoryBadge } from '../../components/StatusBadge';
import { Modal } from '../../components/Modal';
import { formatApiError } from '../../services/api';
import {
  CalendarCheck,
  Search,
  CheckCircle2,
  XCircle,
  Truck,
  Wrench,
  DollarSign,
  AlertCircle,
} from 'lucide-react';
import { format, parseISO, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Link } from 'react-router-dom';

export const AdminAgendaPage: React.FC = () => {
  const queryClient = useQueryClient();

  // Filtros
  const [selectedStatus, setSelectedStatus] = useState<AppointmentStatus | 'Todos'>('Todos');
  const [searchFilter, setSearchFilter] = useState('');
  const [dateFilterMode, setDateFilterMode] = useState<'Hoje' | 'Semana' | 'Mes' | 'Personalizado'>('Hoje');

  const [dataInicio, setDataInicio] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [dataFim, setDataFim] = useState(format(new Date(), 'yyyy-MM-dd'));

  // Modais de Transição de Status
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [targetStatus, setTargetStatus] = useState<AppointmentStatus>('Confirmado');
  const [statusObservation, setStatusObservation] = useState('');
  const [modalError, setModalError] = useState<string | null>(null);

  // Calcular datas pelo modo de filtro
  const getFilterDates = () => {
    const now = new Date();
    switch (dateFilterMode) {
      case 'Hoje':
        return {
          start: new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString(),
          end: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59).toISOString(),
        };
      case 'Semana':
        return {
          start: startOfWeek(now, { weekStartsOn: 0 }).toISOString(),
          end: endOfWeek(now, { weekStartsOn: 0 }).toISOString(),
        };
      case 'Mes':
        return {
          start: startOfMonth(now).toISOString(),
          end: endOfMonth(now).toISOString(),
        };
      case 'Personalizado':
        return {
          start: new Date(dataInicio).toISOString(),
          end: new Date(`${dataFim}T23:59:59`).toISOString(),
        };
    }
  };

  const dates = getFilterDates();

  const { data: appointments = [], isLoading } = useQuery({
    queryKey: ['admin-appointments', dateFilterMode, dataInicio, dataFim, selectedStatus],
    queryFn: () =>
      appointmentService.getAdminAppointments({
        dataInicio: dates.start,
        dataFim: dates.end,
        status: selectedStatus === 'Todos' ? undefined : selectedStatus,
      }),
  });

  const updateStatusMutation = useMutation({
    mutationFn: () =>
      appointmentService.updateStatus(selectedAppointment!.id, targetStatus, statusObservation),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-appointments'] });
      setIsStatusModalOpen(false);
      setStatusObservation('');
    },
    onError: (err) => {
      setModalError(formatApiError(err));
    },
  });

  const openStatusModal = (appt: Appointment, newStatus: AppointmentStatus) => {
    setSelectedAppointment(appt);
    setTargetStatus(newStatus);
    setStatusObservation('');
    setModalError(null);
    setIsStatusModalOpen(true);
  };

  const filteredAppointments = appointments.filter((a) => {
    if (!searchFilter.trim()) return true;
    const term = searchFilter.toLowerCase();
    return (
      a.clienteNome.toLowerCase().includes(term) ||
      a.clienteTelefone.includes(term) ||
      a.servicoNome.toLowerCase().includes(term) ||
      a.veiculoModelo.toLowerCase().includes(term) ||
      a.veiculoPlaca?.toLowerCase().includes(term) ||
      a.enderecoCompleto.toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Agenda de Atendimentos</h1>
          <p className="text-sm text-slate-400 mt-1">
            Controle de fluxo de status, visualização da agenda e despacho da equipe.
          </p>
        </div>
      </div>

      {/* Controles de Filtro & Busca */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="inline-flex p-1 bg-slate-950 border border-slate-800 rounded-2xl gap-1">
            {(['Hoje', 'Semana', 'Mes', 'Personalizado'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setDateFilterMode(mode)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  dateFilterMode === mode
                    ? 'bg-brand-600 text-white shadow-md shadow-brand-600/25'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {mode === 'Mes' ? 'Este Mês' : mode === 'Semana' ? 'Esta Semana' : mode}
              </button>
            ))}
          </div>

          {dateFilterMode === 'Personalizado' && (
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={dataInicio}
                onChange={(e) => setDataInicio(e.target.value)}
                className="px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
              />
              <span className="text-xs text-slate-500">até</span>
              <input
                type="date"
                value={dataFim}
                onChange={(e) => setDataFim(e.target.value)}
                className="px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
              />
            </div>
          )}

          <div className="flex-1 min-w-[240px] relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder="Buscar por cliente, placa, telefone, modelo..."
              className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500"
            />
          </div>
        </div>

        {/* Filtro por Status */}
        <div className="flex items-center gap-2 overflow-x-auto pt-2 border-t border-slate-800/80">
          {(['Todos', 'Pendente', 'Confirmado', 'ACaminho', 'EmExecucao', 'Finalizado', 'Cancelado'] as const).map(
            (status) => (
              <button
                key={status}
                onClick={() => setSelectedStatus(status)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  selectedStatus === status
                    ? 'bg-brand-600/20 text-brand-400 border border-brand-500/40'
                    : 'text-slate-400 hover:text-white bg-slate-950/60 border border-slate-800/80'
                }`}
              >
                {status === 'Todos'
                  ? 'Todos os Status'
                  : status === 'ACaminho'
                  ? 'A Caminho'
                  : status === 'EmExecucao'
                  ? 'Em Execução'
                  : status}
              </button>
            )
          )}
        </div>
      </div>

      {/* Lista de Atendimentos */}
      {isLoading ? (
        <div className="py-12 text-center text-slate-500 text-sm">Carregando agenda...</div>
      ) : filteredAppointments.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center max-w-md mx-auto">
          <CalendarCheck className="w-16 h-16 text-slate-600 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-white">Nenhum agendamento encontrado</h3>
          <p className="text-slate-400 text-xs mt-1">Não há atendimentos para o período ou filtros selecionados.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredAppointments.map((appt) => (
            <div
              key={appt.id}
              className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col xl:flex-row xl:items-center justify-between gap-6"
            >
              <div className="space-y-3 flex-1">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-base font-black text-brand-400">
                    {format(parseISO(appt.dataHoraInicio), "dd/MM 'às' HH:mm", { locale: ptBR })}
                  </span>
                  <h3 className="text-base font-bold text-white">{appt.servicoNome}</h3>
                  <StatusBadge status={appt.status} size="md" />
                  <span className="text-sm font-bold text-emerald-400">
                    {appt.valorCobrado.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-slate-400">
                  <div>
                    <span className="text-slate-500 font-medium">Cliente:</span>{' '}
                    <strong className="text-white">{appt.clienteNome}</strong>
                    <p className="text-slate-400 mt-0.5">{appt.clienteTelefone}</p>
                  </div>

                  <div>
                    <span className="text-slate-500 font-medium">Veículo:</span>{' '}
                    <span className="text-white">
                      {appt.veiculoMarca} {appt.veiculoModelo}
                    </span>
                    <div className="mt-0.5">
                      <VehicleCategoryBadge category={appt.veiculoCategoria} />
                    </div>
                  </div>

                  <div>
                    <span className="text-slate-500 font-medium">Local:</span>
                    <p className="text-white truncate" title={appt.enderecoCompleto}>
                      {appt.enderecoCompleto}
                    </p>
                  </div>
                </div>

                {appt.observacoes && (
                  <p className="text-xs text-slate-300 italic bg-slate-950 p-2.5 rounded-xl border border-slate-800/80">
                    Obs cliente: "{appt.observacoes}"
                  </p>
                )}
              </div>

              {/* Controles de Status do Fluxo da Estética */}
              <div className="flex flex-wrap items-center gap-2 pt-4 xl:pt-0 border-t xl:border-t-0 border-slate-800">
                {appt.status === 'Pendente' && (
                  <>
                    <button
                      onClick={() => openStatusModal(appt, 'Confirmado')}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-md shadow-blue-600/20"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Confirmar</span>
                    </button>
                    <button
                      onClick={() => openStatusModal(appt, 'Cancelado')}
                      className="px-3.5 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-semibold rounded-xl border border-rose-500/30"
                    >
                      <XCircle className="w-4 h-4" />
                      <span>Cancelar</span>
                    </button>
                  </>
                )}

                {appt.status === 'Confirmado' && (
                  <>
                    <button
                      onClick={() => openStatusModal(appt, 'ACaminho')}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-md shadow-indigo-600/20"
                    >
                      <Truck className="w-4 h-4" />
                      <span>A Caminho</span>
                    </button>
                    <button
                      onClick={() => openStatusModal(appt, 'Cancelado')}
                      className="px-3.5 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-semibold rounded-xl border border-rose-500/30"
                    >
                      <XCircle className="w-4 h-4" />
                      <span>Cancelar</span>
                    </button>
                  </>
                )}

                {appt.status === 'ACaminho' && (
                  <button
                    onClick={() => openStatusModal(appt, 'EmExecucao')}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-md shadow-purple-600/20 animate-pulse"
                  >
                    <Wrench className="w-4 h-4" />
                    <span>Iniciar Serviço</span>
                  </button>
                )}

                {appt.status === 'EmExecucao' && (
                  <Link
                    to={`/admin/payments?appointmentId=${appt.id}`}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-md shadow-emerald-600/20"
                  >
                    <DollarSign className="w-4 h-4" />
                    <span>Finalizar & Registrar Pagamento</span>
                  </Link>
                )}

                {appt.status === 'Finalizado' && (
                  <span className="px-3 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Atendimento Concluído</span>
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de Transição de Status */}
      <Modal
        isOpen={isStatusModalOpen}
        onClose={() => setIsStatusModalOpen(false)}
        title={`Avançar Status para "${targetStatus}"`}
      >
        {modalError && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{modalError}</span>
          </div>
        )}

        <div className="space-y-4">
          <p className="text-sm text-slate-300">
            Confirma a alteração do atendimento de{' '}
            <strong className="text-white">{selectedAppointment?.clienteNome}</strong> para o status{' '}
            <strong className="text-brand-400">{targetStatus}</strong>?
          </p>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Observação / Justificativa {targetStatus === 'Cancelado' && '(obrigatório)'}
            </label>
            <textarea
              rows={3}
              value={statusObservation}
              onChange={(e) => setStatusObservation(e.target.value)}
              placeholder="Adicione um comentário para o histórico..."
              className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-brand-500"
            />
          </div>

          <div className="pt-4 border-t border-slate-800 flex justify-end gap-3">
            <button
              onClick={() => setIsStatusModalOpen(false)}
              className="px-4 py-2 text-slate-400 hover:text-white text-sm font-semibold"
            >
              Cancelar
            </button>
            <button
              disabled={updateStatusMutation.isPending}
              onClick={() => updateStatusMutation.mutate()}
              className="px-6 py-2.5 bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white text-sm font-semibold rounded-xl"
            >
              {updateStatusMutation.isPending ? 'Atualizando...' : 'Confirmar Alteração'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
