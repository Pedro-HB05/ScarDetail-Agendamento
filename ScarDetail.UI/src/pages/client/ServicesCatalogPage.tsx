import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { planService } from '../../services/appServices';
import { Link } from 'react-router-dom';
import { Sparkles, Clock, ArrowRight } from 'lucide-react';
import type { VehicleCategory } from '../../types';
import { formatDuration } from '../../utils/format';

export const ServicesCatalogPage: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<VehicleCategory>('Sedan');

  const { data: services = [], isLoading } = useQuery({
    queryKey: ['active-services'],
    queryFn: () => planService.getActiveServices(),
  });

  const categories: Array<{ key: VehicleCategory; label: string }> = [
    { key: 'Hatch', label: 'Hatch' },
    { key: 'Sedan', label: 'Sedan' },
    { key: 'SUV', label: 'SUV' },
    { key: 'Camionete', label: 'Camionete' },
    { key: 'Wagon', label: 'Wagon (Perua)' },
  ];

  const getPriceForCategory = (service: typeof services[0], category: VehicleCategory) => {
    switch (category) {
      case 'Hatch':
        return service.precoHatch;
      case 'Sedan':
        return service.precoSedan;
      case 'SUV':
        return service.precoSuv;
      case 'Camionete':
        return service.precoCamionete;
      case 'Wagon':
        return service.precoWagon;
    }
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <div className="text-center max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/10 border border-brand-500/30 text-brand-400 text-xs font-semibold mb-3">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Tabela Transparente de Preços</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white">
          Nossos Serviços de Estética Automotiva
        </h1>
        <p className="text-sm text-slate-400 mt-2">
          Valores adaptados ao porte e categoria do seu veículo com garantia de excelência no atendimento a domicílio.
        </p>

        {/* Filtro de Categoria em Destaque */}
        <div className="mt-6 inline-flex p-1.5 bg-slate-900 border border-slate-800 rounded-2xl gap-1">
          {categories.map((cat) => (
            <button
              key={cat.key}
              onClick={() => setSelectedCategory(cat.key)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                selectedCategory === cat.key
                  ? 'bg-brand-600 text-white shadow-md shadow-brand-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="py-12 text-center text-slate-500 text-sm">Carregando catálogo de serviços...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {services.map((s) => {
            const price = getPriceForCategory(s, selectedCategory);
            const isAddon = s.ehAdicional || s.nome.toLowerCase().includes('motor');
            return (
              <div
                key={s.id}
                className={`bg-slate-900 border rounded-3xl p-8 flex flex-col justify-between shadow-xl transition-all group ${
                  isAddon ? 'border-amber-500/40 hover:border-amber-500/70' : 'border-slate-800 hover:border-brand-500/40'
                }`}
              >
                <div>
                  {isAddon && (
                    <div className="flex items-center gap-2 mb-3 flex-wrap">
                      <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-bold uppercase tracking-wider">
                        Serviço Adicional / Extra
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 text-[10px] font-bold">
                        100% a Seco (Linha Vonixx)
                      </span>
                    </div>
                  )}
                  <div className="flex items-start justify-between gap-4">
                    <h3 className="text-xl font-bold text-white group-hover:text-brand-400 transition-colors">
                      {s.nome}
                    </h3>
                    <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-300 shrink-0">
                      <Clock className="w-3.5 h-3.5 text-brand-400" />
                      <span>{formatDuration(s.duracaoMinutos)}</span>
                    </span>
                  </div>

                  <p className="text-sm text-slate-400 mt-3 leading-relaxed">{s.descricao}</p>

                  {isAddon && (
                    <div className="mt-3.5 p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-200/90 leading-relaxed">
                      <strong className="text-amber-300 font-bold block mb-1">🛡️ Limpeza de Motor 100% a Seco com Vonixx</strong>
                      Limpeza técnica feita exclusivamente a seco com produtos específicos da Vonixx. <strong>Não é jogado água</strong> no cofre do motor, protegendo módulo ECU, sensores e componentes elétricos. Pode ser adicionado a qualquer lavagem.
                    </div>
                  )}

                  {/* Tabela de Preços por Categoria */}
                  <div className="mt-6 pt-6 border-t border-slate-800/80">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                      Valores por Categoria:
                    </p>
                    <div className="grid grid-cols-5 gap-2 text-center">
                      <div className={`p-2 rounded-xl border ${selectedCategory === 'Hatch' ? 'bg-brand-600/20 border-brand-500' : 'bg-slate-950 border-slate-800/80'}`}>
                        <p className="text-[10px] text-slate-500 font-bold">Hatch</p>
                        <p className="text-xs font-bold text-white mt-0.5">R$ {s.precoHatch.toFixed(2)}</p>
                      </div>
                      <div className={`p-2 rounded-xl border ${selectedCategory === 'Sedan' ? 'bg-brand-600/20 border-brand-500' : 'bg-slate-950 border-slate-800/80'}`}>
                        <p className="text-[10px] text-slate-500 font-bold">Sedan</p>
                        <p className="text-xs font-bold text-white mt-0.5">R$ {s.precoSedan.toFixed(2)}</p>
                      </div>
                      <div className={`p-2 rounded-xl border ${selectedCategory === 'SUV' ? 'bg-brand-600/20 border-brand-500' : 'bg-slate-950 border-slate-800/80'}`}>
                        <p className="text-[10px] text-slate-500 font-bold">SUV</p>
                        <p className="text-xs font-bold text-white mt-0.5">R$ {s.precoSuv.toFixed(2)}</p>
                      </div>
                      <div className={`p-2 rounded-xl border ${selectedCategory === 'Camionete' ? 'bg-brand-600/20 border-brand-500' : 'bg-slate-950 border-slate-800/80'}`}>
                        <p className="text-[10px] text-slate-500 font-bold">Camionete</p>
                        <p className="text-xs font-bold text-white mt-0.5">R$ {s.precoCamionete.toFixed(2)}</p>
                      </div>
                      <div className={`p-2 rounded-xl border ${selectedCategory === 'Wagon' ? 'bg-brand-600/20 border-brand-500' : 'bg-slate-950 border-slate-800/80'}`}>
                        <p className="text-[10px] text-slate-500 font-bold">Wagon</p>
                        <p className="text-xs font-bold text-white mt-0.5">R$ {s.precoWagon.toFixed(2)}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t border-slate-800 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-slate-500 font-medium">Valor para {categories.find(c => c.key === selectedCategory)?.label}:</p>
                    <p className="text-2xl font-black text-white">
                      {price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </p>
                  </div>
                  <Link
                    to={`/book?serviceId=${s.id}`}
                    className={`inline-flex items-center gap-2 px-5 py-3 text-white font-semibold text-sm rounded-2xl shadow-lg transition-all ${
                      isAddon
                        ? 'bg-amber-600 hover:bg-amber-500 shadow-amber-600/20'
                        : 'bg-brand-600 hover:bg-brand-500 shadow-brand-600/20'
                    }`}
                  >
                    <span>{isAddon ? 'Adicionar ao Agendamento' : 'Agendar Este'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
