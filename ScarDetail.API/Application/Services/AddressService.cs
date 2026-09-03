using Microsoft.EntityFrameworkCore;
using ScarDetail.API.Application.Common.Exceptions;
using ScarDetail.API.Application.Common.Utilities;
using ScarDetail.API.Application.DTOs;
using ScarDetail.API.Domain.Entities;
using ScarDetail.API.Infrastructure.Data;
using ScarDetail.API.Infrastructure.ExternalServices;

namespace ScarDetail.API.Application.Services;

public interface IAddressService
{
    Task<CheckCepResponseDto> ConsultarEValidarCepAsync(string cep, CancellationToken cancellationToken = default);
    Task<List<AddressDto>> GetUserAddressesAsync(Guid userId, bool includeInactive = false, CancellationToken cancellationToken = default);
    Task<AddressDto> GetAddressByIdAsync(Guid addressId, Guid userId, bool isAdmin = false, CancellationToken cancellationToken = default);
    Task<AddressDto> CreateAddressAsync(Guid userId, CreateAddressDto dto, CancellationToken cancellationToken = default);
    Task<AddressDto> UpdateAddressAsync(Guid addressId, Guid userId, UpdateAddressDto dto, bool isAdmin = false, CancellationToken cancellationToken = default);
    Task DeleteAddressAsync(Guid addressId, Guid userId, bool isAdmin = false, CancellationToken cancellationToken = default);
    Task ValidarBairroAtendidoAsync(string bairro, string cidade, string uf, CancellationToken cancellationToken = default);
}

public class AddressService : IAddressService
{
    private readonly AppDbContext _context;
    private readonly IViaCepService _viaCepService;

    public AddressService(AppDbContext context, IViaCepService viaCepService)
    {
        _context = context;
        _viaCepService = viaCepService;
    }

    public async Task<CheckCepResponseDto> ConsultarEValidarCepAsync(string cep, CancellationToken cancellationToken = default)
    {
        var viaCepResult = await _viaCepService.ConsultarCepAsync(cep, cancellationToken);
        var normalizedBairro = viaCepResult.BairroNormalizado;
        var normalizedUf = viaCepResult.Uf.Trim().ToUpperInvariant();

        // Verificar se o bairro está cadastrado e ativo
        var candidatos = await _context.BairrosPermitidos.AsNoTracking()
            .Where(b => b.Ativo &&
                        b.NomeNormalizado == normalizedBairro &&
                        b.Uf.ToUpper() == normalizedUf)
            .ToListAsync(cancellationToken);
        var bairroAtendido = candidatos.Any(b =>
            StringNormalizer.NormalizeText(b.Cidade) == StringNormalizer.NormalizeText(viaCepResult.Cidade));

        return new CheckCepResponseDto(
            viaCepResult.Cep,
            viaCepResult.Logradouro,
            viaCepResult.Complemento,
            viaCepResult.Bairro,
            viaCepResult.Cidade,
            viaCepResult.Uf,
            bairroAtendido,
            bairroAtendido ? "Região atendida!" : "Desculpe, nossa estética automotiva ainda não atende este bairro."
        );
    }

    public async Task<List<AddressDto>> GetUserAddressesAsync(Guid userId, bool includeInactive = false, CancellationToken cancellationToken = default)
    {
        var query = _context.Enderecos.AsNoTracking().Where(a => a.UsuarioId == userId);
        if (!includeInactive)
        {
            query = query.Where(a => a.Ativo);
        }

        var addresses = await query.OrderByDescending(a => a.CriadoEm).ToListAsync(cancellationToken);
        return addresses.Select(MapToDto).ToList();
    }

    public async Task<AddressDto> GetAddressByIdAsync(Guid addressId, Guid userId, bool isAdmin = false, CancellationToken cancellationToken = default)
    {
        var address = await _context.Enderecos.AsNoTracking().FirstOrDefaultAsync(a => a.Id == addressId, cancellationToken);
        if (address == null)
            throw new NotFoundException("Endereço não encontrado.");

        if (!isAdmin && address.UsuarioId != userId)
            throw new ForbiddenAppException("Você não tem permissão para acessar este endereço.");

        return MapToDto(address);
    }

    public async Task<AddressDto> CreateAddressAsync(Guid userId, CreateAddressDto dto, CancellationToken cancellationToken = default)
    {
        await ValidarBairroAtendidoAsync(dto.Bairro, dto.Cidade, dto.Uf, cancellationToken);

        var address = new Address
        {
            UsuarioId = userId,
            Apelido = dto.Apelido.Trim(),
            Cep = StringNormalizer.CleanCep(dto.Cep),
            Logradouro = dto.Logradouro.Trim(),
            Numero = dto.Numero.Trim(),
            Complemento = dto.Complemento?.Trim(),
            Bairro = dto.Bairro.Trim(),
            Cidade = dto.Cidade.Trim(),
            Uf = dto.Uf.Trim().ToUpperInvariant(),
            PontoReferencia = dto.PontoReferencia?.Trim(),
            Ativo = true
        };

        _context.Enderecos.Add(address);
        await _context.SaveChangesAsync(cancellationToken);

        return MapToDto(address);
    }

    public async Task<AddressDto> UpdateAddressAsync(Guid addressId, Guid userId, UpdateAddressDto dto, bool isAdmin = false, CancellationToken cancellationToken = default)
    {
        var address = await _context.Enderecos.FirstOrDefaultAsync(a => a.Id == addressId, cancellationToken);
        if (address == null)
            throw new NotFoundException("Endereço não encontrado.");

        if (!isAdmin && address.UsuarioId != userId)
            throw new ForbiddenAppException("Você não tem permissão para modificar este endereço.");

        await ValidarBairroAtendidoAsync(dto.Bairro, dto.Cidade, dto.Uf, cancellationToken);

        address.Apelido = dto.Apelido.Trim();
        address.Cep = StringNormalizer.CleanCep(dto.Cep);
        address.Logradouro = dto.Logradouro.Trim();
        address.Numero = dto.Numero.Trim();
        address.Complemento = dto.Complemento?.Trim();
        address.Bairro = dto.Bairro.Trim();
        address.Cidade = dto.Cidade.Trim();
        address.Uf = dto.Uf.Trim().ToUpperInvariant();
        address.PontoReferencia = dto.PontoReferencia?.Trim();
        address.Ativo = dto.Ativo;

        await _context.SaveChangesAsync(cancellationToken);
        return MapToDto(address);
    }

    public async Task DeleteAddressAsync(Guid addressId, Guid userId, bool isAdmin = false, CancellationToken cancellationToken = default)
    {
        var address = await _context.Enderecos.Include(a => a.Agendamentos).FirstOrDefaultAsync(a => a.Id == addressId, cancellationToken);
        if (address == null)
            throw new NotFoundException("Endereço não encontrado.");

        if (!isAdmin && address.UsuarioId != userId)
            throw new ForbiddenAppException("Você não tem permissão para excluir este endereço.");

        if (address.Agendamentos.Any())
        {
            address.Ativo = false;
        }
        else
        {
            _context.Enderecos.Remove(address);
        }

        await _context.SaveChangesAsync(cancellationToken);
    }

    public async Task ValidarBairroAtendidoAsync(string bairro, string cidade, string uf, CancellationToken cancellationToken = default)
    {
        var normalizedBairro = StringNormalizer.NormalizeText(bairro);
        var normalizedCidade = StringNormalizer.NormalizeText(cidade);
        var normalizedUf = uf.Trim().ToUpperInvariant();

        var candidatos = await _context.BairrosPermitidos.AsNoTracking()
            .Where(b => b.Ativo && b.NomeNormalizado == normalizedBairro && b.Uf.ToUpper() == normalizedUf)
            .ToListAsync(cancellationToken);
        var atendido = candidatos.Any(b => StringNormalizer.NormalizeText(b.Cidade) == normalizedCidade);

        if (!atendido)
        {
            throw new ValidationAppException($"O bairro '{bairro}', em {cidade}/{uf}, não está na lista de regiões atendidas.");
        }
    }

    private static AddressDto MapToDto(Address a) =>
        new(a.Id, a.UsuarioId, a.Apelido, a.Cep, a.Logradouro, a.Numero, a.Complemento, a.Bairro, a.Cidade, a.Uf, a.PontoReferencia, a.Ativo, a.CriadoEm);
}
