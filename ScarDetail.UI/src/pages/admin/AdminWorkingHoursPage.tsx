import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { workingHoursService } from '../../services/appServices';
import type { BusinessHour } from '../../types';
import { Modal } from '../../components/Modal';
import { formatApiError } from '../../services/api';
import { Clock, Edit2, AlertCircle } from 'lucide-react';

export const AdminWorkingHoursPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [editingHour, setEditingHour] = useState<BusinessHour | null>(null);
  const [abertura, setAbertura] = useState('08:00');
  const [fechamento, setFechamento] = useState('18:00');
  const [ativo, setAtivo] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { data: workingHours = [], isLoading } = useQuery({
    queryKey: ['admin-working-hours'],
    queryFn: () => workingHoursService.getAll(),
  });

  const updateMutation = useMutation({
    mutationFn: () =>
      workingHoursService.update(editingHour!.diaSemana, {
        horarioAbertura: abertura,
        horarioFechamento: fechamento,
        ativo,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-working-hours'] });
      setEditingHour(null);
    },
    onError: (err) => {
      setErrorMessage(formatApiError(err));
    },
  });

  const openEditModal = (h: BusinessHour) => {
    setEditingHour(h);
    setAbertura(h.horarioAbertura.substring(0, 5));
    setFechamento(h.horarioFechamento.substring(0, 5));
    setAtivo(h.ativo);
    setErrorMessage(null);
  };

  const dayNamesPt = [
    'Domingo',
    'Segunda-feira',
    'Terça-feira',
    'Quarta-feira',
    'Quinta-feira',
    'Sexta-feira',
    'Sábado',
  ];

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Horário de Funcionamento</h1>
        <p className="text-sm text-slate-400 mt-1">
          Configure a abertura e o encerramento do expediente para cada um dos 7 dias da semana (fuso America/Sao_Paulo).
        </p>
      </div>

      {isLoading ? (
        <div className="py-12 text-center text-slate-500 text-sm">Carregando horários de funcionamento...</div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl divide-y divide-slate-800">
          {workingHours.map((h) => (
            <div key={h.id} className="py-4.5 first:pt-0 last:pb-0 flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-brand-400">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-white">{dayNamesPt[h.diaSemana] || h.nomeDia}</h3>
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                        h.ativo
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                          : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                      }`}
                    >
                      {h.ativo ? 'Expediente Ativo' : 'Sem Atendimento'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {h.ativo
                      ? `${h.horarioAbertura.substring(0, 5)} às ${h.horarioFechamento.substring(0, 5)}`
                      : 'Nenhum horário liberado para agendamento'}
                  </p>
                </div>
              </div>

              <button
                onClick={() => openEditModal(h)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 flex items-center gap-1.5 transition-all"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>Editar Horário</span>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Modal Editar Horário */}
      <Modal
        isOpen={!!editingHour}
        onClose={() => setEditingHour(null)}
        title={editingHour ? `Editar Horário: ${dayNamesPt[editingHour.diaSemana]}` : 'Editar Horário'}
      >
        {errorMessage && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Horário de Abertura
              </label>
              <input
                type="time"
                value={abertura}
                onChange={(e) => setAbertura(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-brand-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Horário de Fechamento
              </label>
              <input
                type="time"
                value={fechamento}
                onChange={(e) => setFechamento(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-brand-500"
              />
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <input
              type="checkbox"
              id="ativoCheckbox"
              checked={ativo}
              onChange={(e) => setAtivo(e.target.checked)}
              className="w-4 h-4 rounded text-brand-500 focus:ring-brand-500 bg-slate-950 border-slate-800"
            />
            <label htmlFor="ativoCheckbox" className="text-sm font-medium text-slate-300">
              Dia com expediente ativo para agendamentos
            </label>
          </div>

          <div className="pt-4 border-t border-slate-800 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setEditingHour(null)}
              className="px-4 py-2 text-slate-400 hover:text-white text-sm font-semibold"
            >
              Cancelar
            </button>
            <button
              type="button"
              disabled={updateMutation.isPending}
              onClick={() => updateMutation.mutate()}
              className="px-6 py-2.5 bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white text-sm font-semibold rounded-xl"
            >
              {updateMutation.isPending ? 'Salvando...' : 'Salvar Alterações'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
