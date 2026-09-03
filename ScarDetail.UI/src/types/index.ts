export type UserRole = 'Admin' | 'Client';

export type VehicleCategory = 'Hatch' | 'Sedan' | 'SUV' | 'Camionete' | 'Wagon';

export type AppointmentStatus =
  | 'Pendente'
  | 'Confirmado'
  | 'ACaminho'
  | 'EmExecucao'
  | 'Finalizado'
  | 'Cancelado';

export type PaymentMethod = 'PIX' | 'Cartao' | 'Dinheiro';

export interface User {
  id: string;
  nome: string;
  email: string;
  telefone: string;
  role: UserRole;
  ativo: boolean;
  criadoEm: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  expiracao: string;
  usuario: User;
}

export interface OwnerSetupStatus {
  configuracaoDisponivel: boolean;
  mensagem: string;
}

export interface Vehicle {
  id: string;
  usuarioId: string;
  categoria: VehicleCategory;
  categoriaNomeExibicao: string;
  marca: string;
  modelo: string;
  ano: number;
  placa?: string;
  cor?: string;
  ativo: boolean;
  criadoEm: string;
}

export interface CreateVehicleInput {
  categoria: VehicleCategory;
  marca: string;
  modelo: string;
  ano: number;
  placa?: string;
  cor?: string;
}

export interface Address {
  id: string;
  usuarioId: string;
  apelido: string;
  cep: string;
  logradouro: string;
  numero: string;
  complemento?: string;
  bairro: string;
  cidade: string;
  uf: string;
  pontoReferencia?: string;
  ativo: boolean;
  criadoEm: string;
}

export interface CreateAddressInput {
  apelido: string;
  cep: string;
  logradouro: string;
  numero: string;
  complemento?: string;
  bairro: string;
  cidade: string;
  uf: string;
  pontoReferencia?: string;
}

export interface CheckCepResponse {
  cep: string;
  logradouro: string;
  complemento: string;
  bairro: string;
  cidade: string;
  uf: string;
  atendido: boolean;
  mensagem?: string;
}

export interface ServicePlan {
  id: string;
  nome: string;
  descricao?: string;
  duracaoMinutos: number;
  precoHatch: number;
  precoSedan: number;
  precoSuv: number;
  precoCamionete: number;
  precoWagon: number;
  ativo: boolean;
  criadoEm: string;
  atualizadoEm: string;
}

export interface CreateServicePlanInput {
  nome: string;
  descricao?: string;
  duracaoMinutos: number;
  precoHatch: number;
  precoSedan: number;
  precoSuv: number;
  precoCamionete: number;
  precoWagon: number;
}

export interface PlanAudit {
  id: string;
  planoId: string;
  usuarioId?: string;
  usuarioNome?: string;
  acao: string;
  dadosAnteriores?: string;
  dadosNovos?: string;
  criadoEm: string;
}

export interface PermittedNeighborhood {
  id: string;
  nome: string;
  nomeNormalizado: string;
  cidade: string;
  uf: string;
  ativo: boolean;
  criadoEm: string;
  atualizadoEm: string;
}

export interface CreateNeighborhoodInput {
  nome: string;
  cidade: string;
  uf: string;
}

export interface BusinessHour {
  id: string;
  diaSemana: number;
  nomeDia: string;
  horarioAbertura: string;
  horarioFechamento: string;
  ativo: boolean;
  atualizadoEm: string;
}

export interface AgendaBlock {
  id: string;
  dataHoraInicio: string;
  dataHoraFim: string;
  motivo: string;
  criadoPorUsuarioId: string;
  criadoPorNome?: string;
  ativo: boolean;
  criadoEm: string;
}

export interface CreateAgendaBlockInput {
  dataHoraInicio: string;
  dataHoraFim: string;
  motivo: string;
  forcarSeConflito?: boolean;
}

export interface UpdateAgendaBlockInput extends Omit<CreateAgendaBlockInput, 'forcarSeConflito'> {
  ativo: boolean;
  forcarSeConflito?: boolean;
}

export interface CreateWholeDayBlockInput {
  data: string; // YYYY-MM-DD
  motivo: string;
  forcarSeConflito?: boolean;
}

export interface BlockConflictCheckResponse {
  hasConflict: boolean;
  totalConflitos: number;
  agendamentosConflitantes: Array<{
    id: string;
    clienteNome: string;
    servicoNome: string;
    veiculoModelo: string;
    dataHoraInicio: string;
    dataHoraFimServico: string;
    status: string;
  }>;
}

export interface TimeSlot {
  dataHoraInicio: string;
  dataHoraFimServico: string;
  dataHoraFimOcupacao: string;
  horarioInicioFormatado: string;
  horarioFimFormatado: string;
  disponivel: boolean;
  motivoIndisponibilidade?: string;
}

export interface AvailableSlotsResponse {
  data: string;
  diaSemana: string;
  duracaoServicoMinutos: number;
  bufferMinutos: number;
  slots: TimeSlot[];
}

export interface AppointmentStatusHistory {
  id: string;
  statusAnterior?: AppointmentStatus;
  statusNovo: AppointmentStatus;
  alteradoPorUsuarioId?: string;
  alteradoPorNome?: string;
  observacao?: string;
  criadoEm: string;
}

export interface Payment {
  id: string;
  agendamentoId: string;
  metodo: PaymentMethod;
  valorOriginal: number;
  desconto: number;
  acrescimo: number;
  justificativaAjuste?: string;
  valorFinal: number;
  valorRecebido: number;
  troco: number;
  observacao?: string;
  registradoPorUsuarioId: string;
  registradoPorNome?: string;
  pagoEm: string;
}

export interface Appointment {
  id: string;
  clienteId: string;
  clienteNome: string;
  clienteEmail: string;
  clienteTelefone: string;
  veiculoId: string;
  veiculoCategoria: VehicleCategory;
  veiculoCategoriaExibicao: string;
  veiculoMarca: string;
  veiculoModelo: string;
  veiculoPlaca?: string;
  enderecoId: string;
  enderecoCompleto: string;
  planoId: string;
  servicoNome: string;
  valorCobrado: number;
  duracaoMinutos: number;
  bufferDeslocamentoMinutos: number;
  dataHoraInicio: string;
  dataHoraFimServico: string;
  dataHoraFimOcupacao: string;
  status: AppointmentStatus;
  observacoes?: string;
  motivoCancelamento?: string;
  canceladoEm?: string;
  ativo: boolean;
  criadoEm: string;
  pagamento?: Payment;
  historicoStatus: AppointmentStatusHistory[];
}

export interface CreateAppointmentInput {
  veiculoId: string;
  enderecoId: string;
  planoId: string;
  dataHoraInicio: string;
  observacoes?: string;
}

export interface CreatePaymentInput {
  metodo: PaymentMethod;
  desconto?: number;
  acrescimo?: number;
  justificativaAjuste?: string;
  valorRecebido?: number;
  observacao?: string;
}

export interface FinancialSummary {
  dataInicio: string;
  dataFim: string;
  totalFaturado: number;
  totalDescontos: number;
  totalAcrescimos: number;
  faturamentoPix: number;
  faturamentoCartao: number;
  faturamentoDinheiro: number;
  totalAtendimentosFinalizados: number;
  ticketMedio: number;
}

export interface AgendaOverview {
  totalHoje: number;
  pendentesHoje: number;
  confirmadosHoje: number;
  totalSemana: number;
  totalMes: number;
  faturamentoMesEstimado: number;
  faturamentoMesRealizado: number;
}
