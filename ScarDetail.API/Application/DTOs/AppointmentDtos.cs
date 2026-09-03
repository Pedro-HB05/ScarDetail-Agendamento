using ScarDetail.API.Domain.Enums;

namespace ScarDetail.API.Application.DTOs;

public record AppointmentDto(
    Guid Id,
    Guid ClienteId,
    string ClienteNome,
    string ClienteEmail,
    string ClienteTelefone,
    Guid VeiculoId,
    VehicleCategory VeiculoCategoria,
    string VeiculoCategoriaExibicao,
    string VeiculoMarca,
    string VeiculoModelo,
    string? VeiculoPlaca,
    Guid EnderecoId,
    string EnderecoCompleto,
    Guid PlanoId,
    string ServicoNome,
    decimal ValorCobrado,
    int DuracaoMinutos,
    int BufferDeslocamentoMinutos,
    DateTime DataHoraInicio,
    DateTime DataHoraFimServico,
    DateTime DataHoraFimOcupacao,
    AppointmentStatus Status,
    string? Observacoes,
    string? MotivoCancelamento,
    DateTime? CanceladoEm,
    bool Ativo,
    DateTime CriadoEm,
    PaymentDto? Pagamento,
    List<AppointmentStatusHistoryDto> HistoricoStatus
);

public record AppointmentStatusHistoryDto(
    Guid Id,
    AppointmentStatus? StatusAnterior,
    AppointmentStatus StatusNovo,
    Guid? AlteradoPorUsuarioId,
    string? AlteradoPorNome,
    string? Observacao,
    DateTime CriadoEm
);

public record CreateAppointmentDto(
    Guid VeiculoId,
    Guid EnderecoId,
    Guid PlanoId,
    DateTime DataHoraInicio,
    string? Observacoes
);

public record RescheduleAppointmentDto(
    DateTime NovaDataHoraInicio,
    string? Motivo
);

public record CancelAppointmentDto(
    string Motivo
);

public record UpdateAppointmentStatusDto(
    AppointmentStatus NovoStatus,
    string? Observacao
);

public record AvailableSlotsQueryDto(
    Guid PlanoId,
    DateOnly Data
);

public record TimeSlotDto(
    DateTime DataHoraInicio,
    DateTime DataHoraFimServico,
    DateTime DataHoraFimOcupacao,
    string HorarioInicioFormatado,
    string HorarioFimFormatado,
    bool Disponivel,
    string? MotivoIndisponibilidade
);

public record AvailableSlotsResponseDto(
    DateOnly Data,
    string DiaSemana,
    int DuracaoServicoMinutos,
    int BufferMinutos,
    List<TimeSlotDto> Slots
);
