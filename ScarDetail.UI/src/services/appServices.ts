import { api } from './api';
import type {
  Address,
  AgendaBlock,
  Appointment,
  AppointmentStatus,
  AvailableSlotsResponse,
  BlockConflictCheckResponse,
  BusinessHour,
  CheckCepResponse,
  CreateAddressInput,
  CreateAgendaBlockInput,
  CreateAppointmentInput,
  CreateNeighborhoodInput,
  CreatePaymentInput,
  CreateServicePlanInput,
  CreateVehicleInput,
  UpdateAgendaBlockInput,
  FinancialSummary,
  AgendaOverview,
  PermittedNeighborhood,
  PlanAudit,
  ServicePlan,
  Vehicle,
} from '../types';

export const vehicleService = {
  async getMyVehicles(includeInactive = false): Promise<Vehicle[]> {
    const res = await api.get<Vehicle[]>('/vehicles', { params: { includeInactive } });
    return res.data;
  },

  async getVehicleById(id: string): Promise<Vehicle> {
    const res = await api.get<Vehicle>(`/vehicles/${id}`);
    return res.data;
  },

  async createVehicle(data: CreateVehicleInput): Promise<Vehicle> {
    const res = await api.post<Vehicle>('/vehicles', data);
    return res.data;
  },

  async updateVehicle(id: string, data: CreateVehicleInput & { ativo: boolean }): Promise<Vehicle> {
    const res = await api.put<Vehicle>(`/vehicles/${id}`, data);
    return res.data;
  },

  async deleteVehicle(id: string): Promise<void> {
    await api.delete(`/vehicles/${id}`);
  },
};

export const addressService = {
  async checkCep(cep: string): Promise<CheckCepResponse> {
    const res = await api.get<CheckCepResponse>(`/addresses/check-cep/${cep}`);
    return res.data;
  },

  async getMyAddresses(includeInactive = false): Promise<Address[]> {
    const res = await api.get<Address[]>('/addresses', { params: { includeInactive } });
    return res.data;
  },

  async getAddressById(id: string): Promise<Address> {
    const res = await api.get<Address>(`/addresses/${id}`);
    return res.data;
  },

  async createAddress(data: CreateAddressInput): Promise<Address> {
    const res = await api.post<Address>('/addresses', data);
    return res.data;
  },

  async updateAddress(id: string, data: CreateAddressInput & { ativo: boolean }): Promise<Address> {
    const res = await api.put<Address>(`/addresses/${id}`, data);
    return res.data;
  },

  async deleteAddress(id: string): Promise<void> {
    await api.delete(`/addresses/${id}`);
  },
};

export const planService = {
  async getActiveServices(): Promise<ServicePlan[]> {
    const res = await api.get<ServicePlan[]>('/services');
    return res.data;
  },

  async getServiceById(id: string): Promise<ServicePlan> {
    const res = await api.get<ServicePlan>(`/services/${id}`);
    return res.data;
  },

  async getAllServicesAdmin(): Promise<ServicePlan[]> {
    const res = await api.get<ServicePlan[]>('/services/admin/all');
    return res.data;
  },

  async createService(data: CreateServicePlanInput): Promise<ServicePlan> {
    const res = await api.post<ServicePlan>('/services/admin', data);
    return res.data;
  },

  async updateService(id: string, data: CreateServicePlanInput & { ativo: boolean }): Promise<ServicePlan> {
    const res = await api.put<ServicePlan>(`/services/admin/${id}`, data);
    return res.data;
  },

  async toggleServiceStatus(id: string, active: boolean): Promise<void> {
    await api.patch(`/services/admin/${id}/status`, active);
  },

  async getPlanAudits(id: string): Promise<PlanAudit[]> {
    const res = await api.get<PlanAudit[]>(`/services/admin/${id}/audits`);
    return res.data;
  },
};

export const neighborhoodService = {
  async getAll(onlyActive = false): Promise<PermittedNeighborhood[]> {
    const res = await api.get<PermittedNeighborhood[]>('/admin/neighborhoods', { params: { onlyActive } });
    return res.data;
  },

  async create(data: CreateNeighborhoodInput): Promise<PermittedNeighborhood> {
    const res = await api.post<PermittedNeighborhood>('/admin/neighborhoods', data);
    return res.data;
  },

  async update(id: string, data: CreateNeighborhoodInput & { ativo: boolean }): Promise<PermittedNeighborhood> {
    const res = await api.put<PermittedNeighborhood>(`/admin/neighborhoods/${id}`, data);
    return res.data;
  },

  async toggleStatus(id: string, active: boolean): Promise<void> {
    await api.patch(`/admin/neighborhoods/${id}/status`, active);
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/admin/neighborhoods/${id}`);
  },
};

export const workingHoursService = {
  async getAll(): Promise<BusinessHour[]> {
    const res = await api.get<BusinessHour[]>('/workinghours');
    return res.data;
  },

  async update(dayOfWeek: number, data: { horarioAbertura: string; horarioFechamento: string; ativo: boolean }): Promise<BusinessHour> {
    const res = await api.put<BusinessHour>(`/workinghours/admin/${dayOfWeek}`, data);
    return res.data;
  },
};

export const agendaBlockService = {
  async getBlocks(params?: { dataInicio?: string; dataFim?: string; includeInactive?: boolean }): Promise<AgendaBlock[]> {
    const res = await api.get<AgendaBlock[]>('/admin/agendablocks', { params });
    return res.data;
  },

  async checkConflicts(dataHoraInicio: string, dataHoraFim: string): Promise<BlockConflictCheckResponse> {
    const res = await api.get<BlockConflictCheckResponse>('/admin/agendablocks/check-conflicts', {
      params: { dataHoraInicio, dataHoraFim },
    });
    return res.data;
  },

  async createBlock(data: CreateAgendaBlockInput): Promise<AgendaBlock> {
    const res = await api.post<AgendaBlock>('/admin/agendablocks', data);
    return res.data;
  },

  async createWholeDayBlock(data: { data: string; motivo: string; forcarSeConflito?: boolean }): Promise<AgendaBlock> {
    const res = await api.post<AgendaBlock>('/admin/agendablocks/whole-day', data);
    return res.data;
  },

  async updateBlock(id: string, data: UpdateAgendaBlockInput): Promise<AgendaBlock> {
    const res = await api.put<AgendaBlock>(`/admin/agendablocks/${id}`, data);
    return res.data;
  },

  async deleteBlock(id: string): Promise<void> {
    await api.delete(`/admin/agendablocks/${id}`);
  },
};

export const appointmentService = {
  async getAvailableSlots(planoId: string, data: string, adicionalId?: string): Promise<AvailableSlotsResponse> {
    const res = await api.get<AvailableSlotsResponse>('/appointments/available-slots', {
      params: { planoId, data, adicionalId: adicionalId || undefined },
    });
    return res.data;
  },

  async createAppointment(data: CreateAppointmentInput): Promise<Appointment> {
    const res = await api.post<Appointment>('/appointments', data);
    return res.data;
  },

  async getMyAppointments(status?: AppointmentStatus): Promise<Appointment[]> {
    const res = await api.get<Appointment[]>('/appointments/my', { params: { status } });
    return res.data;
  },

  async getAppointmentById(id: string): Promise<Appointment> {
    const res = await api.get<Appointment>(`/appointments/${id}`);
    return res.data;
  },

  async cancelAppointment(id: string, motivo: string): Promise<Appointment> {
    const res = await api.post<Appointment>(`/appointments/${id}/cancel`, { motivo });
    return res.data;
  },

  async rescheduleAppointment(id: string, novaDataHoraInicio: string, motivo?: string): Promise<Appointment> {
    const res = await api.post<Appointment>(`/appointments/${id}/reschedule`, { novaDataHoraInicio, motivo });
    return res.data;
  },

  async getAdminAppointments(params?: {
    dataInicio?: string;
    dataFim?: string;
    status?: AppointmentStatus;
    clienteId?: string;
  }): Promise<Appointment[]> {
    const res = await api.get<Appointment[]>('/appointments/admin/all', { params });
    return res.data;
  },

  async updateStatus(id: string, novoStatus: AppointmentStatus, observacao?: string): Promise<Appointment> {
    const res = await api.patch<Appointment>(`/appointments/admin/${id}/status`, {
      novoStatus,
      observacao,
    });
    return res.data;
  },
};

export const paymentService = {
  async registerPayment(appointmentId: string, data: CreatePaymentInput): Promise<void> {
    await api.post(`/admin/payments/${appointmentId}`, data);
  },

  async getPayment(appointmentId: string): Promise<unknown> {
    const res = await api.get(`/admin/payments/${appointmentId}`);
    return res.data;
  },
};

export const reportService = {
  async getFinancialSummary(dataInicio: string, dataFim: string): Promise<FinancialSummary> {
    const res = await api.get<FinancialSummary>('/admin/reports/financial', {
      params: { dataInicio, dataFim },
    });
    return res.data;
  },

  async getAgendaOverview(): Promise<AgendaOverview> {
    const res = await api.get<AgendaOverview>('/admin/reports/overview');
    return res.data;
  },

  async getDailyAgenda(data: string): Promise<unknown> {
    const res = await api.get('/admin/reports/daily', { params: { data } });
    return res.data;
  },
};
