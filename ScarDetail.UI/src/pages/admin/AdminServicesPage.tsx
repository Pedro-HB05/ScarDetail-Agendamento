import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { planService } from '../../services/appServices';
import type { ServicePlan } from '../../types';
import { Modal } from '../../components/Modal';
import { formatApiError } from '../../services/api';
import { Plus, Edit2, Clock, History, AlertCircle, ToggleLeft, ToggleRight } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { formatDuration } from '../../utils/format';

const serviceSchema = z.object({
  nome: z.string().min(1, 'O nome do serviço é obrigatório'),
  descricao: z.string().optional(),
  duracaoMinutos: z.coerce.number().min(1, 'A duração deve ser de no mínimo 1 minuto'),
  precoHatch: z.coerce.number().min(0, 'O valor não pode ser negativo'),
  precoSedan: z.coerce.number().min(0, 'O valor não pode ser negativo'),
  precoSuv: z.coerce.number().min(0, 'O valor não pode ser negativo'),
  precoCamionete: z.coerce.number().min(0, 'O valor não pode ser negativo'),
  precoWagon: z.coerce.number().min(0, 'O valor não pode ser negativo'),
});

type ServiceFormData = z.infer<typeof serviceSchema>;

export const AdminServicesPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<ServicePlan | null>(null);
  const [selectedPlanForAudit, setSelectedPlanForAudit] = useState<ServicePlan | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { data: services = [], isLoading } = useQuery({
    queryKey: ['admin-services'],
    queryFn: () => planService.getAllServicesAdmin(),
  });

  const { data: auditHistory = [], isLoading: loadingAudits } = useQuery({
    queryKey: ['admin-plan-audits', selectedPlanForAudit?.id],
    queryFn: () => planService.getPlanAudits(selectedPlanForAudit!.id),
    enabled: !!selectedPlanForAudit && isAuditModalOpen,
  });

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ServiceFormData>({
    resolver: zodResolver(serviceSchema),
    defaultValues: {
      duracaoMinutos: 60,
      precoHatch: 45,
      precoSedan: 55,
      precoSuv: 65,
      precoCamionete: 80,
      precoWagon: 55,
    },
  });

  const openCreateModal = () => {
    setEditingPlan(null);
    reset({
      nome: '',
      descricao: '',
      duracaoMinutos: 60,
      precoHatch: 45,
      precoSedan: 55,
      precoSuv: 65,
      precoCamionete: 80,
      precoWagon: 55,
    });
    setErrorMessage(null);
    setIsModalOpen(true);
  };

  const openEditModal = (plan: ServicePlan) => {
    setEditingPlan(plan);
    setValue('nome', plan.nome);
    setValue('descricao', plan.descricao || '');
    setValue('duracaoMinutos', plan.duracaoMinutos);
    setValue('precoHatch', plan.precoHatch);
    setValue('precoSedan', plan.precoSedan);
    setValue('precoSuv', plan.precoSuv);
    setValue('precoCamionete', plan.precoCamionete);
    setValue('precoWagon', plan.precoWagon);
    setErrorMessage(null);
    setIsModalOpen(true);
  };

  const openAuditModal = (plan: ServicePlan) => {
    setSelectedPlanForAudit(plan);
    setIsAuditModalOpen(true);
  };

  const createOrUpdateMutation = useMutation({
    mutationFn: (data: ServiceFormData) => {
      if (editingPlan) {
        return planService.updateService(editingPlan.id, {
          ...data,
          ativo: editingPlan.ativo,
        });
      }
      return planService.createService(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-services'] });
      setIsModalOpen(false);
    },
    onError: (err) => {
      setErrorMessage(formatApiError(err));
    },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) =>
      planService.toggleServiceStatus(id, active),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-services'] });
    },
  });

  const onSubmit = (data: ServiceFormData) => {
    createOrUpdateMutation.mutate(data);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Serviços & Preços</h1>
          <p className="text-sm text-slate-400 mt-1">
            Cadastre os serviços e defina preços específicos para Hatch, Sedan, SUV, Camionete e Wagon.
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-600 hover:bg-brand-500 text-white font-semibold text-sm rounded-2xl shadow-lg shadow-brand-600/20 transition-all self-start"
        >
          <Plus className="w-4 h-4" />
          <span>Novo Serviço</span>
        </button>
      </div>

      {isLoading ? (
        <div className="py-12 text-center text-slate-500 text-sm">Carregando serviços...</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {services.map((plan) => (
            <div
              key={plan.id}
              className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-bold text-white">{plan.nome}</h3>
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                          plan.ativo
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                            : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                        }`}
                      >
                        {plan.ativo ? 'Ativo' : 'Inativo'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1 line-clamp-2">{plan.descricao}</p>
                  </div>

                  <span className="flex items-center gap-1 text-xs font-semibold text-slate-300 bg-slate-800 px-2.5 py-1 rounded-full flex-shrink-0">
                    <Clock className="w-3.5 h-3.5 text-brand-400" />
                    <span>{formatDuration(plan.duracaoMinutos)}</span>
                  </span>
                </div>

                {/* Grade de Preços por Categoria com Wagon */}
                <div className="mt-6 pt-4 border-t border-slate-800/80">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Tabela de Preços por Categoria:
                  </p>
                  <div className="grid grid-cols-5 gap-2 text-center">
                    <div className="bg-slate-950 p-2 rounded-xl border border-slate-800/80">
                      <p className="text-[10px] text-slate-500 font-bold">Hatch</p>
                      <p className="text-xs font-bold text-white mt-0.5">R$ {plan.precoHatch.toFixed(2)}</p>
                    </div>
                    <div className="bg-slate-950 p-2 rounded-xl border border-slate-800/80">
                      <p className="text-[10px] text-slate-500 font-bold">Sedan</p>
                      <p className="text-xs font-bold text-white mt-0.5">R$ {plan.precoSedan.toFixed(2)}</p>
                    </div>
                    <div className="bg-slate-950 p-2 rounded-xl border border-slate-800/80">
                      <p className="text-[10px] text-slate-500 font-bold">SUV</p>
                      <p className="text-xs font-bold text-white mt-0.5">R$ {plan.precoSuv.toFixed(2)}</p>
                    </div>
                    <div className="bg-slate-950 p-2 rounded-xl border border-slate-800/80">
                      <p className="text-[10px] text-slate-500 font-bold">Camionete</p>
                      <p className="text-xs font-bold text-white mt-0.5">R$ {plan.precoCamionete.toFixed(2)}</p>
                    </div>
                    <div className="bg-brand-600/10 p-2 rounded-xl border border-brand-500/30">
                      <p className="text-[10px] text-brand-400 font-bold">Wagon</p>
                      <p className="text-xs font-bold text-white mt-0.5">R$ {plan.precoWagon.toFixed(2)}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between">
                <button
                  onClick={() => openAuditModal(plan)}
                  className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-brand-300 font-medium transition-colors"
                >
                  <History className="w-4 h-4" />
                  <span>Histórico de Alterações</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleStatusMutation.mutate({ id: plan.id, active: !plan.ativo })}
                    className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
                    title={plan.ativo ? 'Desativar Serviço' : 'Ativar Serviço'}
                  >
                    {plan.ativo ? (
                      <ToggleRight className="w-5 h-5 text-emerald-400" />
                    ) : (
                      <ToggleLeft className="w-5 h-5 text-slate-600" />
                    )}
                  </button>
                  <button
                    onClick={() => openEditModal(plan)}
                    className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
                    title="Editar Preços e Duração"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Criar / Editar Serviço */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingPlan ? 'Editar Serviço e Preços' : 'Cadastrar Novo Serviço'}
        maxWidth="lg"
      >
        {errorMessage && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Nome do Serviço
              </label>
              <input
                type="text"
                placeholder="Ex: Lavagem Detalhada (Técnica), Lavagem Completa (Com Cera)"
                {...register('nome')}
                className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-brand-500"
              />
              {errors.nome && <p className="text-xs text-rose-400 mt-1">{errors.nome.message}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Duração (minutos)
              </label>
              <input
                type="number"
                {...register('duracaoMinutos')}
                className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-brand-500"
              />
              {errors.duracaoMinutos && <p className="text-xs text-rose-400 mt-1">{errors.duracaoMinutos.message}</p>}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Descrição do Serviço
            </label>
            <textarea
              rows={2}
              placeholder="Descreva as etapas e os produtos utilizados..."
              {...register('descricao')}
              className="w-full px-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-brand-500"
            />
          </div>

          <div>
            <p className="text-xs font-bold text-white uppercase tracking-wider mb-3">
              Configuração de Preços por Categoria de Veículo (R$)
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">Preço Hatch</label>
                <input
                  type="number"
                  step="0.01"
                  {...register('precoHatch')}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">Preço Sedan</label>
                <input
                  type="number"
                  step="0.01"
                  {...register('precoSedan')}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">Preço SUV</label>
                <input
                  type="number"
                  step="0.01"
                  {...register('precoSuv')}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">Preço Camionete</label>
                <input
                  type="number"
                  step="0.01"
                  {...register('precoCamionete')}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm"
                />
              </div>

              <div className="bg-brand-600/10 p-2 rounded-xl border border-brand-500/30">
                <label className="block text-[11px] font-bold text-brand-400 mb-1">Preço Wagon (Perua)</label>
                <input
                  type="number"
                  step="0.01"
                  {...register('precoWagon')}
                  className="w-full px-3 py-2 bg-slate-950 border border-brand-500/50 rounded-xl text-white font-bold text-sm"
                />
              </div>
            </div>
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
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white text-sm font-semibold rounded-xl"
            >
              {isSubmitting ? 'Salvando...' : 'Salvar Serviço & Preços'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Histórico de Auditoria */}
      <Modal
        isOpen={isAuditModalOpen}
        onClose={() => setIsAuditModalOpen(false)}
        title={`Histórico de Auditoria: ${selectedPlanForAudit?.nome}`}
        maxWidth="lg"
      >
        <div className="space-y-4">
          {loadingAudits ? (
            <p className="text-xs text-slate-500 py-6 text-center">Carregando logs de auditoria...</p>
          ) : auditHistory.length === 0 ? (
            <p className="text-xs text-slate-400 py-6 text-center">Nenhum registro de auditoria encontrado.</p>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
              {auditHistory.map((audit) => (
                <div key={audit.id} className="bg-slate-950 border border-slate-800/80 p-3.5 rounded-2xl space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-brand-400 uppercase tracking-wider">{audit.acao}</span>
                    <span className="text-[10px] text-slate-500">
                      {format(parseISO(audit.criadoEm), "dd/MM/yyyy 'às' HH:mm:ss", { locale: ptBR })}
                    </span>
                  </div>
                  {audit.usuarioNome && (
                    <p className="text-xs text-slate-400">
                      Alterado por: <strong className="text-white">{audit.usuarioNome}</strong>
                    </p>
                  )}
                  {audit.dadosNovos && (
                    <pre className="text-[10px] text-slate-400 bg-slate-900 p-2 rounded-xl overflow-x-auto">
                      {audit.dadosNovos}
                    </pre>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};
