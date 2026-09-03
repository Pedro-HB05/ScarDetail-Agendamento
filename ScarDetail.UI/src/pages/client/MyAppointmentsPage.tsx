import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { appointmentService } from '../../services/appServices';
import type { Appointment, AppointmentStatus, TimeSlot } from '../../types';
import { StatusBadge, VehicleCategoryBadge } from '../../components/StatusBadge';
import { Modal } from '../../components/Modal';
import { formatApiError } from '../../services/api';
import {
  Calendar,
  Clock,
  Car,
  MapPin,
  AlertCircle,
  XCircle,
  RotateCcw,
  FileText,
  CheckCircle2,
  MessageCircle,
} from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { format, parseISO, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export const MyAppointmentsPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const [selectedStatus, setSelectedStatus] = useState<AppointmentStatus | 'Todos'>('Todos');
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);

  // Modais
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [isRescheduleModalOpen, setIsRescheduleModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  // Reschedule state
  const [cancelReason, setCancelReason] = useState('');
  const [newDate, setNewDate] = useState(format(addDays(new Date(), 1), 'yyyy-MM-dd'));
  const [newSlot, setNewSlot] = useState<TimeSlot | null>(null);
  const [rescheduleReason, setRescheduleReason] = useState('');
  const [modalError, setModalError] = useState<string | null>(null);

  const { data: appointments = [], isLoading } = useQuery({
    queryKey: ['my-appointments', selectedStatus],
    queryFn: () =>
      appointmentService.getMyAppointments(selectedStatus === 'Todos' ? undefined : selectedStatus),
  });

  // Query slots para reagendamento
  const { data: slotsData, isLoading: loadingSlots } = useQuery({
    queryKey: ['available-slots-reschedule', selectedAppointment?.planoId, newDate],
    queryFn: () => appointmentService.getAvailableSlots(selectedAppointment!.planoId, newDate),
    enabled: isRescheduleModalOpen && !!selectedAppointment && !!newDate,
  });

  const cancelMutation = useMutation({
    mutationFn: () => appointmentService.cancelAppointment(selectedAppointment!.id, cancelReason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-appointments'] });
      setIsCancelModalOpen(false);
      setCancelReason('');
    },
    onError: (err) => {
      setModalError(formatApiError(err));
    },
  });

  const rescheduleMutation = useMutation({
    mutationFn: () =>
      appointmentService.rescheduleAppointment(
        selectedAppointment!.id,
        newSlot!.dataHoraInicio,
        rescheduleReason
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-appointments'] });
      setIsRescheduleModalOpen(false);
      setNewSlot(null);
      setRescheduleReason('');
    },
    onError: (err) => {
      setModalError(formatApiError(err));
    },
  });

  const openCancelModal = (appt: Appointment) => {
    setSelectedAppointment(appt);
    setCancelReason('');
    setModalError(null);
    setIsCancelModalOpen(true);
  };

  const openRescheduleModal = (appt: Appointment) => {
    setSelectedAppointment(appt);
    setNewDate(format(addDays(new Date(), 1), 'yyyy-MM-dd'));
    setNewSlot(null);
    setRescheduleReason('');
    setModalError(null);
    setIsRescheduleModalOpen(true);
  };

  const openDetailsModal = (appt: Appointment) => {
    setSelectedAppointment(appt);
    setIsDetailsModalOpen(true);
  };

  const statusTabs: Array<AppointmentStatus | 'Todos'> = [
    'Todos',
    'Pendente',
    'Confirmado',
    'ACaminho',
    'EmExecucao',
    'Finalizado',
    'Cancelado',
  ];

  return (
    <div className="space-y-6">
      {searchParams.get('success') === 'true' && (
        <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-5 text-emerald-950 shadow-sm sm:p-6">
          <div className="flex items-start gap-4">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-600 text-white"><CheckCircle2 className="h-6 w-6" /></span>
            <div className="flex-1">
              <h2 className="text-lg font-black">Agendamento confirmado!</h2>
              <p className="mt-1 text-sm text-emerald-800">Seu horário está reservado. Deixe o veículo e um ponto de energia e água acessíveis no horário combinado.</p>
              {import.meta.env.VITE_WHATSAPP_NUMBER && (
                <a href={`https://wa.me/${String(import.meta.env.VITE_WHATSAPP_NUMBER).replace(/\D/g, '')}`} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-emerald-500"><MessageCircle className="h-4 w-4" />Falar pelo WhatsApp</a>
              )}
            </div>
          </div>
        </div>
      )}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">Meus Agendamentos</h1>
          <p className="text-sm text-slate-400 mt-1">
            Acompanhe o status do seu atendimento em tempo real, solicite reagendamento ou cancelamento.
          </p>
        </div>
      </div>

      {/* Tabs de Filtro de Status */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-800">
        {statusTabs.map((status) => (
          <button
            key={status}
            onClick={() => setSelectedStatus(status)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              selectedStatus === status
                ? 'bg-brand-600 text-white shadow-md shadow-brand-600/20'
                : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            {status === 'Todos'
              ? 'Todos os Atendimentos'
              : status === 'ACaminho'
              ? 'A Caminho'
              : status === 'EmExecucao'
              ? 'Em Execução'
              : status}
          </button>
        ))}
      </div>

      {/* Lista de Agendamentos */}
      {isLoading ? (
        <div className="py-12 text-center text-slate-500 text-sm">Carregando agendamentos...</div>
      ) : appointments.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center max-w-md mx-auto">
          <Calendar className="w-16 h-16 text-slate-600 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-white">Nenhum agendamento encontrado</h3>
          <p className="text-slate-400 text-xs mt-1">
            {selectedStatus !== 'Todos'
              ? `Não há agendamentos com status "${selectedStatus}".`
              : 'Você ainda não possui agendamentos cadastrados.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {appointments.map((appt) => (
            <div
              key={appt.id}
              className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl hover:border-slate-700 transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-6"
            >
              <div className="space-y-3 flex-1">
                <div className="flex flex-wrap items-center gap-3">
                  <h3 className="text-lg font-bold text-white">{appt.servicoNome}</h3>
                  <StatusBadge status={appt.status} size="md" />
                  <span className="text-sm font-bold text-emerald-400">
                    {appt.valorCobrado.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-slate-400 pt-1">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-brand-400" />
                    <span>
                      {format(parseISO(appt.dataHoraInicio), "dd 'de' MMM, yyyy 'às' HH:mm", { locale: ptBR })}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Car className="w-4 h-4 text-blue-400" />
                    <span>
                      {appt.veiculoMarca} {appt.veiculoModelo}
                    </span>
                    <VehicleCategoryBadge category={appt.veiculoCategoria} />
                  </div>

                  <div className="flex items-center gap-2 truncate">
                    <MapPin className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    <span className="truncate">{appt.enderecoCompleto}</span>
                  </div>
                </div>

                {appt.observacoes && (
                  <p className="text-xs text-slate-400 italic bg-slate-950 p-2.5 rounded-xl border border-slate-800/80">
                    "{appt.observacoes}"
                  </p>
                )}

                {appt.status === 'Cancelado' && appt.motivoCancelamento && (
                  <p className="text-xs text-rose-400 bg-rose-500/10 p-2.5 rounded-xl border border-rose-500/20">
                    <span className="font-semibold">Motivo do cancelamento:</span> {appt.motivoCancelamento}
                  </p>
                )}
              </div>

              {/* Ações */}
              <div className="flex items-center gap-2 pt-4 lg:pt-0 border-t lg:border-t-0 border-slate-800 flex-shrink-0">
                <button
                  onClick={() => openDetailsModal(appt)}
                  className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 flex items-center gap-1.5 transition-all"
                >
                  <FileText className="w-4 h-4" />
                  <span>Histórico</span>
                </button>

                {(appt.status === 'Pendente' || appt.status === 'Confirmado') && (
                  <>
                    <button
                      onClick={() => openRescheduleModal(appt)}
                      className="px-3.5 py-2 bg-brand-600/10 hover:bg-brand-600/20 text-brand-400 text-xs font-semibold rounded-xl border border-brand-500/30 flex items-center gap-1.5 transition-all"
                    >
                      <RotateCcw className="w-4 h-4" />
                      <span>Reagendar</span>
                    </button>
                    <button
                      onClick={() => openCancelModal(appt)}
                      className="px-3.5 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-semibold rounded-xl border border-rose-500/30 flex items-center gap-1.5 transition-all"
                    >
                      <XCircle className="w-4 h-4" />
                      <span>Cancelar</span>
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de Cancelamento */}
      <Modal
        isOpen={isCancelModalOpen}
        onClose={() => setIsCancelModalOpen(false)}
        title="Cancelar Agendamento"
      >
        {modalError && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{modalError}</span>
          </div>
        )}

        <div className="space-y-4">
          <p className="text-sm text-slate-300">
            Tem certeza que deseja cancelar o agendamento de{' '}
            <strong className="text-white">{selectedAppointment?.servicoNome}</strong>?
          </p>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Motivo do cancelamento (obrigatório)
            </label>
            <textarea
              rows={3}
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Informe o motivo do cancelamento..."
              className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-brand-500"
            />
          </div>

          <div className="pt-4 border-t border-slate-800 flex justify-end gap-3">
            <button
              onClick={() => setIsCancelModalOpen(false)}
              className="px-4 py-2 text-slate-400 hover:text-white text-sm font-semibold"
            >
              Voltar
            </button>
            <button
              disabled={!cancelReason.trim() || cancelMutation.isPending}
              onClick={() => cancelMutation.mutate()}
              className="px-5 py-2.5 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white text-sm font-semibold rounded-xl"
            >
              {cancelMutation.isPending ? 'Cancelando...' : 'Confirmar Cancelamento'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal de Reagendamento */}
      <Modal
        isOpen={isRescheduleModalOpen}
        onClose={() => setIsRescheduleModalOpen(false)}
        title="Solicitar Reagendamento"
        maxWidth="lg"
      >
        {modalError && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{modalError}</span>
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Nova Data do Atendimento
            </label>
            <input
              type="date"
              value={newDate}
              min={format(addDays(new Date(), 0), 'yyyy-MM-dd')}
              max={format(addDays(new Date(), 60), 'yyyy-MM-dd')}
              onChange={(e) => {
                setNewDate(e.target.value);
                setNewSlot(null);
              }}
              className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-brand-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Escolha o Novo Horário
            </label>
            {loadingSlots ? (
              <p className="text-xs text-slate-500 py-4 text-center">Consultando horários disponíveis...</p>
            ) : !slotsData || slotsData.slots.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">Nenhum horário disponível para esta data.</p>
            ) : (
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 max-h-48 overflow-y-auto p-1">
                {slotsData.slots.map((slot) => {
                  const isSelected = newSlot?.dataHoraInicio === slot.dataHoraInicio;
                  return (
                    <button
                      key={slot.dataHoraInicio}
                      type="button"
                      disabled={!slot.disponivel}
                      onClick={() => setNewSlot(slot)}
                      className={`py-2 px-2 rounded-xl text-xs font-semibold border transition-all ${
                        isSelected
                          ? 'bg-brand-600 border-brand-500 text-white'
                          : slot.disponivel
                          ? 'bg-slate-950 border-slate-800 text-slate-200 hover:border-brand-500'
                          : 'bg-slate-950/40 border-slate-800/40 text-slate-600 opacity-40 line-through cursor-not-allowed'
                      }`}
                    >
                      {slot.horarioInicioFormatado}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Motivo do Reagendamento (opcional)
            </label>
            <input
              type="text"
              value={rescheduleReason}
              onChange={(e) => setRescheduleReason(e.target.value)}
              placeholder="Ex: Mudança de planos, imprevisto..."
              className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-brand-500"
            />
          </div>

          <div className="pt-4 border-t border-slate-800 flex justify-end gap-3">
            <button
              onClick={() => setIsRescheduleModalOpen(false)}
              className="px-4 py-2 text-slate-400 hover:text-white text-sm font-semibold"
            >
              Cancelar
            </button>
            <button
              disabled={!newSlot || rescheduleMutation.isPending}
              onClick={() => rescheduleMutation.mutate()}
              className="px-6 py-2.5 bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white text-sm font-semibold rounded-xl"
            >
              {rescheduleMutation.isPending ? 'Salvando...' : 'Confirmar Reagendamento'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal de Detalhes & Histórico */}
      <Modal
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        title="Histórico do Atendimento"
        maxWidth="lg"
      >
        <div className="space-y-6">
          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2 text-xs text-slate-400">
            <div className="flex justify-between">
              <span>Serviço:</span>
              <span className="text-white font-semibold">{selectedAppointment?.servicoNome}</span>
            </div>
            <div className="flex justify-between">
              <span>Veículo:</span>
              <span className="text-white font-semibold">
                {selectedAppointment?.veiculoMarca} {selectedAppointment?.veiculoModelo} ({selectedAppointment?.veiculoCategoriaExibicao})
              </span>
            </div>
            <div className="flex justify-between">
              <span>Valor Snapshot:</span>
              <span className="text-emerald-400 font-bold">
                {selectedAppointment?.valorCobrado.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Endereço:</span>
              <span className="text-white text-right max-w-xs truncate">{selectedAppointment?.enderecoCompleto}</span>
            </div>
          </div>

          {/* Histórico de Transições */}
          <div>
            <h4 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
              <Clock className="w-4 h-4 text-brand-400" />
              <span>Linha do Tempo de Status</span>
            </h4>

            <div className="space-y-3 relative before:absolute before:left-3.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-800">
              {selectedAppointment?.historicoStatus.map((h, i) => (
                <div key={h.id || i} className="relative flex items-start gap-4 pl-8">
                  <div className="absolute left-2 top-1.5 w-3.5 h-3.5 rounded-full bg-brand-500 border-2 border-slate-900" />
                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <StatusBadge status={h.statusNovo} size="sm" />
                      <span className="text-[10px] text-slate-500">
                        {format(parseISO(h.criadoEm), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                      </span>
                    </div>
                    {h.observacao && <p className="text-xs text-slate-300 mt-1.5">{h.observacao}</p>}
                    {h.alteradoPorNome && (
                      <p className="text-[10px] text-slate-500 mt-1">Responsável: {h.alteradoPorNome}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};
