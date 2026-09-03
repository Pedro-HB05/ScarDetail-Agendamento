namespace ScarDetail.API.Application.DTOs;

public record AgendaBlockDto(
    Guid Id,
    DateTime DataHoraInicio,
    DateTime DataHoraFim,
    string Motivo,
    Guid CriadoPorUsuarioId,
    string? CriadoPorNome,
    bool Ativo,
    DateTime CriadoEm
);

public record CreateAgendaBlockDto(
    DateTime DataHoraInicio,
    DateTime DataHoraFim,
    string Motivo,
    bool ForcarSeConflito = false // Se true, cria o bloqueio mesmo que conflite (sem cancelar automaticamente os agendamentos)
);

public record CreateWholeDayBlockDto(
    DateOnly Data,
    string Motivo,
    bool ForcarSeConflito = false
);

public record UpdateAgendaBlockDto(
    DateTime DataHoraInicio,
    DateTime DataHoraFim,
    string Motivo,
    bool Ativo,
    bool ForcarSeConflito = false
);

public record BlockConflictCheckResponseDto(
    bool HasConflict,
    int TotalConflitos,
    List<AppointmentSummaryDto> AgendamentosConflitantes
);

public record AppointmentSummaryDto(
    Guid Id,
    string ClienteNome,
    string ServicoNome,
    string VeiculoModelo,
    DateTime DataHoraInicio,
    DateTime DataHoraFimServico,
    string Status
);
