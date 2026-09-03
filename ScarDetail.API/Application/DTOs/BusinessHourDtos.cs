namespace ScarDetail.API.Application.DTOs;

public record BusinessHourDto(
    Guid Id,
    int DiaSemana,
    string NomeDia,
    TimeOnly HorarioAbertura,
    TimeOnly HorarioFechamento,
    bool Ativo,
    DateTime AtualizadoEm
);

public record UpdateBusinessHourDto(
    TimeOnly HorarioAbertura,
    TimeOnly HorarioFechamento,
    bool Ativo
);
