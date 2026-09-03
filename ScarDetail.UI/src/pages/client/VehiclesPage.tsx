import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { vehicleService } from '../../services/appServices';
import type { Vehicle } from '../../types';
import { VehicleCategoryBadge } from '../../components/VehicleCategoryBadge';
import { Modal } from '../../components/Modal';
import { formatApiError } from '../../services/api';
import { Car, Plus, Edit2, Trash2, AlertCircle } from 'lucide-react';

const vehicleSchema = z.object({
  categoria: z.enum(['Hatch', 'Sedan', 'SUV', 'Camionete', 'Wagon']),
  marca: z.string().min(1, 'A marca é obrigatória'),
  modelo: z.string().min(1, 'O modelo é obrigatório'),
  ano: z.coerce.number().min(1900, 'Ano inválido').max(new Date().getFullYear() + 1, 'Ano inválido'),
  placa: z.string().optional(),
  cor: z.string().optional(),
});

type VehicleFormData = z.infer<typeof vehicleSchema>;

export const VehiclesPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { data: vehicles = [], isLoading } = useQuery({
    queryKey: ['my-vehicles'],
    queryFn: () => vehicleService.getMyVehicles(),
  });

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<VehicleFormData>({
    resolver: zodResolver(vehicleSchema),
    defaultValues: {
      categoria: 'Sedan',
      ano: new Date().getFullYear(),
    },
  });

  const openCreateModal = () => {
    setEditingVehicle(null);
    reset({
      categoria: 'Sedan',
      marca: '',
      modelo: '',
      ano: new Date().getFullYear(),
      placa: '',
      cor: '',
    });
    setErrorMessage(null);
    setIsModalOpen(true);
  };

  const openEditModal = (vehicle: Vehicle) => {
    setEditingVehicle(vehicle);
    setValue('categoria', vehicle.categoria);
    setValue('marca', vehicle.marca);
    setValue('modelo', vehicle.modelo);
    setValue('ano', vehicle.ano);
    setValue('placa', vehicle.placa || '');
    setValue('cor', vehicle.cor || '');
    setErrorMessage(null);
    setIsModalOpen(true);
  };

  const createOrUpdateMutation = useMutation({
    mutationFn: (data: VehicleFormData) => {
      if (editingVehicle) {
        return vehicleService.updateVehicle(editingVehicle.id, {
          ...data,
          ativo: true,
        });
      }
      return vehicleService.createVehicle(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-vehicles'] });
      setIsModalOpen(false);
    },
    onError: (err) => {
      setErrorMessage(formatApiError(err));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => vehicleService.deleteVehicle(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-vehicles'] });
    },
  });

  const onSubmit = (data: VehicleFormData) => {
    createOrUpdateMutation.mutate(data);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">Meus Veículos</h1>
          <p className="text-sm text-slate-400 mt-1">
            Cadastre seus carros para agendamentos rápidos e cálculo automático de preços.
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-600 hover:bg-brand-500 text-white font-semibold rounded-2xl shadow-lg shadow-brand-600/20 transition-all self-start"
        >
          <Plus className="w-4 h-4" />
          <span>Adicionar Veículo</span>
        </button>
      </div>

      {isLoading ? (
        <div className="py-12 text-center text-slate-500 text-sm">Carregando veículos...</div>
      ) : vehicles.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center max-w-md mx-auto">
          <Car className="w-16 h-16 text-slate-600 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-white">Nenhum veículo cadastrado</h3>
          <p className="text-slate-400 text-xs mt-1">
            Cadastre seu veículo agora para poder solicitar os serviços de estética automotiva.
          </p>
          <button
            onClick={openCreateModal}
            className="mt-6 inline-flex items-center gap-2 px-6 py-3 bg-brand-600 hover:bg-brand-500 text-white text-sm font-semibold rounded-2xl transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Cadastrar Meu Primeiro Veículo</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {vehicles.map((v) => (
            <div
              key={v.id}
              className="bg-slate-900 border border-slate-800 rounded-3xl p-6 flex flex-col justify-between shadow-lg hover:border-slate-700 transition-all"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-lg font-bold text-white">
                      {v.marca} {v.modelo}
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">Ano {v.ano}</p>
                  </div>
                  <VehicleCategoryBadge category={v.categoria} />
                </div>

                <div className="mt-4 pt-4 border-t border-slate-800/80 space-y-1.5 text-xs text-slate-400">
                  {v.placa && (
                    <p>
                      <span className="text-slate-500">Placa:</span> <span className="text-white font-medium">{v.placa}</span>
                    </p>
                  )}
                  {v.cor && (
                    <p>
                      <span className="text-slate-500">Cor:</span> <span className="text-white font-medium">{v.cor}</span>
                    </p>
                  )}
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-end gap-2">
                <button
                  onClick={() => openEditModal(v)}
                  className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
                  title="Editar"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    if (confirm(`Tem certeza que deseja remover ${v.marca} ${v.modelo}?`)) {
                      deleteMutation.mutate(v.id);
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

      {/* Modal Criar / Editar Veículo */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingVehicle ? 'Editar Veículo' : 'Cadastrar Novo Veículo'}
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
              Categoria do Veículo
            </label>
            <select
              {...register('categoria')}
              className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-brand-500"
            >
              <option value="Hatch">Hatch</option>
              <option value="Sedan">Sedan</option>
              <option value="SUV">SUV</option>
              <option value="Camionete">Camionete</option>
              <option value="Wagon">Wagon (Perua)</option>
            </select>
            {errors.categoria && <p className="text-xs text-rose-400 mt-1">{errors.categoria.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Marca
              </label>
              <input
                type="text"
                placeholder="Ex: Toyota, VW, BMW"
                {...register('marca')}
                className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-brand-500"
              />
              {errors.marca && <p className="text-xs text-rose-400 mt-1">{errors.marca.message}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Modelo
              </label>
              <input
                type="text"
                placeholder="Ex: Corolla, Passat Variant"
                {...register('modelo')}
                className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-brand-500"
              />
              {errors.modelo && <p className="text-xs text-rose-400 mt-1">{errors.modelo.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Ano
              </label>
              <input
                type="number"
                {...register('ano')}
                className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-brand-500"
              />
              {errors.ano && <p className="text-xs text-rose-400 mt-1">{errors.ano.message}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Placa (opcional)
              </label>
              <input
                type="text"
                placeholder="ABC1D23"
                {...register('placa')}
                className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-brand-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Cor (opcional)
              </label>
              <input
                type="text"
                placeholder="Preto, Prata"
                {...register('cor')}
                className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-brand-500"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2.5 text-slate-400 hover:text-white text-sm font-semibold"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-all"
            >
              {isSubmitting ? 'Salvando...' : 'Salvar Veículo'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
