import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { reportService } from '../../services/appServices';
import {
  TrendingUp,
  DollarSign,
  QrCode,
  CreditCard,
  Banknote,
  Percent,
  Calendar,
  Layers,
  Award,
} from 'lucide-react';
import { format, startOfMonth, endOfMonth } from 'date-fns';

export const AdminReportsPage: React.FC = () => {
  const now = new Date();
  const [dataInicio, setDataInicio] = useState(format(startOfMonth(now), 'yyyy-MM-dd'));
  const [dataFim, setDataFim] = useState(format(endOfMonth(now), 'yyyy-MM-dd'));

  const { data: report, isLoading } = useQuery({
    queryKey: ['admin-financial-summary', dataInicio, dataFim],
    queryFn: () =>
      reportService.getFinancialSummary(
        new Date(dataInicio).toISOString(),
        new Date(`${dataFim}T23:59:59`).toISOString()
      ),
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Resumo Financeiro & Faturamento</h1>
          <p className="text-sm text-slate-400 mt-1">
            Relatório de receitas brutas e líquidas, ticket médio e distribuição de meios de pagamento.
          </p>
        </div>

        {/* Date Filter */}
        <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 p-2 rounded-2xl">
          <Calendar className="w-4 h-4 text-brand-400 ml-2" />
          <input
            type="date"
            value={dataInicio}
            onChange={(e) => setDataInicio(e.target.value)}
            className="px-2 py-1 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
          />
          <span className="text-xs text-slate-500">até</span>
          <input
            type="date"
            value={dataFim}
            onChange={(e) => setDataFim(e.target.value)}
            className="px-2 py-1 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="py-12 text-center text-slate-500 text-sm">Calculando demonstrativo financeiro...</div>
      ) : (
        <div className="space-y-6">
          {/* Main KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="bg-gradient-to-br from-emerald-950/60 via-slate-900 to-slate-900 border border-emerald-500/30 rounded-3xl p-6 shadow-xl">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Total Faturado</span>
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <DollarSign className="w-5 h-5" />
                </div>
              </div>
              <p className="text-3xl font-black text-white mt-3">
                {(report?.totalFaturado ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </p>
              <p className="text-xs text-emerald-400 mt-1">Valor líquido recebido no período</p>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-brand-400 uppercase tracking-wider">Ticket Médio</span>
                <div className="w-10 h-10 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-400">
                  <TrendingUp className="w-5 h-5" />
                </div>
              </div>
              <p className="text-3xl font-black text-white mt-3">
                {(report?.ticketMedio ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </p>
              <p className="text-xs text-slate-500 mt-1">Média por atendimento finalizado</p>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-purple-400 uppercase tracking-wider">Atendimentos Concluídos</span>
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                  <Award className="w-5 h-5" />
                </div>
              </div>
              <p className="text-3xl font-black text-white mt-3">{report?.totalAtendimentosFinalizados ?? 0}</p>
              <p className="text-xs text-slate-500 mt-1">Serviços executados com sucesso</p>
            </div>
          </div>

          {/* Distribuição por Forma de Pagamento */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Layers className="w-5 h-5 text-brand-400" />
                <span>Receita por Forma de Pagamento</span>
              </h2>

              <div className="space-y-4">
                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800/80 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                      <QrCode className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white">PIX</p>
                      <p className="text-xs text-slate-500">Instantâneo</p>
                    </div>
                  </div>
                  <p className="text-base font-bold text-emerald-400">
                    {(report?.faturamentoPix ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </p>
                </div>

                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800/80 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
                      <CreditCard className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white">Cartão de Crédito / Débito</p>
                      <p className="text-xs text-slate-500">Maquininha presencial</p>
                    </div>
                  </div>
                  <p className="text-base font-bold text-blue-400">
                    {(report?.faturamentoCartao ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </p>
                </div>

                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800/80 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
                      <Banknote className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white">Dinheiro em Espécie</p>
                      <p className="text-xs text-slate-500">Com cálculo de troco</p>
                    </div>
                  </div>
                  <p className="text-base font-bold text-amber-400">
                    {(report?.faturamentoDinheiro ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </p>
                </div>
              </div>
            </div>

            {/* Ajustes Financeiros */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Percent className="w-5 h-5 text-brand-400" />
                <span>Descontos e Acréscimos Concedidos</span>
              </h2>

              <div className="space-y-4">
                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800/80 flex items-center justify-between">
                  <span className="text-sm text-slate-300">Total em Descontos de Fidelidade/Promoção</span>
                  <span className="text-sm font-bold text-rose-400">
                    - {(report?.totalDescontos ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </span>
                </div>

                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800/80 flex items-center justify-between">
                  <span className="text-sm text-slate-300">Total em Acréscimos (Sujeira Extra/Taxas)</span>
                  <span className="text-sm font-bold text-emerald-400">
                    + {(report?.totalAcrescimos ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
