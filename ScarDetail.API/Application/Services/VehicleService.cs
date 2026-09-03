using Microsoft.EntityFrameworkCore;
using ScarDetail.API.Application.Common.Exceptions;
using ScarDetail.API.Application.DTOs;
using ScarDetail.API.Domain.Entities;
using ScarDetail.API.Infrastructure.Data;

namespace ScarDetail.API.Application.Services;

public interface IVehicleService
{
    Task<List<VehicleDto>> GetUserVehiclesAsync(Guid userId, bool includeInactive = false, CancellationToken cancellationToken = default);
    Task<VehicleDto> GetVehicleByIdAsync(Guid vehicleId, Guid userId, bool isAdmin = false, CancellationToken cancellationToken = default);
    Task<VehicleDto> CreateVehicleAsync(Guid userId, CreateVehicleDto dto, CancellationToken cancellationToken = default);
    Task<VehicleDto> UpdateVehicleAsync(Guid vehicleId, Guid userId, UpdateVehicleDto dto, bool isAdmin = false, CancellationToken cancellationToken = default);
    Task DeleteVehicleAsync(Guid vehicleId, Guid userId, bool isAdmin = false, CancellationToken cancellationToken = default);
}

public class VehicleService : IVehicleService
{
    private readonly AppDbContext _context;

    public VehicleService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<List<VehicleDto>> GetUserVehiclesAsync(Guid userId, bool includeInactive = false, CancellationToken cancellationToken = default)
    {
        var query = _context.Veiculos.AsNoTracking().Where(v => v.UsuarioId == userId);
        if (!includeInactive)
        {
            query = query.Where(v => v.Ativo);
        }

        var vehicles = await query.OrderByDescending(v => v.CriadoEm).ToListAsync(cancellationToken);
        return vehicles.Select(MapToDto).ToList();
    }

    public async Task<VehicleDto> GetVehicleByIdAsync(Guid vehicleId, Guid userId, bool isAdmin = false, CancellationToken cancellationToken = default)
    {
        var vehicle = await _context.Veiculos.AsNoTracking().FirstOrDefaultAsync(v => v.Id == vehicleId, cancellationToken);
        if (vehicle == null)
            throw new NotFoundException("Veículo não encontrado.");

        if (!isAdmin && vehicle.UsuarioId != userId)
            throw new ForbiddenAppException("Você não tem permissão para acessar este veículo.");

        return MapToDto(vehicle);
    }

    public async Task<VehicleDto> CreateVehicleAsync(Guid userId, CreateVehicleDto dto, CancellationToken cancellationToken = default)
    {
        var vehicle = new Vehicle
        {
            UsuarioId = userId,
            Categoria = dto.Categoria,
            Marca = dto.Marca.Trim(),
            Modelo = dto.Modelo.Trim(),
            Ano = dto.Ano,
            Placa = dto.Placa?.Trim().ToUpperInvariant(),
            Cor = dto.Cor?.Trim(),
            Ativo = true
        };

        _context.Veiculos.Add(vehicle);
        await _context.SaveChangesAsync(cancellationToken);

        return MapToDto(vehicle);
    }

    public async Task<VehicleDto> UpdateVehicleAsync(Guid vehicleId, Guid userId, UpdateVehicleDto dto, bool isAdmin = false, CancellationToken cancellationToken = default)
    {
        var vehicle = await _context.Veiculos.FirstOrDefaultAsync(v => v.Id == vehicleId, cancellationToken);
        if (vehicle == null)
            throw new NotFoundException("Veículo não encontrado.");

        if (!isAdmin && vehicle.UsuarioId != userId)
            throw new ForbiddenAppException("Você não tem permissão para modificar este veículo.");

        vehicle.Categoria = dto.Categoria;
        vehicle.Marca = dto.Marca.Trim();
        vehicle.Modelo = dto.Modelo.Trim();
        vehicle.Ano = dto.Ano;
        vehicle.Placa = dto.Placa?.Trim().ToUpperInvariant();
        vehicle.Cor = dto.Cor?.Trim();
        vehicle.Ativo = dto.Ativo;

        await _context.SaveChangesAsync(cancellationToken);
        return MapToDto(vehicle);
    }

    public async Task DeleteVehicleAsync(Guid vehicleId, Guid userId, bool isAdmin = false, CancellationToken cancellationToken = default)
    {
        var vehicle = await _context.Veiculos.Include(v => v.Agendamentos).FirstOrDefaultAsync(v => v.Id == vehicleId, cancellationToken);
        if (vehicle == null)
            throw new NotFoundException("Veículo não encontrado.");

        if (!isAdmin && vehicle.UsuarioId != userId)
            throw new ForbiddenAppException("Você não tem permissão para excluir este veículo.");

        // Se o veículo possui agendamentos, realiza desativação lógica (soft delete)
        if (vehicle.Agendamentos.Any())
        {
            vehicle.Ativo = false;
        }
        else
        {
            _context.Veiculos.Remove(vehicle);
        }

        await _context.SaveChangesAsync(cancellationToken);
    }

    private static VehicleDto MapToDto(Vehicle v) =>
        new(v.Id, v.UsuarioId, v.Categoria, v.Categoria.ToDisplayName(), v.Marca, v.Modelo, v.Ano, v.Placa, v.Cor, v.Ativo, v.CriadoEm);
}
