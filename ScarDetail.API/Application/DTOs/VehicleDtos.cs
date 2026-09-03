using ScarDetail.API.Domain.Enums;

namespace ScarDetail.API.Application.DTOs;

public record VehicleDto(
    Guid Id,
    Guid UsuarioId,
    VehicleCategory Categoria,
    string CategoriaNomeExibicao,
    string Marca,
    string Modelo,
    int Ano,
    string? Placa,
    string? Cor,
    bool Ativo,
    DateTime CriadoEm
);

public record CreateVehicleDto(
    VehicleCategory Categoria,
    string Marca,
    string Modelo,
    int Ano,
    string? Placa,
    string? Cor
);

public record UpdateVehicleDto(
    VehicleCategory Categoria,
    string Marca,
    string Modelo,
    int Ano,
    string? Placa,
    string? Cor,
    bool Ativo
);

public static class VehicleCategoryExtensions
{
    public static string ToDisplayName(this VehicleCategory category) => category switch
    {
        VehicleCategory.Hatch => "Hatch",
        VehicleCategory.Sedan => "Sedan",
        VehicleCategory.SUV => "SUV",
        VehicleCategory.Camionete => "Camionete",
        VehicleCategory.Wagon => "Wagon (Perua)",
        _ => category.ToString()
    };
}
