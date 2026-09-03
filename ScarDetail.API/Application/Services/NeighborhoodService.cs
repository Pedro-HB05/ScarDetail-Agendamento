using Microsoft.EntityFrameworkCore;
using ScarDetail.API.Application.Common.Exceptions;
using ScarDetail.API.Application.Common.Utilities;
using ScarDetail.API.Application.DTOs;
using ScarDetail.API.Domain.Entities;
using ScarDetail.API.Infrastructure.Data;

namespace ScarDetail.API.Application.Services;

public interface INeighborhoodService
{
    Task<List<NeighborhoodDto>> GetAllNeighborhoodsAsync(bool onlyActive = false, CancellationToken cancellationToken = default);
    Task<NeighborhoodDto> GetNeighborhoodByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<NeighborhoodDto> CreateNeighborhoodAsync(CreateNeighborhoodDto dto, CancellationToken cancellationToken = default);
    Task<NeighborhoodDto> UpdateNeighborhoodAsync(Guid id, UpdateNeighborhoodDto dto, CancellationToken cancellationToken = default);
    Task ToggleNeighborhoodStatusAsync(Guid id, bool active, CancellationToken cancellationToken = default);
    Task DeleteNeighborhoodAsync(Guid id, CancellationToken cancellationToken = default);
}

public class NeighborhoodService : INeighborhoodService
{
    private readonly AppDbContext _context;

    public NeighborhoodService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<List<NeighborhoodDto>> GetAllNeighborhoodsAsync(bool onlyActive = false, CancellationToken cancellationToken = default)
    {
        var query = _context.BairrosPermitidos.AsNoTracking();
        if (onlyActive)
        {
            query = query.Where(b => b.Ativo);
        }

        var list = await query.OrderBy(b => b.Cidade).ThenBy(b => b.Nome).ToListAsync(cancellationToken);
        return list.Select(MapToDto).ToList();
    }

    public async Task<NeighborhoodDto> GetNeighborhoodByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var neighborhood = await _context.BairrosPermitidos.AsNoTracking().FirstOrDefaultAsync(b => b.Id == id, cancellationToken);
        if (neighborhood == null)
            throw new NotFoundException("Bairro não encontrado.");

        return MapToDto(neighborhood);
    }

    public async Task<NeighborhoodDto> CreateNeighborhoodAsync(CreateNeighborhoodDto dto, CancellationToken cancellationToken = default)
    {
        var normalizedNome = StringNormalizer.NormalizeText(dto.Nome);
        var normalizedUf = dto.Uf.Trim().ToUpperInvariant();

        var exists = await _context.BairrosPermitidos.AnyAsync(
            b => b.NomeNormalizado == normalizedNome && b.Uf.ToUpper() == normalizedUf,
            cancellationToken);

        if (exists)
        {
            throw new ConflictException("Este bairro já está cadastrado para este estado (UF).");
        }

        var neighborhood = new PermittedNeighborhood
        {
            Nome = dto.Nome.Trim(),
            NomeNormalizado = normalizedNome,
            Cidade = dto.Cidade.Trim(),
            Uf = normalizedUf,
            Ativo = true
        };

        _context.BairrosPermitidos.Add(neighborhood);
        await _context.SaveChangesAsync(cancellationToken);

        return MapToDto(neighborhood);
    }

    public async Task<NeighborhoodDto> UpdateNeighborhoodAsync(Guid id, UpdateNeighborhoodDto dto, CancellationToken cancellationToken = default)
    {
        var neighborhood = await _context.BairrosPermitidos.FirstOrDefaultAsync(b => b.Id == id, cancellationToken);
        if (neighborhood == null)
            throw new NotFoundException("Bairro não encontrado.");

        var normalizedNome = StringNormalizer.NormalizeText(dto.Nome);
        var normalizedUf = dto.Uf.Trim().ToUpperInvariant();

        var exists = await _context.BairrosPermitidos.AnyAsync(
            b => b.Id != id && b.NomeNormalizado == normalizedNome && b.Uf.ToUpper() == normalizedUf,
            cancellationToken);

        if (exists)
        {
            throw new ConflictException("Já existe outro bairro cadastrado com este nome e UF.");
        }

        neighborhood.Nome = dto.Nome.Trim();
        neighborhood.NomeNormalizado = normalizedNome;
        neighborhood.Cidade = dto.Cidade.Trim();
        neighborhood.Uf = normalizedUf;
        neighborhood.Ativo = dto.Ativo;

        await _context.SaveChangesAsync(cancellationToken);
        return MapToDto(neighborhood);
    }

    public async Task ToggleNeighborhoodStatusAsync(Guid id, bool active, CancellationToken cancellationToken = default)
    {
        var neighborhood = await _context.BairrosPermitidos.FirstOrDefaultAsync(b => b.Id == id, cancellationToken);
        if (neighborhood == null)
            throw new NotFoundException("Bairro não encontrado.");

        neighborhood.Ativo = active;
        await _context.SaveChangesAsync(cancellationToken);
    }

    public async Task DeleteNeighborhoodAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var neighborhood = await _context.BairrosPermitidos.FirstOrDefaultAsync(b => b.Id == id, cancellationToken);
        if (neighborhood == null)
            throw new NotFoundException("Bairro não encontrado.");

        _context.BairrosPermitidos.Remove(neighborhood);
        await _context.SaveChangesAsync(cancellationToken);
    }

    private static NeighborhoodDto MapToDto(PermittedNeighborhood b) =>
        new(b.Id, b.Nome, b.NomeNormalizado, b.Cidade, b.Uf, b.Ativo, b.CriadoEm, b.AtualizadoEm);
}
