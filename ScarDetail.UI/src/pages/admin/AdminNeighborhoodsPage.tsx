import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { neighborhoodService } from '../../services/appServices';
import type { PermittedNeighborhood } from '../../types';
import { Modal } from '../../components/Modal';
import { formatApiError } from '../../services/api';
import { MapPin, Plus, Edit2, Trash2, AlertCircle, ToggleLeft, ToggleRight } from 'lucide-react';

const neighborhoodSchema = z.object({
  nome: z.string().min(1, 'O nome do bairro é obrigatório'),
  cidade: z.string().min(1, 'A cidade é obrigatória'),
  uf: z.string().length(2, 'A UF deve ter 2 caracteres'),
});

type NeighborhoodFormData = z.infer<typeof neighborhoodSchema>;

export const AdminNeighborhoodsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<PermittedNeighborhood | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { data: neighborhoods = [], isLoading } = useQuery({
    queryKey: ['admin-neighborhoods'],
    queryFn: () => neighborhoodService.getAll(false),
  });

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<NeighborhoodFormData>({
    resolver: zodResolver(neighborhoodSchema),
    defaultValues: {
      cidade: 'Curitiba',
      uf: 'PR',
    },
  });

  const openCreateModal = () => {
    setEditingItem(null);
    reset({
      nome: '',
      cidade: 'Curitiba',
      uf: 'PR',
    });
    setErrorMessage(null);
    setIsModalOpen(true);
  };

  const openEditModal = (item: PermittedNeighborhood) => {
    setEditingItem(item);
    setValue('nome', item.nome);
    setValue('cidade', item.cidade);
    setValue('uf', item.uf);
    setErrorMessage(null);
    setIsModalOpen(true);
  };

  const createOrUpdateMutation = useMutation({
    mutationFn: (data: NeighborhoodFormData) => {
      if (editingItem) {
        return neighborhoodService.update(editingItem.id, {
          ...data,
          ativo: editingItem.ativo,
        });
      }
      return neighborhoodService.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-neighborhoods'] });
      setIsModalOpen(false);
    },
    onError: (err) => {
      setErrorMessage(formatApiError(err));
    },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) =>
      neighborhoodService.toggleStatus(id, active),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-neighborhoods'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => neighborhoodService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-neighborhoods'] });
    },
  });

  const onSubmit = (data: NeighborhoodFormData) => {
    createOrUpdateMutation.mutate(data);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Bairros Atendidos</h1>
          <p className="text-sm text-slate-400 mt-1">
            Cadastre e controle os bairros onde sua estética oferece atendimento móvel a domicílio.
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-600 hover:bg-brand-500 text-white font-semibold text-sm rounded-2xl shadow-lg shadow-brand-600/20 transition-all self-start"
        >
          <Plus className="w-4 h-4" />
          <span>Novo Bairro</span>
        </button>
      </div>

      {isLoading ? (
        <div className="py-12 text-center text-slate-500 text-sm">Carregando bairros...</div>
      ) : neighborhoods.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center max-w-md mx-auto">
          <MapPin className="w-16 h-16 text-slate-600 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-white">Nenhum bairro cadastrado</h3>
          <p className="text-slate-400 text-xs mt-1">
            Cadastre os bairros que sua estética atende para liberar o agendamento aos clientes.
          </p>
          <button
            onClick={openCreateModal}
            className="mt-6 inline-flex items-center gap-2 px-6 py-3 bg-brand-600 hover:bg-brand-500 text-white text-sm font-semibold rounded-2xl"
          >
            <Plus className="w-4 h-4" />
            <span>Cadastrar Primeiro Bairro</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {neighborhoods.map((b) => (
            <div
              key={b.id}
              className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl flex items-center justify-between gap-4"
            >
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-white">{b.nome}</h3>
                  <span
                    className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                      b.ativo
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                        : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                    }`}
                  >
                    {b.ativo ? 'Ativo' : 'Desativado'}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  {b.cidade} / {b.uf}
                </p>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => toggleStatusMutation.mutate({ id: b.id, active: !b.ativo })}
                  className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
                  title={b.ativo ? 'Desativar Bairro' : 'Ativar Bairro'}
                >
                  {b.ativo ? <ToggleRight className="w-5 h-5 text-emerald-400" /> : <ToggleLeft className="w-5 h-5 text-slate-600" />}
                </button>
                <button
                  onClick={() => openEditModal(b)}
                  className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
                  title="Editar"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    if (confirm(`Remover bairro ${b.nome}?`)) {
                      deleteMutation.mutate(b.id);
                    }
                  }}
                  className="p-2 text-slate-400 hover:text-rose-400 rounded-xl hover:bg-rose-500/10 transition-colors"
                  title="Excluir"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Criar / Editar */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingItem ? 'Editar Bairro' : 'Cadastrar Bairro Atendido'}
      >
        {errorMessage && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Nome do Bairro
            </label>
            <input
              type="text"
              placeholder="Ex: Pinheiros, Moema, Jardins"
              {...register('nome')}
              className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-brand-500"
            />
            {errors.nome && <p className="text-xs text-rose-400 mt-1">{errors.nome.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Cidade
              </label>
              <input
                type="text"
                readOnly
                placeholder="Curitiba"
                {...register('cidade')}
                className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-brand-500"
              />
              {errors.cidade && <p className="text-xs text-rose-400 mt-1">{errors.cidade.message}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                UF
              </label>
              <input
                type="text"
                readOnly
                maxLength={2}
                placeholder="PR"
                {...register('uf')}
                className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-brand-500 uppercase"
              />
              {errors.uf && <p className="text-xs text-rose-400 mt-1">{errors.uf.message}</p>}
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
              {isSubmitting ? 'Salvando...' : 'Salvar Bairro'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
