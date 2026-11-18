import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { appointmentService, paymentService } from '../../services/appServices';
import type { PaymentMethod } from '../../types';
import { formatApiError } from '../../services/api';
import {
  DollarSign,
  CheckCircle2,
  AlertCircle,
  CreditCard,
  Banknote,
  QrCode,
  Calendar,
  CheckCheck,
  ArrowLeft,
  ChevronDown,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export const AdminPaymentsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const urlAppointmentId = searchParams.get('appointmentId');

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

  const unpaidAppointments = useMemo(
    () => appointments.filter((a) => !a.pagamento && a.status !== 'Cancelado'),
    [appointments]
  );

  const selectedAppointment = useMemo(() => {
    if (urlAppointmentId) {
      const found = appointments.find((a) => a.id === urlAppointmentId);
      if (found) return found;
    }
    return unpaidAppointments[0] || appointments[0] || null;
  }, [appointments, unpaidAppointments, urlAppointmentId]);

  const handleSelectAppointment = (id: string) => {
    setSearchParams({ appointmentId: id });
    setDesconto(0);
    setAcrescimo(0);
    setJustificativa('');
    setValorRecebido(0);
    setObservacao('');
    setErrorMessage(null);
  };

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
      queryClient.invalidateQueries({ queryKey: ['admin-appointments-payments'] });
      navigate('/admin/agenda');
    },
    onError: (err) => {
      setErrorMessage(formatApiError(err));
    },
  });

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Registro de Pagamento</h1>
          <p className="text-sm text-slate-400 mt-1">
            Finalize o atendimento registrando o recebimento presencial (PIX, Cartão ou Dinheiro).
          </p>
        </div>
        <Link
          to="/admin/agenda"
          className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition-all self-start"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar para Agenda</span>
        </Link>
      </div>

      {/* Seletor de Atendimento */}
      {appointments.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-md">
          <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
            Selecione o Agendamento para Pagamento:
          </label>
          <div className="relative">
            <select
              value={selectedAppointment?.id || ''}
              onChange={(e) => handleSelectAppointment(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-brand-500 appearance-none pr-10"
            >
              {unpaidAppointments.length > 0 && (
                <optgroup label="Pendentes de Pagamento">
                  {unpaidAppointments.map((a) => (
                    <option key={a.id} value={a.id}>
                      ⏳ {a.clienteNome} · {a.servicoNome} · {format(parseISO(a.dataHoraInicio), "dd/MM 'às' HH:mm", { locale: ptBR })} (R$ {a.valorCobrado.toFixed(2)})
                    </option>
                  ))}
                </optgroup>
              )}
              <optgroup label="Todos os Atendimentos">
                {appointments.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.pagamento ? '✓ Pago: ' : '⏳ '}
                    {a.clienteNome} · {a.servicoNome} · {format(parseISO(a.dataHoraInicio), "dd/MM 'às' HH:mm", { locale: ptBR })} ({a.status})
                  </option>
                ))}
              </optgroup>
            </select>
            <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>
      )}

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
          <p className="text-slate-400 text-sm">Nenhum agendamento encontrado no sistema.</p>
        </div>
      ) : selectedAppointment.pagamento ? (
        /* Recibo de Pagamento já Concluído */
        <div className="bg-slate-900 border border-emerald-500/30 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <CheckCheck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Pagamento Registrado</h3>
                <p className="text-xs text-emerald-400">Atendimento finalizado com sucesso</p>
              </div>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              Pago via {selectedAppointment.pagamento.metodo}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-slate-400 bg-slate-950 p-5 rounded-2xl border border-slate-800/80">
            <div>
              <p className="text-slate-500 font-medium">Cliente:</p>
              <strong className="text-white text-sm block mt-0.5">{selectedAppointment.clienteNome}</strong>
              <p className="text-slate-400 mt-0.5">{selectedAppointment.clienteTelefone}</p>
            </div>
            <div>
              <p className="text-slate-500 font-medium">Serviço Realizado:</p>
              <strong className="text-white text-sm block mt-0.5">{selectedAppointment.servicoNome}</strong>
              <p className="text-slate-400 mt-0.5">
                {selectedAppointment.veiculoMarca} {selectedAppointment.veiculoModelo} ({selectedAppointment.veiculoCategoriaExibicao})
              </p>
            </div>
            <div>
              <p className="text-slate-500 font-medium">Data do Atendimento:</p>
              <strong className="text-white block mt-0.5">
                {format(parseISO(selectedAppointment.dataHoraInicio), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
              </strong>
            </div>
            <div>
              <p className="text-slate-500 font-medium">Data do Pagamento:</p>
              <strong className="text-white block mt-0.5">
                {format(parseISO(selectedAppointment.pagamento.pagoEm), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
              </strong>
            </div>
          </div>

          <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800/80 space-y-2 text-sm">
            <div className="flex justify-between items-center text-slate-400">
              <span>Valor Original:</span>
              <span className="text-white">
                {selectedAppointment.pagamento.valorOriginal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </span>
            </div>
            {selectedAppointment.pagamento.desconto > 0 && (
              <div className="flex justify-between items-center text-rose-400">
                <span>Desconto Aplicado:</span>
                <span>- {selectedAppointment.pagamento.desconto.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
              </div>
            )}
            {selectedAppointment.pagamento.acrescimo > 0 && (
              <div className="flex justify-between items-center text-amber-400">
                <span>Acréscimo:</span>
                <span>+ {selectedAppointment.pagamento.acrescimo.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
              </div>
            )}
            {selectedAppointment.pagamento.justificativaAjuste && (
              <p className="text-xs text-slate-400 italic pt-1">
                Justificativa: "{selectedAppointment.pagamento.justificativaAjuste}"
              </p>
            )}
            <div className="flex justify-between items-center pt-3 border-t border-slate-800 text-base font-black">
              <span className="text-white">Valor Final Recebido:</span>
              <span className="text-emerald-400 text-xl">
                {selectedAppointment.pagamento.valorFinal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </span>
            </div>
            {selectedAppointment.pagamento.troco > 0 && (
              <div className="flex justify-between items-center text-xs text-amber-400 pt-1">
                <span>Troco Devolvido:</span>
                <span>{selectedAppointment.pagamento.troco.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
              </div>
            )}
          </div>

          {selectedAppointment.pagamento.observacao && (
            <p className="text-xs text-slate-400 bg-slate-950 p-3 rounded-xl border border-slate-800/80 italic">
              Obs: "{selectedAppointment.pagamento.observacao}"
            </p>
          )}

          <div className="pt-4 border-t border-slate-800 flex justify-end">
            <Link
              to="/admin/agenda"
              className="px-6 py-2.5 bg-brand-600 hover:bg-brand-500 text-white font-semibold text-sm rounded-xl transition-all"
            >
              Voltar para Agenda
            </Link>
          </div>
        </div>
      ) : (
        /* Formulário de Pagamento para Atendimento Pendente */
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
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-400">Data Agendada:</span>
              <span className="text-white flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-brand-400" />
                {format(parseISO(selectedAppointment.dataHoraInicio), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
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
                Justificativa do Ajuste (obrigatório se houver desconto ou acréscimo)
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
              placeholder="Ex: Pago com chave PIX CNPJ, comprovante verificado..."
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
