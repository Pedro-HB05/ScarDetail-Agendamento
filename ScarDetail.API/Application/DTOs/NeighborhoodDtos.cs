namespace ScarDetail.API.Application.DTOs;

public record NeighborhoodDto(
    Guid Id,
    string Nome,
    string NomeNormalizado,
    string Cidade,
    string Uf,
    bool Ativo,
    DateTime CriadoEm,
    DateTime AtualizadoEm
);

public record CreateNeighborhoodDto(
    string Nome,
    string Cidade,
    string Uf
);

public record UpdateNeighborhoodDto(
    string Nome,
    string Cidade,
    string Uf,
    bool Ativo
);
