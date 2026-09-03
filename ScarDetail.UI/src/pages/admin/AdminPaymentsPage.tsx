import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { appointmentService, paymentService } from '../../services/appServices';
import type { PaymentMethod } from '../../types';
import { formatApiError } from '../../services/api';
import { DollarSign, CheckCircle2, AlertCircle, CreditCard, Banknote, QrCode } from 'lucide-react';

export const AdminPaymentsPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const appointmentId = searchParams.get('appointmentId');

  const [metodo, setMetodo] = useState<PaymentMethod>('PIX');
  const [desconto, setDesconto] = useState<number>(0);
  const [acrescimo, setAcrescimo] = useState<number>(0);
  const [justificativa, setJustificativa] = useState<string>('');
  const [valorRecebido, setValorRecebido] = useState<number>(0);
  const [observacao, setObservacao] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { data: appointments = [], isLoading: loadingAppts } = useQuery({
    queryKey: ['admin-appointments-payments'],
    queryFn: () => appointmentService.getAdminAppointments(),
  });

  const selectedAppointment = appointments.find((a) => a.id === appointmentId) || appointments[0];

  const valorOriginal = selectedAppointment?.valorCobrado || 0;
  const valorFinal = Math.max(0, valorOriginal - (desconto || 0) + (acrescimo || 0));
  const troco = valorRecebido > valorFinal ? valorRecebido - valorFinal : 0;

  const paymentMutation = useMutation({
    mutationFn: () =>
      paymentService.registerPayment(selectedAppointment!.id, {
        metodo,
        desconto,
        acrescimo,
        justificativaAjuste: justificativa,
        valorRecebido: valorRecebido || valorFinal,
        observacao,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-appointments'] });
      navigate('/admin/agenda');
    },
    onError: (err) => {
      setErrorMessage(formatApiError(err));
    },
  });

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Registro de Pagamento</h1>
        <p className="text-sm text-slate-400 mt-1">
          Finalize o atendimento registrando o recebimento presencial (PIX, Cartão ou Dinheiro).
        </p>
      </div>

      {errorMessage && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm flex items-center gap-2">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {loadingAppts ? (
        <p className="text-sm text-slate-500 text-center py-12">Carregando dados do agendamento...</p>
      ) : !selectedAppointment ? (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center">
          <DollarSign className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400 text-sm">Nenhum agendamento selecionado para pagamento.</p>
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
          {/* Dados do Atendimento */}
          <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800/80 space-y-2">
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-400">Cliente:</span>
              <span className="text-white font-bold">{selectedAppointment.clienteNome}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-400">Serviço:</span>
              <span className="text-white font-semibold">{selectedAppointment.servicoNome}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-400">Veículo:</span>
              <span className="text-white">
                {selectedAppointment.veiculoMarca} {selectedAppointment.veiculoModelo} ({selectedAppointment.veiculoCategoriaExibicao})
              </span>
            </div>
            <div className="flex justify-between items-center text-sm pt-2 border-t border-slate-800">
              <span className="text-slate-400 font-medium">Valor Original do Serviço:</span>
              <span className="text-lg font-black text-white">
                {valorOriginal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </span>
            </div>
          </div>

          {/* Método de Pagamento */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Forma de Pagamento
            </label>
            <div className="grid grid-cols-3 gap-3">
              {[
                { key: 'PIX', label: 'PIX', icon: QrCode },
                { key: 'Cartao', label: 'Cartão', icon: CreditCard },
                { key: 'Dinheiro', label: 'Dinheiro', icon: Banknote },
              ].map((item) => {
                const Icon = item.icon;
                const isSelected = metodo === item.key;
                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => setMetodo(item.key as PaymentMethod)}
                    className={`py-3 px-4 rounded-2xl border flex flex-col items-center gap-2 font-bold text-xs transition-all ${
                      isSelected
                        ? 'bg-brand-600/20 border-brand-500 text-brand-300 shadow-md shadow-brand-500/10'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Descontos / Acréscimos */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Desconto (R$)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={desconto}
                onChange={(e) => setDesconto(parseFloat(e.target.value) || 0)}
                className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-brand-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Acréscimo (R$)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={acrescimo}
                onChange={(e) => setAcrescimo(parseFloat(e.target.value) || 0)}
                className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-brand-500"
              />
            </div>
          </div>

          {(desconto > 0 || acrescimo > 0) && (
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Justificativa do Ajuste
              </label>
              <input
                type="text"
                value={justificativa}
                onChange={(e) => setJustificativa(e.target.value)}
                placeholder="Ex: Desconto de fidelidade / Sujeira pesada extraordinária"
                className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-brand-500"
              />
            </div>
          )}

          {/* Observação Adicional */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Observação do Pagamento (opcional)
            </label>
            <input
              type="text"
              value={observacao}
              onChange={(e) => setObservacao(e.target.value)}
              placeholder="Ex: Pago com chave PIX CNPJ, comprovante anexado..."
              className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-brand-500"
            />
          </div>

          {/* Valor Recebido & Troco para Dinheiro */}
          {metodo === 'Dinheiro' && (
            <div className="grid grid-cols-2 gap-4 bg-slate-950 p-4 rounded-2xl border border-slate-800/80">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Valor Entregue pelo Cliente
                </label>
                <input
                  type="number"
                  step="0.01"
                  min={valorFinal}
                  value={valorRecebido || ''}
                  onChange={(e) => setValorRecebido(parseFloat(e.target.value) || 0)}
                  placeholder={`R$ ${valorFinal.toFixed(2)}`}
                  className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-brand-500"
                />
              </div>

              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Troco a Devolver</p>
                <p className="text-xl font-black text-amber-400 mt-2">
                  {troco.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </p>
              </div>
            </div>
          )}

          {/* Resumo Final & Botão Confirmar */}
          <div className="pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <p className="text-xs text-slate-400">Total a Pagar:</p>
              <p className="text-3xl font-black text-emerald-400">
                {valorFinal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </p>
            </div>

            <button
              type="button"
              disabled={paymentMutation.isPending}
              onClick={() => paymentMutation.mutate()}
              className="w-full sm:w-auto px-8 py-3.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold rounded-2xl shadow-xl shadow-emerald-600/30 flex items-center justify-center gap-2 transition-all"
            >
              {paymentMutation.isPending ? (
                'Processando...'
              ) : (
                <>
                  <CheckCircle2 className="w-5 h-5" />
                  <span>Concluir & Finalizar Atendimento</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
