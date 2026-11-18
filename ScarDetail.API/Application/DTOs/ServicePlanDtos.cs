using ScarDetail.API.Domain.Enums;

namespace ScarDetail.API.Application.DTOs;

public record ServicePlanDto(
    Guid Id,
    string Nome,
    string? Descricao,
    int DuracaoMinutos,
    decimal PrecoHatch,
    decimal PrecoSedan,
    decimal PrecoWagon,
    decimal PrecoSuv,
    decimal PrecoCamionete,
    bool Ativo,
    bool EhAdicional,
    int Ordem,
    DateTime CriadoEm,
    DateTime AtualizadoEm
);

public record CreateServicePlanDto(
    string Nome,
    string? Descricao,
    int DuracaoMinutos,
    decimal PrecoHatch,
    decimal PrecoSedan,
    decimal PrecoWagon,
    decimal PrecoSuv,
    decimal PrecoCamionete,
    bool EhAdicional = false,
    int Ordem = 0
);

public record UpdateServicePlanDto(
    string Nome,
    string? Descricao,
    int DuracaoMinutos,
    decimal PrecoHatch,
    decimal PrecoSedan,
    decimal PrecoWagon,
    decimal PrecoSuv,
    decimal PrecoCamionete,
    bool Ativo,
    bool EhAdicional = false,
    int Ordem = 0
);

public record ReorderServicesDto(
    List<Guid>? OrderedIds = null,
    List<ServiceOrderItemDto>? Items = null
);

public record ServiceOrderItemDto(
    Guid Id,
    int Ordem
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
