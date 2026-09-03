import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { agendaBlockService } from '../../services/appServices';
import { Modal } from '../../components/Modal';
import { formatApiError } from '../../services/api';
import { Ban, Plus, Trash2, AlertCircle } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export const AdminBlocksPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isWholeDay, setIsWholeDay] = useState(false);

  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [dataDiaInteiro, setDataDiaInteiro] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [motivo, setMotivo] = useState('');
  const [forcarSeConflito, setForcarSeConflito] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { data: blocks = [], isLoading } = useQuery({
    queryKey: ['admin-agenda-blocks'],
    queryFn: () => agendaBlockService.getBlocks({ includeInactive: false }),
  });

  const createBlockMutation = useMutation({
    mutationFn: () => {
      if (isWholeDay) {
        return agendaBlockService.createWholeDayBlock({
          data: dataDiaInteiro,
          motivo,
          forcarSeConflito,
        });
      }
      return agendaBlockService.createBlock({
        dataHoraInicio: new Date(dataInicio).toISOString(),
        dataHoraFim: new Date(dataFim).toISOString(),
        motivo,
        forcarSeConflito,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-agenda-blocks'] });
      setIsModalOpen(false);
    },
    onError: (err) => {
      setErrorMessage(formatApiError(err));
    },
  });

  const deleteBlockMutation = useMutation({
    mutationFn: (id: string) => agendaBlockService.deleteBlock(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-agenda-blocks'] });
    },
  });

  const openModal = () => {
    setIsWholeDay(false);
    setDataInicio('');
    setDataFim('');
    setDataDiaInteiro(format(new Date(), 'yyyy-MM-dd'));
    setMotivo('');
    setForcarSeConflito(false);
    setErrorMessage(null);
    setIsModalOpen(true);
  };

  const handleVerifyOrSave = () => {
    setErrorMessage(null);
    if (!motivo.trim()) {
      setErrorMessage('Informe o motivo do bloqueio.');
      return;
    }
    createBlockMutation.mutate();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Bloqueios da Agenda</h1>
          <p className="text-sm text-slate-400 mt-1">
            Impeça agendamentos em horários específicos, intervalos de almoço, manutenções ou dias inteiros.
          </p>
        </div>
        <button
          onClick={openModal}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-600 hover:bg-brand-500 text-white font-semibold text-sm rounded-2xl shadow-lg shadow-brand-600/20 transition-all self-start"
        >
          <Plus className="w-4 h-4" />
          <span>Novo Bloqueio</span>
        </button>
      </div>

      {isLoading ? (
        <div className="py-12 text-center text-slate-500 text-sm">Carregando bloqueios da agenda...</div>
      ) : blocks.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center max-w-md mx-auto">
          <Ban className="w-16 h-16 text-slate-600 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-white">Nenhum bloqueio ativo</h3>
          <p className="text-slate-400 text-xs mt-1">
            Não há nenhum intervalo ou dia bloqueado na agenda no momento.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {blocks.map((b) => (
            <div
              key={b.id}
              className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl flex items-start justify-between gap-4"
            >
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Ban className="w-4 h-4 text-rose-400" />
                  <h3 className="text-base font-bold text-white">{b.motivo}</h3>
                </div>
                <div className="text-xs text-slate-400 space-y-1">
                  <p>
                    <strong className="text-slate-300">Início:</strong>{' '}
                    {format(parseISO(b.dataHoraInicio), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                  </p>
                  <p>
                    <strong className="text-slate-300">Término:</strong>{' '}
                    {format(parseISO(b.dataHoraFim), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                  </p>
                  {b.criadoPorNome && <p className="text-slate-500">Cadastrado por: {b.criadoPorNome}</p>}
                </div>
              </div>

              <button
                onClick={() => {
                  if (confirm(`Remover bloqueio "${b.motivo}"?`)) {
                    deleteBlockMutation.mutate(b.id);
                  }
                }}
                className="p-2 text-slate-400 hover:text-rose-400 rounded-xl hover:bg-rose-500/10 transition-colors"
                title="Remover Bloqueio"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Modal Criar Bloqueio */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Cadastrar Bloqueio de Agenda">
        {errorMessage && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <div className="space-y-4">
          <div className="flex p-1 bg-slate-950 rounded-xl border border-slate-800 gap-1">
            <button
              type="button"
              onClick={() => setIsWholeDay(false)}
              className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                !isWholeDay ? 'bg-brand-600 text-white' : 'text-slate-400'
              }`}
            >
              Horário / Intervalo
            </button>
            <button
              type="button"
              onClick={() => setIsWholeDay(true)}
              className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                isWholeDay ? 'bg-brand-600 text-white' : 'text-slate-400'
              }`}
            >
              Dia Inteiro
            </button>
          </div>

          {isWholeDay ? (
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Data do Bloqueio
              </label>
              <input
                type="date"
                value={dataDiaInteiro}
                onChange={(e) => setDataDiaInteiro(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-brand-500"
              />
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Data e Hora Inicial
                </label>
                <input
                  type="datetime-local"
                  value={dataInicio}
                  onChange={(e) => setDataInicio(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-brand-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Data e Hora Final
                </label>
                <input
                  type="datetime-local"
                  value={dataFim}
                  onChange={(e) => setDataFim(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-brand-500"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Motivo do Bloqueio
            </label>
            <input
              type="text"
              placeholder="Ex: Feriado, Manutenção de Equipamentos, Compromisso"
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-brand-500"
            />
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="forcarCheckbox"
              checked={forcarSeConflito}
              onChange={(e) => setForcarSeConflito(e.target.checked)}
              className="w-4 h-4 rounded text-brand-500 bg-slate-950 border-slate-800"
            />
            <label htmlFor="forcarCheckbox" className="text-xs text-slate-400">
              Forçar criação mesmo se houver conflito (não cancela os agendamentos existentes)
            </label>
          </div>

          <div className="pt-4 border-t border-slate-800 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 text-slate-400 hover:text-white text-sm font-semibold"
            >
              Cancelar
            </button>
            <button
              type="button"
              disabled={createBlockMutation.isPending}
              onClick={handleVerifyOrSave}
              className="px-6 py-2.5 bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white text-sm font-semibold rounded-xl"
            >
              {createBlockMutation.isPending ? 'Salvando...' : 'Salvar Bloqueio'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
