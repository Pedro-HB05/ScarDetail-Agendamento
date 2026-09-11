import React, { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { addDays, format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  AlertCircle, ArrowLeft, ArrowRight, CalendarDays, Car, Check, CheckCircle2,
  Clock3, CreditCard, MapPin, Plus, Search, ShieldCheck, Sparkles,
} from 'lucide-react';
import { addressService, appointmentService, planService, vehicleService } from '../../services/appServices';
import { formatApiError } from '../../services/api';
import { Modal } from '../../components/Modal';
import type { Address, CheckCepResponse, ServicePlan, TimeSlot, Vehicle, VehicleCategory } from '../../types';
import { formatDuration } from '../../utils/format';

const steps = [
  { number: 1, label: 'Serviço', icon: Sparkles },
  { number: 2, label: 'Veículo', icon: Car },
  { number: 3, label: 'Horário', icon: CalendarDays },
  { number: 4, label: 'Endereço', icon: MapPin },
  { number: 5, label: 'Confirmar', icon: CheckCircle2 },
];

const categories: Array<{ value: VehicleCategory; label: string }> = [
  { value: 'Hatch', label: 'Hatch' }, { value: 'Sedan', label: 'Sedan' },
  { value: 'SUV', label: 'SUV' }, { value: 'Camionete', label: 'Camionete' },
  { value: 'Wagon', label: 'Perua / Wagon' },
];

const getPrice = (plan: ServicePlan | null, category?: VehicleCategory) => {
  if (!plan) return 0;
  if (category === 'Hatch') return plan.precoHatch;
  if (category === 'SUV') return plan.precoSuv;
  if (category === 'Camionete') return plan.precoCamionete;
  if (category === 'Wagon') return plan.precoWagon;
  return plan.precoSedan;
};

const normalize = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();

export const BookingWizardPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const [step, setStep] = useState(1);
  const [selectedPlan, setSelectedPlan] = useState<ServicePlan | null>(null);
  const [selectedAddon, setSelectedAddon] = useState<ServicePlan | null>(null);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
  const [selectedDate, setSelectedDate] = useState(format(addDays(new Date(), 1), 'yyyy-MM-dd'));
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [notes, setNotes] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [vehicleModalOpen, setVehicleModalOpen] = useState(false);
  const [addressModalOpen, setAddressModalOpen] = useState(false);
  const [cepResult, setCepResult] = useState<CheckCepResponse | null>(null);
  const [checkingCep, setCheckingCep] = useState(false);
  const [vehicleForm, setVehicleForm] = useState({
    categoria: 'Sedan' as VehicleCategory, marca: '', modelo: '',
    ano: new Date().getFullYear(), placa: '', cor: '',
  });
  const [addressForm, setAddressForm] = useState({
    apelido: 'Casa', cep: '', logradouro: '', numero: '', complemento: '', bairro: '',
    cidade: 'Curitiba', uf: 'PR', pontoReferencia: '',
  });

  const { data: services = [], isLoading: loadingServices } = useQuery({
    queryKey: ['active-services'], queryFn: planService.getActiveServices,
  });
  const { data: vehicles = [], isLoading: loadingVehicles } = useQuery({
    queryKey: ['my-vehicles'], queryFn: () => vehicleService.getMyVehicles(),
  });
  const { data: addresses = [], isLoading: loadingAddresses } = useQuery({
    queryKey: ['my-addresses'], queryFn: () => addressService.getMyAddresses(),
  });

  const getServiceCanonicalKey = (name: string) => {
    const norm = normalize(name);
    if (norm.includes('motor')) return 'motor';
    if (norm.includes('tecnica') || norm.includes('detalhada')) return 'detalhada_tecnica';
    if (norm.includes('com cera')) return 'com_cera';
    if (norm.includes('sem cera')) return 'sem_cera';
    if (norm.includes('externa')) return 'externa';
    if (norm.includes('interna')) return 'interna';
    return norm;
  };

  const mainServices = useMemo(() => {
    const list = services.filter((s) => !s.ehAdicional && !s.nome.toLowerCase().includes('motor'));
    const seen = new Set<string>();
    return list.filter((s) => {
      const key = getServiceCanonicalKey(s.nome);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [services]);

  const addonServices = useMemo(() => {
    const list = services.filter((s) => s.ehAdicional || s.nome.toLowerCase().includes('motor'));
    const seen = new Set<string>();
    return list.filter((s) => {
      const key = getServiceCanonicalKey(s.nome);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [services]);

  const { data: slotsData, isLoading: loadingSlots } = useQuery({
    queryKey: ['available-slots', selectedPlan?.id, selectedDate, selectedAddon?.id],
    queryFn: () => appointmentService.getAvailableSlots(selectedPlan!.id, selectedDate, selectedAddon?.id),
    enabled: !!selectedPlan && step >= 3,
  });

  useEffect(() => {
    if (services.length === 0) return;
    const serviceId = searchParams.get('serviceId');
    const serviceName = searchParams.get('servico');
    if (!serviceId && !serviceName) {
      if (!selectedPlan && mainServices.length > 0) {
        setSelectedPlan(mainServices[0]);
      }
      return;
    }

    const matchedService = services.find((service) =>
      service.id === serviceId || (serviceName && normalize(service.nome) === normalize(serviceName))
    );
    if (matchedService) {
      if (matchedService.ehAdicional || matchedService.nome.toLowerCase().includes('motor')) {
        setSelectedAddon(matchedService);
        if (!selectedPlan && mainServices.length > 0) {
          setSelectedPlan(mainServices[0]);
        }
      } else {
        setSelectedPlan(matchedService);
      }
    }
  }, [searchParams, services, mainServices, selectedPlan]);

  const basePrice = getPrice(selectedPlan, selectedVehicle?.categoria);
  const addonPrice = selectedAddon ? getPrice(selectedAddon, selectedVehicle?.categoria) : 0;
  const currentPrice = basePrice + addonPrice;
  const totalDuration = (selectedPlan?.duracaoMinutos || 0) + (selectedAddon?.duracaoMinutos || 0);

  const availableSlots = useMemo(() => slotsData?.slots.filter((slot) => slot.disponivel) ?? [], [slotsData]);

  const createVehicle = useMutation({
    mutationFn: () => vehicleService.createVehicle(vehicleForm),
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: ['my-vehicles'] });
      setSelectedVehicle(created); setVehicleModalOpen(false); setErrorMessage(null);
    },
    onError: (error) => setErrorMessage(formatApiError(error)),
  });
  const createAddress = useMutation({
    mutationFn: () => addressService.createAddress(addressForm),
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: ['my-addresses'] });
      setSelectedAddress(created); setAddressModalOpen(false); setErrorMessage(null);
    },
    onError: (error) => setErrorMessage(formatApiError(error)),
  });
  const createAppointment = useMutation({
    mutationFn: () => appointmentService.createAppointment({
      planoId: selectedPlan!.id,
      adicionalId: selectedAddon?.id,
      veiculoId: selectedVehicle!.id,
      enderecoId: selectedAddress!.id,
      dataHoraInicio: selectedSlot!.dataHoraInicio,
      observacoes: notes.trim() || undefined,
    }),
    onSuccess: (created) => navigate(`/appointments?success=true&id=${created.id}`, { replace: true }),
    onError: (error) => setErrorMessage(formatApiError(error)),
  });

  const goNext = () => {
    const valid = [!!selectedPlan, !!selectedVehicle, !!selectedSlot, !!selectedAddress][step - 1];
    if (step < 5 && !valid) { setErrorMessage('Faça uma escolha para continuar.'); return; }
    setErrorMessage(null); setStep((current) => Math.min(5, current + 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const checkCep = async () => {
    if (addressForm.cep.replace(/\D/g, '').length !== 8) {
      setErrorMessage('Digite um CEP válido com 8 números.'); return;
    }
    try {
      setCheckingCep(true); setErrorMessage(null);
      const result = await addressService.checkCep(addressForm.cep);
      setCepResult(result);
      setAddressForm((current) => ({ ...current, cep: result.cep, logradouro: result.logradouro,
        complemento: result.complemento || current.complemento, bairro: result.bairro,
        cidade: result.cidade, uf: result.uf }));
    } catch (error) { setErrorMessage(formatApiError(error)); }
    finally { setCheckingCep(false); }
  };

  const surface = 'rounded-3xl border border-stone-200 bg-white p-5 shadow-sm sm:p-6';
  const selection = (active: boolean) => `w-full rounded-2xl border p-4 text-left transition-all ${
    active ? 'border-slate-950 bg-slate-950 text-white shadow-lg' : 'border-stone-200 bg-white hover:border-slate-400 hover:shadow-sm'
  }`;

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-6 rounded-3xl bg-slate-950 p-5 text-white sm:p-7">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div><p className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-amber-300"><Sparkles className="h-4 w-4" />Agendamento fácil</p><h1 className="text-2xl font-black sm:text-3xl">Vamos cuidar do seu carro?</h1><p className="mt-2 max-w-xl text-sm text-slate-300">Escolha uma opção por vez. O atendimento é feito no seu endereço, em Curitiba.</p></div>
          <div className="flex items-center gap-2 rounded-2xl bg-white/10 px-4 py-3 text-xs text-slate-200"><ShieldCheck className="h-5 w-5 text-emerald-300" />Pagamento somente após o serviço</div>
        </div>
      </div>

      <ol className="mb-7 grid grid-cols-5 gap-1.5 sm:gap-3" aria-label="Etapas do agendamento">
        {steps.map(({ number, label, icon: Icon }) => <li key={number}><button type="button" disabled={number > step} onClick={() => number < step && setStep(number)} className={`flex w-full flex-col items-center gap-1 rounded-2xl border px-1 py-2.5 text-[10px] font-bold sm:flex-row sm:justify-center sm:px-3 sm:text-xs ${number === step ? 'border-slate-950 bg-white text-slate-950' : number < step ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-stone-200 bg-stone-100 text-stone-400'}`}>{number < step ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}<span className="hidden sm:inline">{label}</span><span className="sm:hidden">{number}</span></button></li>)}
      </ol>

      {errorMessage && <div className="mb-5 flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-medium text-rose-700"><AlertCircle className="h-5 w-5 shrink-0" /><span>{errorMessage}</span></div>}

      {step === 1 && <section className={surface}>
        <SectionTitle step="Etapa 1 de 5" title="Qual serviço você quer?" description="Escolha o serviço principal. Abaixo você também pode adicionar serviços extras." />
        {loadingServices ? (
          <Loading text="Buscando serviços..." />
        ) : (
          <div className="space-y-6">
            <div>
              <p className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-500">Serviços Principais</p>
              <div className="grid gap-3 sm:grid-cols-2">
                {mainServices.map((plan) => (
                  <button
                    key={plan.id}
                    type="button"
                    onClick={() => setSelectedPlan(plan)}
                    className={selection(selectedPlan?.id === plan.id)}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-black">{plan.nome}</h3>
                        <p className={`mt-1 text-sm leading-relaxed ${selectedPlan?.id === plan.id ? 'text-slate-300' : 'text-slate-500'}`}>
                          {plan.descricao}
                        </p>
                      </div>
                      <SelectionDot active={selectedPlan?.id === plan.id} />
                    </div>
                    <div className={`mt-4 flex items-end justify-between border-t pt-3 ${selectedPlan?.id === plan.id ? 'border-white/15' : 'border-stone-100'}`}>
                      <span className="flex items-center gap-1.5 text-xs">
                        <Clock3 className="h-4 w-4" />
                        {formatDuration(plan.duracaoMinutos)}
                      </span>
                      <strong>A partir de {plan.precoHatch.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</strong>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {addonServices.length > 0 && (
              <div className="pt-6 border-t border-stone-200">
                <div className="mb-4">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-bold uppercase tracking-wider mb-2">
                    <Plus className="w-3.5 h-3.5" />
                    <span>Serviço Adicional / Extra (Opcional)</span>
                  </div>
                  <h3 className="text-lg font-black text-slate-950">Deseja adicionar a Lavagem de Motor?</h3>
                  <p className="text-xs sm:text-sm text-slate-500">
                    Você pode selecionar este adicional para somar ao serviço escolhido. A duração e o valor serão somados automaticamente.
                  </p>
                </div>

                <div className="space-y-3">
                  {addonServices.map((addon) => {
                    const isSelected = selectedAddon?.id === addon.id;
                    return (
                      <div
                        key={addon.id}
                        role="button"
                        tabIndex={0}
                        onClick={() => setSelectedAddon(isSelected ? null : addon)}
                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelectedAddon(isSelected ? null : addon); } }}
                        className={`cursor-pointer rounded-2xl border-2 p-5 text-left transition-all ${
                          isSelected
                            ? 'border-amber-500 bg-amber-50/80 shadow-md ring-2 ring-amber-400/20'
                            : 'border-stone-200 bg-stone-50/70 hover:border-amber-300 hover:bg-white'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="font-black text-slate-900 text-base">{addon.nome}</h4>
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-200/70 text-amber-900 text-[11px] font-bold">
                                <Sparkles className="w-3 h-3 text-amber-700" />
                                100% a Seco (Linha Vonixx)
                              </span>
                            </div>
                            <p className="mt-1.5 text-xs sm:text-sm leading-relaxed text-slate-600">
                              {addon.descricao}
                            </p>
                          </div>
                          <div className="flex flex-col items-end gap-2 shrink-0">
                            <div className={`flex h-6 w-6 items-center justify-center rounded-lg border transition-all ${
                              isSelected ? 'border-amber-500 bg-amber-500 text-white' : 'border-stone-300 bg-white'
                            }`}>
                              {isSelected && <Check className="h-4 w-4 stroke-[3]" />}
                            </div>
                            <span className="text-xs font-black text-amber-900 bg-amber-100 px-2 py-0.5 rounded-md">
                              + R$ {addon.precoHatch.toFixed(2)}
                            </span>
                          </div>
                        </div>

                        {/* Banner de Especificação do Motor Vonixx */}
                        <div className="mt-3.5 flex items-start gap-2.5 rounded-xl bg-white p-3 border border-amber-200 text-xs text-slate-700 shadow-sm">
                          <ShieldCheck className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
                          <span>
                            <strong>Limpeza de Motor 100% a Seco com Vonixx:</strong> A lavagem de motor é realizada a seco com produto específico da Vonixx. <strong>Não é jogado água</strong> no motor, apenas este produto técnico para limpar e desengraxar com total segurança para módulos eletrônicos e componentes elétricos.
                          </span>
                        </div>

                        <div className="mt-3 flex items-center justify-between border-t border-stone-200/80 pt-2.5 text-xs">
                          <span className="flex items-center gap-1.5 font-semibold text-slate-600">
                            <Clock3 className="h-3.5 w-3.5 text-amber-600" />
                            + {formatDuration(addon.duracaoMinutos)} de tempo adicional
                          </span>
                          <span className="font-extrabold text-amber-800">
                            {isSelected ? '✓ Adicional selecionado' : '+ Clique para adicionar'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {selectedPlan && (
              <div className="rounded-2xl bg-stone-100 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs border border-stone-200">
                <div>
                  <span className="text-slate-500 font-medium">Resumo da seleção: </span>
                  <strong className="text-slate-950 font-black">{selectedPlan.nome}</strong>
                  {selectedAddon && (
                    <span className="text-amber-800 font-bold"> + {selectedAddon.nome}</span>
                  )}
                  <span className="text-slate-500 ml-1.5">· Duração total estimada: <strong className="text-slate-900">{formatDuration(totalDuration)}</strong></span>
                </div>
                <span className="text-xs font-bold text-slate-800">
                  A partir de {(selectedPlan.precoHatch + (selectedAddon ? selectedAddon.precoHatch : 0)).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </span>
              </div>
            )}
          </div>
        )}
        <StepActions canContinue={!!selectedPlan} onNext={goNext} />
      </section>}

      {step === 2 && <section className={surface}>
        <HeaderWithAdd step="Etapa 2 de 5" title="Qual carro vamos atender?" description="Isso define o valor correto do serviço." onAdd={() => setVehicleModalOpen(true)} />
        {loadingVehicles ? <Loading text="Buscando seus veículos..." /> : vehicles.length === 0 ? <EmptyChoice icon={Car} title="Cadastre seu primeiro veículo" description="Você faz isso aqui mesmo e continua o agendamento de onde parou." action="Cadastrar veículo" onAction={() => setVehicleModalOpen(true)} /> : <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{vehicles.map((vehicle) => <button key={vehicle.id} type="button" onClick={() => setSelectedVehicle(vehicle)} className={selection(selectedVehicle?.id === vehicle.id)}><Car className="mb-4 h-6 w-6 text-brand-500" /><h3 className="font-black">{vehicle.marca} {vehicle.modelo}</h3><p className={`mt-1 text-xs ${selectedVehicle?.id === vehicle.id ? 'text-slate-300' : 'text-slate-500'}`}>{vehicle.categoriaNomeExibicao} · {vehicle.ano}{vehicle.placa ? ` · ${vehicle.placa}` : ''}</p></button>)}</div>}
        {selectedPlan && selectedVehicle && (
          <PriceCallout
            plan={selectedPlan}
            addon={selectedAddon}
            basePrice={basePrice}
            addonPrice={addonPrice}
            totalPrice={currentPrice}
            categoryName={selectedVehicle.categoriaNomeExibicao}
          />
        )}
        <StepActions canContinue={!!selectedVehicle} onBack={() => setStep(1)} onNext={goNext} />
      </section>}

      {step === 3 && <section className={surface}>
        <SectionTitle
          step="Etapa 3 de 5"
          title="Quando fica melhor para você?"
          description={`Mostramos somente horários livres considerando a duração total de ${formatDuration(totalDuration)}.`}
        />
        <label className="mb-5 block max-w-xs"><span className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-600">Escolha o dia</span><input type="date" value={selectedDate} min={format(new Date(), 'yyyy-MM-dd')} max={format(addDays(new Date(), 60), 'yyyy-MM-dd')} onChange={(event) => { setSelectedDate(event.target.value); setSelectedSlot(null); }} className="w-full rounded-xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm font-semibold outline-none focus:border-slate-950" /></label>
        {loadingSlots ? <Loading text="Consultando a agenda..." /> : availableSlots.length === 0 ? <div className="rounded-2xl bg-amber-50 p-5 text-sm font-medium text-amber-800">Não encontramos horários livres neste dia. Escolha outra data.</div> : <div><p className="mb-3 text-sm font-bold">Horários disponíveis</p><div className="grid grid-cols-3 gap-2 sm:grid-cols-5 md:grid-cols-7">{availableSlots.map((slot) => <button key={slot.dataHoraInicio} type="button" onClick={() => setSelectedSlot(slot)} className={`rounded-xl border px-2 py-3 text-sm font-black transition ${selectedSlot?.dataHoraInicio === slot.dataHoraInicio ? 'border-slate-950 bg-slate-950 text-white' : 'border-stone-200 bg-white hover:border-slate-500'}`}>{slot.horarioInicioFormatado}</button>)}</div></div>}
        <StepActions canContinue={!!selectedSlot} onBack={() => setStep(2)} onNext={goNext} />
      </section>}

      {step === 4 && <section className={surface}>
        <HeaderWithAdd step="Etapa 4 de 5" title="Onde será o atendimento?" description="Atendemos endereços dentro de Curitiba." onAdd={() => setAddressModalOpen(true)} />
        {loadingAddresses ? <Loading text="Buscando seus endereços..." /> : addresses.length === 0 ? <EmptyChoice icon={MapPin} title="Cadastre o local do atendimento" description="Consulte o CEP e confirme se o bairro está dentro da área atendida." action="Cadastrar endereço" onAction={() => setAddressModalOpen(true)} /> : <div className="grid gap-3 sm:grid-cols-2">{addresses.map((address) => <button key={address.id} type="button" onClick={() => setSelectedAddress(address)} className={selection(selectedAddress?.id === address.id)}><MapPin className="mb-3 h-5 w-5 text-emerald-500" /><p className="text-xs font-bold uppercase tracking-wider opacity-70">{address.apelido}</p><h3 className="mt-1 font-black">{address.logradouro}, {address.numero}</h3><p className={`mt-1 text-xs ${selectedAddress?.id === address.id ? 'text-slate-300' : 'text-slate-500'}`}>{address.bairro} · {address.cidade}/{address.uf}</p></button>)}</div>}
        <StepActions canContinue={!!selectedAddress} onBack={() => setStep(3)} onNext={goNext} />
      </section>}

      {step === 5 && selectedPlan && selectedVehicle && selectedSlot && selectedAddress && <section className={surface}>
        <SectionTitle step="Última etapa" title="Confira antes de confirmar" description="Seu horário só será reservado depois da confirmação." />
        <div className="grid gap-3 sm:grid-cols-2">
          <SummaryItem
            icon={Sparkles}
            label="Serviço"
            value={selectedAddon ? `${selectedPlan.nome} + ${selectedAddon.nome}` : selectedPlan.nome}
            detail={`Duração total: ${formatDuration(totalDuration)}${selectedAddon ? ' (inclui Lavagem de Motor a seco)' : ''}`}
          />
          <SummaryItem icon={Car} label="Veículo" value={`${selectedVehicle.marca} ${selectedVehicle.modelo}`} detail={selectedVehicle.categoriaNomeExibicao} />
          <SummaryItem icon={CalendarDays} label="Data e horário" value={format(parseISO(selectedSlot.dataHoraInicio), "EEEE, dd 'de' MMMM", { locale: ptBR })} detail={`${selectedSlot.horarioInicioFormatado} às ${selectedSlot.horarioFimFormatado}`} />
          <SummaryItem icon={MapPin} label="Endereço" value={`${selectedAddress.logradouro}, ${selectedAddress.numero}`} detail={`${selectedAddress.bairro} · Curitiba/PR`} />
        </div>
        {selectedAddon && (
          <div className="mt-4 rounded-2xl bg-amber-50 border border-amber-200 p-4 text-xs text-amber-900">
            <p className="font-bold flex items-center gap-1.5 text-amber-900">
              <ShieldCheck className="h-4 w-4 text-amber-600" />
              Adicional Selecionado: {selectedAddon.nome} (+ {formatDuration(selectedAddon.duracaoMinutos)})
            </p>
            <p className="mt-1 text-amber-800">
              Limpeza de motor 100% a seco com produtos da linha Vonixx — sem jato de água no cofre do motor, garantindo segurança para a eletrônica do veículo.
            </p>
          </div>
        )}
        <label className="mt-5 block"><span className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-600">Alguma observação? <span className="font-normal normal-case text-slate-400">(opcional)</span></span><textarea rows={3} value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Ex.: interfone, vaga disponível, cuidados especiais..." className="w-full rounded-2xl border border-stone-200 bg-stone-50 p-4 text-sm outline-none focus:border-slate-950" /></label>
        <div className="mt-5 flex flex-col gap-4 rounded-2xl bg-emerald-50 p-5 sm:flex-row sm:items-center sm:justify-between border border-emerald-200">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-emerald-700">Valor do atendimento</p>
            <p className="text-3xl font-black text-slate-950">{currentPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
            {selectedAddon && (
              <p className="mt-1 text-xs font-semibold text-emerald-900">
                {selectedPlan.nome} ({basePrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}) + {selectedAddon.nome} ({addonPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })})
              </p>
            )}
            <p className="mt-1 flex items-center gap-1.5 text-xs font-medium text-emerald-800"><CreditCard className="h-4 w-4" />PIX, cartão ou dinheiro após o serviço</p>
          </div>
          <button disabled={createAppointment.isPending} onClick={() => createAppointment.mutate()} className="rounded-2xl bg-emerald-600 px-6 py-4 font-black text-white shadow-lg shadow-emerald-600/20 hover:bg-emerald-500 disabled:opacity-50">{createAppointment.isPending ? 'Reservando...' : 'Confirmar agendamento'}</button>
        </div>
        <StepActions onBack={() => setStep(4)} />
      </section>}

      <Modal isOpen={vehicleModalOpen} onClose={() => setVehicleModalOpen(false)} title="Adicionar veículo"><form onSubmit={(event) => { event.preventDefault(); createVehicle.mutate(); }} className="space-y-4"><p className="text-sm text-slate-400">Cadastre sem sair do agendamento.</p><Field label="Categoria"><select value={vehicleForm.categoria} onChange={(event) => setVehicleForm({ ...vehicleForm, categoria: event.target.value as VehicleCategory })} className="form-control">{categories.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></Field><div className="grid grid-cols-2 gap-3"><Field label="Marca"><input required value={vehicleForm.marca} onChange={(event) => setVehicleForm({ ...vehicleForm, marca: event.target.value })} className="form-control" placeholder="Volkswagen" /></Field><Field label="Modelo"><input required value={vehicleForm.modelo} onChange={(event) => setVehicleForm({ ...vehicleForm, modelo: event.target.value })} className="form-control" placeholder="Polo" /></Field></div><div className="grid grid-cols-3 gap-3"><Field label="Ano"><input required type="number" min="1900" max={new Date().getFullYear() + 1} value={vehicleForm.ano} onChange={(event) => setVehicleForm({ ...vehicleForm, ano: Number(event.target.value) })} className="form-control" /></Field><Field label="Placa"><input value={vehicleForm.placa} onChange={(event) => setVehicleForm({ ...vehicleForm, placa: event.target.value.toUpperCase() })} className="form-control" placeholder="ABC1D23" /></Field><Field label="Cor"><input value={vehicleForm.cor} onChange={(event) => setVehicleForm({ ...vehicleForm, cor: event.target.value })} className="form-control" placeholder="Prata" /></Field></div><ModalActions loading={createVehicle.isPending} onCancel={() => setVehicleModalOpen(false)} submitLabel="Salvar e continuar" /></form></Modal>

      <Modal isOpen={addressModalOpen} onClose={() => setAddressModalOpen(false)} title="Adicionar endereço"><form onSubmit={(event) => { event.preventDefault(); if (!cepResult?.atendido) { setErrorMessage('Consulte um CEP atendido antes de salvar.'); return; } createAddress.mutate(); }} className="space-y-4"><div className="grid grid-cols-[1fr_auto] gap-2"><Field label="CEP"><input required value={addressForm.cep} onChange={(event) => { setAddressForm({ ...addressForm, cep: event.target.value }); setCepResult(null); }} className="form-control" placeholder="00000-000" /></Field><button type="button" onClick={checkCep} className="mt-6 flex h-[42px] items-center gap-2 rounded-xl bg-brand-600 px-4 text-sm font-bold text-white hover:bg-brand-500"><Search className="h-4 w-4" />{checkingCep ? 'Buscando' : 'Buscar'}</button></div>{cepResult && <div className={`rounded-xl border p-3 text-xs font-semibold ${cepResult.atendido ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300' : 'border-rose-500/30 bg-rose-500/10 text-rose-300'}`}>{cepResult.atendido ? `Ótimo! Atendemos o bairro ${cepResult.bairro}.` : `Ainda não atendemos o bairro ${cepResult.bairro}.`}</div>}<Field label="Como quer identificar?"><input required value={addressForm.apelido} onChange={(event) => setAddressForm({ ...addressForm, apelido: event.target.value })} className="form-control" placeholder="Casa" /></Field><Field label="Rua / Avenida"><input required value={addressForm.logradouro} onChange={(event) => setAddressForm({ ...addressForm, logradouro: event.target.value })} className="form-control" /></Field><div className="grid grid-cols-2 gap-3"><Field label="Número"><input required value={addressForm.numero} onChange={(event) => setAddressForm({ ...addressForm, numero: event.target.value })} className="form-control" /></Field><Field label="Complemento"><input value={addressForm.complemento} onChange={(event) => setAddressForm({ ...addressForm, complemento: event.target.value })} className="form-control" /></Field></div><Field label="Bairro"><input required readOnly value={addressForm.bairro} className="form-control opacity-80" /></Field><div className="grid grid-cols-[1fr_80px] gap-3"><Field label="Cidade"><input readOnly value={addressForm.cidade} className="form-control opacity-80" /></Field><Field label="UF"><input readOnly value={addressForm.uf} className="form-control opacity-80" /></Field></div><Field label="Ponto de referência"><input value={addressForm.pontoReferencia} onChange={(event) => setAddressForm({ ...addressForm, pontoReferencia: event.target.value })} className="form-control" placeholder="Próximo ao mercado..." /></Field><ModalActions loading={createAddress.isPending} onCancel={() => setAddressModalOpen(false)} submitLabel="Salvar e continuar" /></form></Modal>
    </div>
  );
};

const Loading = ({ text }: { text: string }) => <div className="rounded-2xl bg-stone-50 p-8 text-center text-sm text-slate-500">{text}</div>;
const SectionTitle = ({ step, title, description }: { step: string; title: string; description: string }) => <div className="mb-5"><p className="text-xs font-bold uppercase tracking-wider text-brand-600">{step}</p><h2 className="mt-1 text-xl font-black">{title}</h2><p className="mt-1 text-sm text-slate-500">{description}</p></div>;
const HeaderWithAdd = ({ step, title, description, onAdd }: { step: string; title: string; description: string; onAdd: () => void }) => <div className="mb-5 flex items-start justify-between gap-3"><SectionTitle step={step} title={title} description={description} /><button type="button" onClick={onAdd} className="flex shrink-0 items-center gap-2 rounded-xl bg-stone-100 px-3 py-2 text-xs font-bold hover:bg-stone-200"><Plus className="h-4 w-4" />Adicionar</button></div>;
const SelectionDot = ({ active }: { active: boolean }) => <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border ${active ? 'border-amber-300 bg-amber-300 text-slate-950' : 'border-stone-300'}`}>{active && <Check className="h-4 w-4" />}</span>;
const StepActions = ({ canContinue, onBack, onNext }: { canContinue?: boolean; onBack?: () => void; onNext?: () => void }) => <div className="mt-7 flex items-center justify-between border-t border-stone-100 pt-5">{onBack ? <button type="button" onClick={onBack} className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-bold text-slate-500 hover:bg-stone-100 hover:text-slate-950"><ArrowLeft className="h-4 w-4" />Voltar</button> : <span />}{onNext && <button type="button" disabled={!canContinue} onClick={onNext} className="flex items-center gap-2 rounded-xl bg-brand-600 px-5 py-3 text-sm font-black text-white shadow-lg shadow-brand-600/15 hover:bg-brand-500 disabled:cursor-not-allowed disabled:opacity-40">Continuar<ArrowRight className="h-4 w-4" /></button>}</div>;
const EmptyChoice = ({ icon: Icon, title, description, action, onAction }: { icon: typeof Car; title: string; description: string; action: string; onAction: () => void }) => <div className="rounded-2xl border border-dashed border-stone-300 bg-stone-50 p-8 text-center"><Icon className="mx-auto h-9 w-9 text-slate-400" /><h3 className="mt-3 font-black">{title}</h3><p className="mx-auto mt-1 max-w-sm text-sm text-slate-500">{description}</p><button type="button" onClick={onAction} className="mt-4 inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-3 text-sm font-bold text-white"><Plus className="h-4 w-4" />{action}</button></div>;
const PriceCallout = ({
  plan,
  addon,
  basePrice,
  addonPrice,
  totalPrice,
  categoryName,
}: {
  plan: ServicePlan;
  addon?: ServicePlan | null;
  basePrice: number;
  addonPrice: number;
  totalPrice: number;
  categoryName?: string;
}) => (
  <div className="mt-5 rounded-2xl bg-amber-50 p-4 sm:p-5 border border-amber-200">
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
      <div>
        <p className="text-xs font-bold uppercase tracking-wider text-amber-800">
          Valor para {categoryName || 'este veículo'}
        </p>
        <p className="text-sm font-bold text-slate-900 mt-1">
          {plan.nome}: <span className="font-extrabold">{basePrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
        </p>
        {addon && (
          <p className="text-xs font-semibold text-amber-900 mt-1 flex items-center gap-1">
            <Plus className="w-3.5 h-3.5 text-amber-700 shrink-0 inline" />
            <span>{addon.nome} (a seco Vonixx): <strong className="font-extrabold">{addonPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</strong></span>
          </p>
        )}
      </div>
      <div className="border-t sm:border-t-0 pt-2 sm:pt-0 sm:text-right border-amber-200">
        <p className="text-xs font-bold uppercase tracking-wider text-amber-700">Total do Atendimento</p>
        <strong className="text-2xl font-black text-slate-950">
          {totalPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
        </strong>
      </div>
    </div>
  </div>
);
const SummaryItem = ({ icon: Icon, label, value, detail }: { icon: typeof Car; label: string; value: string; detail: string }) => <div className="rounded-2xl border border-stone-200 bg-stone-50 p-4"><Icon className="mb-3 h-5 w-5 text-brand-600" /><p className="text-xs font-bold uppercase tracking-wider text-slate-500">{label}</p><p className="mt-1 font-black capitalize text-slate-950">{value}</p><p className="mt-1 text-xs text-slate-500">{detail}</p></div>;
const Field = ({ label, children }: { label: string; children: React.ReactNode }) => <label className="block"><span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-300">{label}</span>{children}</label>;
const ModalActions = ({ loading, onCancel, submitLabel }: { loading: boolean; onCancel: () => void; submitLabel: string }) => <div className="flex justify-end gap-3 border-t border-slate-800 pt-4"><button type="button" onClick={onCancel} className="px-4 py-2 text-sm font-bold text-slate-400 hover:text-white">Cancelar</button><button type="submit" disabled={loading} className="rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-black text-white hover:bg-brand-500 disabled:opacity-50">{loading ? 'Salvando...' : submitLabel}</button></div>;
