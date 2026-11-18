import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { addressService } from '../../services/appServices';
import type { Address, CheckCepResponse } from '../../types';
import { Modal } from '../../components/Modal';
import { formatApiError } from '../../services/api';
import { MapPin, Plus, Edit2, Trash2, Search, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';

const addressSchema = z.object({
  apelido: z.string().min(1, 'O apelido é obrigatório (ex: Casa, Trabalho)'),
  cep: z.string().min(8, 'CEP deve conter 8 dígitos'),
  logradouro: z.string().min(1, 'O logradouro é obrigatório'),
  numero: z.string().min(1, 'O número é obrigatório'),
  complemento: z.string().optional(),
  bairro: z.string().min(1, 'O bairro é obrigatório'),
  cidade: z.string().min(1, 'A cidade é obrigatória'),
  uf: z.string().length(2, 'A UF deve ter 2 caracteres'),
  pontoReferencia: z.string().optional(),
});

type AddressFormData = z.infer<typeof addressSchema>;

export const AddressesPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [cepCheckResult, setCepCheckResult] = useState<CheckCepResponse | null>(null);
  const [isCheckingCep, setIsCheckingCep] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { data: addresses = [], isLoading } = useQuery({
    queryKey: ['my-addresses'],
    queryFn: () => addressService.getMyAddresses(),
  });

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    control,
    formState: { errors, isSubmitting },
  } = useForm<AddressFormData>({
    resolver: zodResolver(addressSchema),
  });

  const currentCep = useWatch({ control, name: 'cep' });

  const handleConsultarCep = async () => {
    if (!currentCep || currentCep.replace(/\D/g, '').length !== 8) {
      setErrorMessage('Digite um CEP válido com 8 dígitos para consultar.');
      return;
    }

    try {
      setIsCheckingCep(true);
      setErrorMessage(null);
      const res = await addressService.checkCep(currentCep);
      setCepCheckResult(res);

      setValue('logradouro', res.logradouro);
      setValue('bairro', res.bairro);
      setValue('cidade', res.cidade);
      setValue('uf', res.uf);
      if (res.complemento) {
        setValue('complemento', res.complemento);
      }
    } catch (err) {
      setErrorMessage(formatApiError(err));
      setCepCheckResult(null);
    } finally {
      setIsCheckingCep(false);
    }
  };

  const openCreateModal = () => {
    setEditingAddress(null);
    setCepCheckResult(null);
    reset({
      apelido: 'Casa',
      cep: '',
      logradouro: '',
      numero: '',
      complemento: '',
      bairro: '',
      cidade: 'Curitiba',
      uf: 'PR',
      pontoReferencia: '',
    });
    setErrorMessage(null);
    setIsModalOpen(true);
  };

  const openEditModal = (addr: Address) => {
    setEditingAddress(addr);
    setCepCheckResult({
      cep: addr.cep,
      logradouro: addr.logradouro,
      complemento: addr.complemento || '',
      bairro: addr.bairro,
      cidade: addr.cidade,
      uf: addr.uf,
      atendido: true,
    });
    setValue('apelido', addr.apelido);
    setValue('cep', addr.cep);
    setValue('logradouro', addr.logradouro);
    setValue('numero', addr.numero);
    setValue('complemento', addr.complemento || '');
    setValue('bairro', addr.bairro);
    setValue('cidade', addr.cidade);
    setValue('uf', addr.uf);
    setValue('pontoReferencia', addr.pontoReferencia || '');
    setErrorMessage(null);
    setIsModalOpen(true);
  };

  const createOrUpdateMutation = useMutation({
    mutationFn: (data: AddressFormData) => {
      if (editingAddress) {
        return addressService.updateAddress(editingAddress.id, {
          ...data,
          ativo: true,
        });
      }
      return addressService.createAddress(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-addresses'] });
      setIsModalOpen(false);
    },
    onError: (err) => {
      setErrorMessage(formatApiError(err));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => addressService.deleteAddress(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-addresses'] });
    },
  });

  const onSubmit = (data: AddressFormData) => {
    if (cepCheckResult && !cepCheckResult.atendido) {
      setErrorMessage('Não é possível salvar: este bairro ainda não é atendido pela nossa estética.');
      return;
    }
    createOrUpdateMutation.mutate(data);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-950">Meus Endereços</h1>
          <p className="text-sm text-slate-500 mt-1">
            Cadastre os locais onde realizaremos os atendimentos a domicílio em Curitiba.
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-600 hover:bg-brand-500 text-white font-bold rounded-2xl shadow-lg shadow-brand-600/20 transition-all self-start"
        >
          <Plus className="w-4 h-4" />
          <span>Adicionar Endereço</span>
        </button>
      </div>

      {isLoading ? (
        <div className="py-12 text-center text-slate-500 text-sm">Carregando endereços...</div>
      ) : addresses.length === 0 ? (
        <div className="bg-white border border-stone-200 rounded-3xl p-12 text-center max-w-md mx-auto shadow-sm">
          <MapPin className="w-16 h-16 text-stone-300 mx-auto mb-4" />
          <h3 className="text-lg font-black text-slate-950">Nenhum endereço cadastrado</h3>
          <p className="text-slate-500 text-xs mt-1">
            Cadastre um endereço para verificar a cobertura e agendar seu atendimento.
          </p>
          <button
            onClick={openCreateModal}
            className="mt-6 inline-flex items-center gap-2 px-6 py-3 bg-brand-600 hover:bg-brand-500 text-white text-sm font-bold rounded-2xl transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Cadastrar Meu Primeiro Endereço</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {addresses.map((addr) => (
            <div
              key={addr.id}
              className="bg-white border border-stone-200 rounded-3xl p-6 flex flex-col justify-between shadow-sm hover:border-stone-300 transition-all"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-stone-100 text-slate-800 border border-stone-200">
                    {addr.apelido}
                  </span>
                </div>

                <p className="text-base font-bold text-slate-950 mt-3">
                  {addr.logradouro}, {addr.numero}
                  {addr.complemento ? ` (${addr.complemento})` : ''}
                </p>
                <p className="text-xs text-slate-600 mt-1">
                  Bairro {addr.bairro} • {addr.cidade}/{addr.uf}
                </p>
                <p className="text-xs text-slate-400 mt-0.5">CEP {addr.cep}</p>

                {addr.pontoReferencia && (
                  <p className="text-xs text-slate-600 mt-2 bg-stone-50 p-2.5 rounded-xl border border-stone-200">
                    <span className="text-slate-400 font-semibold">Ref:</span> {addr.pontoReferencia}
                  </p>
                )}
              </div>

              <div className="mt-6 pt-4 border-t border-stone-100 flex items-center justify-end gap-2">
                <button
                  onClick={() => openEditModal(addr)}
                  className="p-2 text-slate-500 hover:text-slate-950 rounded-xl hover:bg-stone-100 transition-colors"
                  title="Editar"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    if (confirm(`Tem certeza que deseja remover ${addr.apelido}?`)) {
                      deleteMutation.mutate(addr.id);
                    }
                  }}
                  className="p-2 text-slate-400 hover:text-rose-600 rounded-xl hover:bg-rose-50 transition-colors"
                  title="Excluir"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Criar / Editar Endereço com Consulta ViaCEP */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingAddress ? 'Editar Endereço' : 'Cadastrar Endereço com ViaCEP'}
      >
        {errorMessage && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Apelido do Endereço
            </label>
            <input
              type="text"
              placeholder="Ex: Casa, Trabalho, Garagem"
              {...register('apelido')}
              className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all"
            />
            {errors.apelido && <p className="text-xs text-rose-500 mt-1">{errors.apelido.message}</p>}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              CEP (com verificação de cobertura)
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="00000-000"
                maxLength={9}
                {...register('cep')}
                className="flex-1 px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all"
              />
              <button
                type="button"
                onClick={handleConsultarCep}
                disabled={isCheckingCep}
                className="px-4 py-2.5 bg-stone-100 hover:bg-stone-200 disabled:opacity-50 text-slate-700 text-xs font-bold rounded-xl border border-stone-200 flex items-center gap-1.5 transition-all"
              >
                {isCheckingCep ? (
                  <div className="w-4 h-4 border-2 border-slate-700 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Search className="w-4 h-4 text-slate-500" />
                    <span>Buscar CEP</span>
                  </>
                )}
              </button>
            </div>
            {errors.cep && <p className="text-xs text-rose-500 mt-1">{errors.cep.message}</p>}

            {/* Alerta de Cobertura ViaCEP */}
            {cepCheckResult && (
              <div
                className={`mt-2 p-3 rounded-xl border text-xs flex items-center gap-2 ${
                  cepCheckResult.atendido
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-700 font-medium'
                    : 'bg-rose-50 border-rose-200 text-rose-600 font-medium'
                }`}
              >
                {cepCheckResult.atendido ? (
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-600" />
                ) : (
                  <XCircle className="w-4 h-4 flex-shrink-0 text-rose-600" />
                )}
                <span>
                  {cepCheckResult.atendido
                    ? `Região atendida com sucesso! (${cepCheckResult.bairro})`
                    : `Desculpe, ainda não atendemos o bairro ${cepCheckResult.bairro}.`}
                </span>
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Logradouro (Rua / Avenida)
            </label>
            <input
              type="text"
              placeholder="Rua das Flores"
              {...register('logradouro')}
              className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all"
            />
            {errors.logradouro && <p className="text-xs text-rose-500 mt-1">{errors.logradouro.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Número
              </label>
              <input
                type="text"
                placeholder="123"
                {...register('numero')}
                className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all"
              />
              {errors.numero && <p className="text-xs text-rose-500 mt-1">{errors.numero.message}</p>}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Complemento
              </label>
              <input
                type="text"
                placeholder="Apto 42, Bloco B"
                {...register('complemento')}
                className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-1">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Bairro
              </label>
              <input
                type="text"
                placeholder="Centro"
                {...register('bairro')}
                className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all"
              />
              {errors.bairro && <p className="text-xs text-rose-500 mt-1">{errors.bairro.message}</p>}
            </div>

            <div className="col-span-1">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Cidade
              </label>
              <input
                type="text"
                readOnly
                placeholder="Curitiba"
                {...register('cidade')}
                className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all"
              />
              {errors.cidade && <p className="text-xs text-rose-500 mt-1">{errors.cidade.message}</p>}
            </div>

            <div className="col-span-1">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                UF
              </label>
              <input
                type="text"
                readOnly
                maxLength={2}
                placeholder="PR"
                {...register('uf')}
                className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 uppercase transition-all"
              />
              {errors.uf && <p className="text-xs text-rose-500 mt-1">{errors.uf.message}</p>}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Ponto de Referência (opcional)
            </label>
            <input
              type="text"
              placeholder="Próximo à praça principal, portão branco"
              {...register('pontoReferencia')}
              className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all"
            />
          </div>

          <div className="pt-4 border-t border-stone-100 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2.5 text-slate-500 hover:text-slate-900 text-sm font-semibold"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white text-sm font-bold rounded-xl transition-all"
            >
              {isSubmitting ? 'Salvando...' : 'Salvar Endereço'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
