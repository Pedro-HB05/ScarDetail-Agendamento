using ScarDetail.API.Domain.Enums;

namespace ScarDetail.API.Application.DTOs;

public record ServicePlanDto(
    Guid Id,
    string Nome,
    string? Descricao,
    int DuracaoMinutos,
    decimal PrecoHatch,
    decimal PrecoSedan,
    decimal PrecoSuv,
    decimal PrecoCamionete,
    decimal PrecoWagon,
    bool Ativo,
    bool EhAdicional,
    DateTime CriadoEm,
    DateTime AtualizadoEm
);

public record CreateServicePlanDto(
    string Nome,
    string? Descricao,
    int DuracaoMinutos,
    decimal PrecoHatch,
    decimal PrecoSedan,
    decimal PrecoSuv,
    decimal PrecoCamionete,
    decimal PrecoWagon,
    bool EhAdicional = false
);

public record UpdateServicePlanDto(
    string Nome,
    string? Descricao,
    int DuracaoMinutos,
    decimal PrecoHatch,
    decimal PrecoSedan,
    decimal PrecoSuv,
    decimal PrecoCamionete,
    decimal PrecoWagon,
    bool Ativo,
    bool EhAdicional = false
);

public record PlanAuditDto(
    Guid Id,
    Guid PlanoId,
    Guid? UsuarioId,
    string? UsuarioNome,
    string Acao,
    string? DadosAnteriores,
    string? DadosNovos,
    DateTime CriadoEm
);
