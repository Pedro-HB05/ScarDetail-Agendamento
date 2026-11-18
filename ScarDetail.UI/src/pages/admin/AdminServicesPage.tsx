import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { planService } from '../../services/appServices';
import type { ServicePlan } from '../../types';
import { Modal } from '../../components/Modal';
import { formatApiError } from '../../services/api';
import { Plus, Edit2, Clock, History, AlertCircle, ToggleLeft, ToggleRight, Trash2, ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { formatDuration } from '../../utils/format';

const serviceSchema = z.object({
  nome: z.string().min(1, 'O nome do serviço é obrigatório'),
  descricao: z.string().optional(),
  duracaoMinutos: z.coerce.number().min(1, 'A duração deve ser de no mínimo 1 minuto'),
  precoHatch: z.coerce.number().min(0, 'O valor não pode ser negativo'),
  precoSedan: z.coerce.number().min(0, 'O valor não pode ser negativo'),
  precoWagon: z.coerce.number().min(0, 'O valor não pode ser negativo'),
  precoSuv: z.coerce.number().min(0, 'O valor não pode ser negativo'),
  precoCamionete: z.coerce.number().min(0, 'O valor não pode ser negativo'),
  ehAdicional: z.boolean(),
  ativo: z.boolean(),
  ordem: z.coerce.number().min(0).optional(),
});

type ServiceFormData = z.infer<typeof serviceSchema>;

export const AdminServicesPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);
  const [isReorderModalOpen, setIsReorderModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<ServicePlan | null>(null);
  const [selectedPlanForAudit, setSelectedPlanForAudit] = useState<ServicePlan | null>(null);
  const [reorderList, setReorderList] = useState<ServicePlan[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { data: services = [], isLoading } = useQuery({
    queryKey: ['admin-services'],
    queryFn: () => planService.getAllServicesAdmin(),
  });

  const sortedServices = useMemo(() => {
    return [...services].sort((a, b) => (a.ordem ?? 0) - (b.ordem ?? 0));
  }, [services]);

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
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ServiceFormData>({
    resolver: zodResolver(serviceSchema),
    defaultValues: {
      duracaoMinutos: 60,
      precoHatch: 45,
      precoSedan: 55,
      precoWagon: 55,
      precoSuv: 65,
      precoCamionete: 80,
      ehAdicional: false,
      ativo: true,
      ordem: 1,
    },
  });

  const watchAtivo = watch('ativo');
  const watchEhAdicional = watch('ehAdicional');

  const openCreateModal = () => {
    setEditingPlan(null);
    reset({
      nome: '',
      descricao: '',
      duracaoMinutos: 60,
      precoHatch: 45,
      precoSedan: 55,
      precoWagon: 55,
      precoSuv: 65,
      precoCamionete: 80,
      ehAdicional: false,
      ativo: true,
      ordem: services.length + 1,
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
    setValue('precoWagon', plan.precoWagon);
    setValue('precoSuv', plan.precoSuv);
    setValue('precoCamionete', plan.precoCamionete);
    setValue('ehAdicional', plan.ehAdicional ?? false);
    setValue('ativo', plan.ativo);
    setValue('ordem', plan.ordem ?? 1);
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
          ehAdicional: data.ehAdicional,
          ativo: data.ativo,
        });
      }
      return planService.createService(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-services'] });
      queryClient.invalidateQueries({ queryKey: ['active-services'] });
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
      queryClient.invalidateQueries({ queryKey: ['active-services'] });
    },
    onError: (err) => {
      setErrorMessage(formatApiError(err));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => planService.deleteService(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-services'] });
      queryClient.invalidateQueries({ queryKey: ['active-services'] });
    },
    onError: (err) => {
      setErrorMessage(formatApiError(err));
    },
  });

  const reorderMutation = useMutation({
    mutationFn: (orderedIds: string[]) => planService.reorderServices({ orderedIds }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-services'] });
      queryClient.invalidateQueries({ queryKey: ['active-services'] });
    },
    onError: (err) => {
      setErrorMessage(formatApiError(err));
    },
  });

  const handleMoveService = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= sortedServices.length) return;

    const updated = [...sortedServices];
    const [moved] = updated.splice(index, 1);
    updated.splice(targetIndex, 0, moved);

    reorderMutation.mutate(updated.map((s) => s.id));
  };

  const openReorderModal = () => {
    setReorderList([...sortedServices]);
    setIsReorderModalOpen(true);
  };

  const handleModalMoveItem = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= reorderList.length) return;

    const updated = [...reorderList];
    const [moved] = updated.splice(index, 1);
    updated.splice(targetIndex, 0, moved);
    setReorderList(updated);
  };

  const handleSaveModalOrder = () => {
    reorderMutation.mutate(
      reorderList.map((s) => s.id),
      {
        onSuccess: () => {
          setIsReorderModalOpen(false);
        },
      }
    );
  };

  const onSubmit = (data: ServiceFormData) => {
    createOrUpdateMutation.mutate(data);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Serviços & Preços</h1>
          <p className="text-sm text-slate-400 mt-1">
            Cadastre os serviços e defina preços específicos para Hatch, Sedan, Wagon, SUV e Camionete.
          </p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={openReorderModal}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-brand-500/10 hover:bg-brand-500/20 text-brand-400 hover:text-brand-300 font-bold text-sm rounded-2xl border border-brand-500/30 transition-all shadow-sm"
            title="Reorganizar ordem dos serviços"
          >
            <ArrowUpDown className="w-4 h-4" />
            <span>Organizar Ordem</span>
          </button>
          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-600 hover:bg-brand-500 text-white font-semibold text-sm rounded-2xl shadow-lg shadow-brand-600/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Novo Serviço</span>
          </button>
        </div>
      </div>

      {errorMessage && !isModalOpen && (
        <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            className="text-xs font-semibold hover:text-white"
          >
            Fechar
          </button>
        </div>
      )}

      {isLoading ? (
        <div className="py-12 text-center text-slate-500 text-sm">Carregando serviços...</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {sortedServices.map((plan, index) => (
            <div
              key={plan.id}
              className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-brand-300 border border-slate-700">
                        #{index + 1}
                      </span>
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
                      {plan.ehAdicional && (
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border bg-amber-500/10 text-amber-400 border-amber-500/30">
                          Adicional
                        </span>
                      )}
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
                      <p className="text-[10px] text-slate-500 font-bold">Wagon</p>
                      <p className="text-xs font-bold text-white mt-0.5">R$ {plan.precoWagon.toFixed(2)}</p>
                    </div>
                    <div className="bg-slate-950 p-2 rounded-xl border border-slate-800/80">
                      <p className="text-[10px] text-slate-500 font-bold">SUV</p>
                      <p className="text-xs font-bold text-white mt-0.5">R$ {plan.precoSuv.toFixed(2)}</p>
                    </div>
                    <div className="bg-slate-950 p-2 rounded-xl border border-slate-800/80">
                      <p className="text-[10px] text-slate-500 font-bold">Camionete</p>
                      <p className="text-xs font-bold text-white mt-0.5">R$ {plan.precoCamionete.toFixed(2)}</p>
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
                  <div className="flex items-center border border-slate-800 rounded-xl p-0.5 bg-slate-950">
                    <button
                      type="button"
                      disabled={index === 0 || reorderMutation.isPending}
                      onClick={() => handleMoveService(index, 'up')}
                      className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors disabled:opacity-20 disabled:hover:bg-transparent disabled:hover:text-slate-400"
                      title="Subir posição na exibição"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      disabled={index === sortedServices.length - 1 || reorderMutation.isPending}
                      onClick={() => handleMoveService(index, 'down')}
                      className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors disabled:opacity-20 disabled:hover:bg-transparent disabled:hover:text-slate-400"
                      title="Descer posição na exibição"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                  </div>

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
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm(`Tem certeza que deseja excluir o serviço "${plan.nome}"? Esta ação não pode ser desfeita.`)) {
                        deleteMutation.mutate(plan.id);
                      }
                    }}
                    disabled={deleteMutation.isPending}
                    className="p-2 text-rose-400 hover:text-white rounded-xl bg-rose-500/10 hover:bg-rose-600 border border-rose-500/20 transition-all disabled:opacity-50"
                    title="Excluir Serviço Definitivamente"
                  >
                    <Trash2 className="w-4 h-4" />
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
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">Preço Wagon (Perua)</label>
                <input
                  type="number"
                  step="0.01"
                  {...register('precoWagon')}
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
            </div>
          </div>

          <div className="flex items-center justify-between p-3.5 bg-slate-950 border border-slate-800 rounded-xl">
            <div>
              <label className="text-xs font-bold text-white uppercase tracking-wider block">
                Serviço Adicional / Opcional
              </label>
              <p className="text-xs text-slate-400 mt-0.5">
                {watchEhAdicional
                  ? 'Este plano é um serviço adicional (ex: Lavagem de Motor a Seco) somado a outros'
                  : 'Serviço principal padrão de estética automotiva'}
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                {...register('ehAdicional')}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
            </label>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
              Ordem de Exibição (Posição para os Clientes)
            </label>
            <input
              type="number"
              min="1"
              {...register('ordem')}
              placeholder="Ex: 1, 2, 3..."
              className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              Define a ordem numérica em que o serviço aparece no catálogo e agendamento (1 = primeiro).
            </p>
          </div>

          <div className="flex items-center justify-between p-3.5 bg-slate-950 border border-slate-800 rounded-xl">
            <div>
              <label className="text-xs font-bold text-white uppercase tracking-wider block">
                Disponibilidade do Serviço
              </label>
              <p className="text-xs text-slate-400 mt-0.5">
                {watchAtivo
                  ? 'Serviço ativo (visível para agendamento dos clientes)'
                  : 'Serviço inativo (oculto para novos agendamentos)'}
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                {...register('ativo')}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
            </label>
          </div>

          <div className="pt-4 border-t border-slate-800 flex items-center justify-between gap-3">
            {editingPlan && (
              <button
                type="button"
                onClick={() => {
                  if (window.confirm(`Tem certeza que deseja excluir o serviço "${editingPlan.nome}"? Esta ação não pode ser desfeita.`)) {
                    deleteMutation.mutate(editingPlan.id, {
                      onSuccess: () => {
                        setIsModalOpen(false);
                      },
                    });
                  }
                }}
                disabled={deleteMutation.isPending}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-rose-500/10 hover:bg-rose-600 text-rose-400 hover:text-white border border-rose-500/30 text-xs font-bold rounded-xl transition-all disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4" />
                <span>Excluir Serviço</span>
              </button>
            )}

            <div className="flex items-center gap-3 ml-auto">
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
                className="px-6 py-2.5 bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white text-sm font-semibold rounded-xl shadow-lg shadow-brand-600/20"
              >
                {isSubmitting ? 'Salvando...' : 'Salvar Serviço & Preços'}
              </button>
            </div>
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

      {/* Modal de Reorganizar Ordem dos Serviços */}
      <Modal
        isOpen={isReorderModalOpen}
        onClose={() => setIsReorderModalOpen(false)}
        title="Organizar Ordem dos Serviços"
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-400">
            Defina a ordem exata em que os serviços serão apresentados aos clientes no catálogo e no fluxo de agendamento. Use as setas para mover os itens para cima ou para baixo.
          </p>

          <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
            {reorderList.map((item, idx) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-3 rounded-2xl bg-slate-950 border border-slate-800 hover:border-slate-700 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="w-7 h-7 flex-shrink-0 flex items-center justify-center rounded-xl bg-brand-500/10 text-brand-400 font-bold text-xs border border-brand-500/20">
                    {idx + 1}
                  </span>
                  <div className="truncate">
                    <p className="text-sm font-bold text-white truncate">{item.nome}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-[10px] text-slate-400">
                        {item.duracaoMinutos} min
                      </span>
                      {item.ehAdicional && (
                        <span className="text-[9px] font-bold uppercase px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                          Adicional
                        </span>
                      )}
                      {!item.ativo && (
                        <span className="text-[9px] font-bold uppercase px-1.5 py-0.2 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20">
                          Inativo
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    disabled={idx === 0}
                    onClick={() => handleModalMoveItem(idx, 'up')}
                    className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors disabled:opacity-20 disabled:hover:bg-transparent disabled:hover:text-slate-400"
                    title="Mover para cima"
                  >
                    <ArrowUp className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    disabled={idx === reorderList.length - 1}
                    onClick={() => handleModalMoveItem(idx, 'down')}
                    className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors disabled:opacity-20 disabled:hover:bg-transparent disabled:hover:text-slate-400"
                    title="Mover para baixo"
                  >
                    <ArrowDown className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsReorderModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSaveModalOrder}
              disabled={reorderMutation.isPending}
              className="px-5 py-2.5 bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-brand-600/20 transition-all disabled:opacity-50"
            >
              {reorderMutation.isPending ? 'Salvando...' : 'Salvar Ordem'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
