using Microsoft.EntityFrameworkCore;
using ScarDetail.API.Application.Common.Exceptions;
using ScarDetail.API.Application.Common.Utilities;
using ScarDetail.API.Application.DTOs;
using ScarDetail.API.Domain.Entities;
using ScarDetail.API.Domain.Enums;
using ScarDetail.API.Infrastructure.Data;

namespace ScarDetail.API.Application.Services;

public interface IAgendaBlockService
{
    Task<List<AgendaBlockDto>> GetBlocksAsync(DateTime? dataInicio = null, DateTime? dataFim = null, bool includeInactive = false, CancellationToken cancellationToken = default);
    Task<AgendaBlockDto> GetBlockByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<BlockConflictCheckResponseDto> CheckConflictsAsync(DateTime dataHoraInicio, DateTime dataHoraFim, CancellationToken cancellationToken = default);
    Task<AgendaBlockDto> CreateBlockAsync(Guid adminUserId, CreateAgendaBlockDto dto, CancellationToken cancellationToken = default);
    Task<AgendaBlockDto> CreateWholeDayBlockAsync(Guid adminUserId, CreateWholeDayBlockDto dto, CancellationToken cancellationToken = default);
    Task<AgendaBlockDto> UpdateBlockAsync(Guid id, UpdateAgendaBlockDto dto, CancellationToken cancellationToken = default);
    Task DeleteBlockAsync(Guid id, CancellationToken cancellationToken = default);
}

public class AgendaBlockService : IAgendaBlockService
{
    private readonly AppDbContext _context;

    public AgendaBlockService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<List<AgendaBlockDto>> GetBlocksAsync(DateTime? dataInicio = null, DateTime? dataFim = null, bool includeInactive = false, CancellationToken cancellationToken = default)
    {
        var query = _context.BloqueiosAgenda.AsNoTracking().Include(b => b.CriadoPorUsuario).AsQueryable();

        if (!includeInactive)
        {
            query = query.Where(b => b.Ativo);
        }

        if (dataInicio.HasValue)
        {
            query = query.Where(b => b.DataHoraFim >= dataInicio.Value);
        }

        if (dataFim.HasValue)
        {
            query = query.Where(b => b.DataHoraInicio <= dataFim.Value);
        }

        var blocks = await query.OrderBy(b => b.DataHoraInicio).ToListAsync(cancellationToken);
        return blocks.Select(MapToDto).ToList();
    }

    public async Task<AgendaBlockDto> GetBlockByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var block = await _context.BloqueiosAgenda.AsNoTracking()
            .Include(b => b.CriadoPorUsuario)
            .FirstOrDefaultAsync(b => b.Id == id, cancellationToken);

        if (block == null)
            throw new NotFoundException("Bloqueio não encontrado.");

        return MapToDto(block);
    }

    public async Task<BlockConflictCheckResponseDto> CheckConflictsAsync(DateTime dataHoraInicio, DateTime dataHoraFim, CancellationToken cancellationToken = default)
    {
        dataHoraInicio = TimeZoneHelper.NormalizeToUtc(dataHoraInicio);
        dataHoraFim = TimeZoneHelper.NormalizeToUtc(dataHoraFim);
        if (dataHoraInicio >= dataHoraFim)
            throw new ValidationAppException("A data/hora de início deve ser anterior ao término.");

        var conflitos = await _context.Agendamentos.AsNoTracking()
            .Include(a => a.Cliente)
            .Where(a => a.Ativo &&
                        a.Status != AppointmentStatus.Finalizado &&
                        a.Status != AppointmentStatus.Cancelado &&
                        dataHoraInicio < a.DataHoraFimOcupacao &&
                        dataHoraFim > a.DataHoraInicio)
            .ToListAsync(cancellationToken);

        var list = conflitos.Select(a => new AppointmentSummaryDto(
            a.Id,
            a.Cliente != null ? a.Cliente.Nome : "Cliente",
            a.ServicoNome,
            $"{a.VeiculoMarca} {a.VeiculoModelo}",
            a.DataHoraInicio,
            a.DataHoraFimServico,
            a.Status.ToString()
        )).ToList();

        return new BlockConflictCheckResponseDto(list.Any(), list.Count, list);
    }

    public async Task<AgendaBlockDto> CreateBlockAsync(Guid adminUserId, CreateAgendaBlockDto dto, CancellationToken cancellationToken = default)
    {
        var inicioUtc = TimeZoneHelper.NormalizeToUtc(dto.DataHoraInicio);
        var fimUtc = TimeZoneHelper.NormalizeToUtc(dto.DataHoraFim);
        if (inicioUtc >= fimUtc)
        {
            throw new ValidationAppException("A data/hora de início deve ser anterior ao término.");
        }

        if (inicioUtc < DateTime.UtcNow)
        {
            throw new ValidationAppException("Não é permitido criar bloqueios no passado.");
        }

        // Verificar conflitos se não foi forçado
        if (!dto.ForcarSeConflito)
        {
            var conflictCheck = await CheckConflictsAsync(inicioUtc, fimUtc, cancellationToken);
            if (conflictCheck.HasConflict)
            {
                throw new ConflictException(
                    $"Existem {conflictCheck.TotalConflitos} agendamento(s) existente(s) no intervalo selecionado. Para confirmar a criação sem cancelar os agendamentos, confirme a opção de forçar bloqueio.");
            }
        }

        var block = new AgendaBlock
        {
            DataHoraInicio = inicioUtc,
            DataHoraFim = fimUtc,
            Motivo = dto.Motivo.Trim(),
            CriadoPorUsuarioId = adminUserId,
            Ativo = true
        };

        _context.BloqueiosAgenda.Add(block);
        await _context.SaveChangesAsync(cancellationToken);

        var user = await _context.Usuarios.FindAsync(new object[] { adminUserId }, cancellationToken);
        block.CriadoPorUsuario = user!;

        return MapToDto(block);
    }

    public async Task<AgendaBlockDto> CreateWholeDayBlockAsync(Guid adminUserId, CreateWholeDayBlockDto dto, CancellationToken cancellationToken = default)
    {
        var diaSemanaInt = (int)dto.Data.DayOfWeek;
        var horario = await _context.HorariosFuncionamento.AsNoTracking()
            .FirstOrDefaultAsync(h => h.DiaSemana == diaSemanaInt, cancellationToken);

        var aberturaTime = horario?.HorarioAbertura ?? new TimeOnly(8, 0);
        var fechamentoTime = horario?.HorarioFechamento ?? new TimeOnly(18, 0);

        var inicioLocal = dto.Data.ToDateTime(aberturaTime);
        var fimLocal = dto.Data.ToDateTime(fechamentoTime);

        var inicioUtc = TimeZoneHelper.ConvertToUtcFromSaoPaulo(inicioLocal);
        var fimUtc = TimeZoneHelper.ConvertToUtcFromSaoPaulo(fimLocal);

        return await CreateBlockAsync(adminUserId, new CreateAgendaBlockDto(
            inicioUtc,
            fimUtc,
            dto.Motivo,
            dto.ForcarSeConflito
        ), cancellationToken);
    }

    public async Task<AgendaBlockDto> UpdateBlockAsync(Guid id, UpdateAgendaBlockDto dto, CancellationToken cancellationToken = default)
    {
        var block = await _context.BloqueiosAgenda.Include(b => b.CriadoPorUsuario)
            .FirstOrDefaultAsync(b => b.Id == id, cancellationToken);

        if (block == null)
            throw new NotFoundException("Bloqueio não encontrado.");

        var inicioUtc = TimeZoneHelper.NormalizeToUtc(dto.DataHoraInicio);
        var fimUtc = TimeZoneHelper.NormalizeToUtc(dto.DataHoraFim);
        if (inicioUtc >= fimUtc)
        {
            throw new ValidationAppException("A data/hora de início deve ser anterior ao término.");
        }

        if (dto.Ativo && inicioUtc < DateTime.UtcNow)
            throw new ValidationAppException("Não é permitido ativar um bloqueio no passado.");

        if (dto.Ativo && !dto.ForcarSeConflito)
        {
            var conflictCheck = await CheckConflictsAsync(inicioUtc, fimUtc, cancellationToken);
            if (conflictCheck.HasConflict)
                throw new ConflictException($"Existem {conflictCheck.TotalConflitos} agendamento(s) no novo intervalo. Confirme explicitamente para manter os agendamentos e atualizar o bloqueio.");
        }

        block.DataHoraInicio = inicioUtc;
        block.DataHoraFim = fimUtc;
        block.Motivo = dto.Motivo.Trim();
        block.Ativo = dto.Ativo;

        await _context.SaveChangesAsync(cancellationToken);
        return MapToDto(block);
    }

    public async Task DeleteBlockAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var block = await _context.BloqueiosAgenda.FirstOrDefaultAsync(b => b.Id == id, cancellationToken);
        if (block == null)
            throw new NotFoundException("Bloqueio não encontrado.");

        block.Ativo = false;
        await _context.SaveChangesAsync(cancellationToken);
    }

    private static AgendaBlockDto MapToDto(AgendaBlock b) =>
        new(b.Id, b.DataHoraInicio, b.DataHoraFim, b.Motivo, b.CriadoPorUsuarioId, b.CriadoPorUsuario?.Nome, b.Ativo, b.CriadoEm);
}
