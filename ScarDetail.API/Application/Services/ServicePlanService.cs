using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using ScarDetail.API.Application.Common.Exceptions;
using ScarDetail.API.Application.DTOs;
using ScarDetail.API.Domain.Entities;
using ScarDetail.API.Infrastructure.Data;

namespace ScarDetail.API.Application.Services;

public interface IServicePlanService
{
    Task<List<ServicePlanDto>> GetActivePlansAsync(CancellationToken cancellationToken = default);
    Task<List<ServicePlanDto>> GetAllPlansAsync(CancellationToken cancellationToken = default);
    Task<ServicePlanDto> GetPlanByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<ServicePlanDto> CreatePlanAsync(CreateServicePlanDto dto, Guid? adminUserId = null, CancellationToken cancellationToken = default);
    Task<ServicePlanDto> UpdatePlanAsync(Guid id, UpdateServicePlanDto dto, Guid? adminUserId = null, CancellationToken cancellationToken = default);
    Task TogglePlanActiveStatusAsync(Guid id, bool active, Guid? adminUserId = null, CancellationToken cancellationToken = default);
    Task<List<PlanAuditDto>> GetPlanAuditHistoryAsync(Guid planId, CancellationToken cancellationToken = default);
}

public class ServicePlanService : IServicePlanService
{
    private readonly AppDbContext _context;

    public ServicePlanService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<List<ServicePlanDto>> GetActivePlansAsync(CancellationToken cancellationToken = default)
    {
        var plans = await _context.Planos.AsNoTracking()
            .Where(p => p.Ativo)
            .OrderBy(p => p.Nome)
            .ToListAsync(cancellationToken);

        return plans.Select(MapToDto).ToList();
    }

    public async Task<List<ServicePlanDto>> GetAllPlansAsync(CancellationToken cancellationToken = default)
    {
        var plans = await _context.Planos.AsNoTracking()
            .OrderBy(p => p.Nome)
            .ToListAsync(cancellationToken);

        return plans.Select(MapToDto).ToList();
    }

    public async Task<ServicePlanDto> GetPlanByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var plan = await _context.Planos.AsNoTracking().FirstOrDefaultAsync(p => p.Id == id, cancellationToken);
        if (plan == null)
            throw new NotFoundException("Serviço/Plano não encontrado.");

        return MapToDto(plan);
    }

    public async Task<ServicePlanDto> CreatePlanAsync(CreateServicePlanDto dto, Guid? adminUserId = null, CancellationToken cancellationToken = default)
    {
        var plan = new ServicePlan
        {
            Nome = dto.Nome.Trim(),
            Descricao = dto.Descricao?.Trim(),
            DuracaoMinutos = dto.DuracaoMinutos,
            PrecoHatch = dto.PrecoHatch,
            PrecoSedan = dto.PrecoSedan,
            PrecoSuv = dto.PrecoSuv,
            PrecoCamionete = dto.PrecoCamionete,
            PrecoWagon = dto.PrecoWagon,
            EhAdicional = dto.EhAdicional,
            Ativo = true
        };

        _context.Planos.Add(plan);
        _context.AuditoriaPlanos.Add(new PlanAudit
        {
            PlanoId = plan.Id,
            UsuarioId = adminUserId,
            Acao = "INSERT",
            DadosNovos = SerializePlanSnapshot(plan)
        });
        await _context.SaveChangesAsync(cancellationToken);

        return MapToDto(plan);
    }

    public async Task<ServicePlanDto> UpdatePlanAsync(Guid id, UpdateServicePlanDto dto, Guid? adminUserId = null, CancellationToken cancellationToken = default)
    {
        var plan = await _context.Planos.FirstOrDefaultAsync(p => p.Id == id, cancellationToken);
        if (plan == null)
            throw new NotFoundException("Serviço/Plano não encontrado.");

        var dadosAntigos = SerializePlanSnapshot(plan);

        plan.Nome = dto.Nome.Trim();
        plan.Descricao = dto.Descricao?.Trim();
        plan.DuracaoMinutos = dto.DuracaoMinutos;
        plan.PrecoHatch = dto.PrecoHatch;
        plan.PrecoSedan = dto.PrecoSedan;
        plan.PrecoSuv = dto.PrecoSuv;
        plan.PrecoCamionete = dto.PrecoCamionete;
        plan.PrecoWagon = dto.PrecoWagon;
        plan.EhAdicional = dto.EhAdicional;
        plan.Ativo = dto.Ativo;

        _context.AuditoriaPlanos.Add(new PlanAudit
        {
            PlanoId = plan.Id,
            UsuarioId = adminUserId,
            Acao = "UPDATE",
            DadosAnteriores = dadosAntigos,
            DadosNovos = SerializePlanSnapshot(plan)
        });
        await _context.SaveChangesAsync(cancellationToken);

        return MapToDto(plan);
    }

    public async Task TogglePlanActiveStatusAsync(Guid id, bool active, Guid? adminUserId = null, CancellationToken cancellationToken = default)
    {
        var plan = await _context.Planos.FirstOrDefaultAsync(p => p.Id == id, cancellationToken);
        if (plan == null)
            throw new NotFoundException("Serviço/Plano não encontrado.");

        var dadosAntigos = SerializePlanSnapshot(plan);
        plan.Ativo = active;
        _context.AuditoriaPlanos.Add(new PlanAudit
        {
            PlanoId = plan.Id,
            UsuarioId = adminUserId,
            Acao = active ? "ACTIVATE" : "DEACTIVATE",
            DadosAnteriores = dadosAntigos,
            DadosNovos = SerializePlanSnapshot(plan)
        });
        await _context.SaveChangesAsync(cancellationToken);
    }

    public async Task<List<PlanAuditDto>> GetPlanAuditHistoryAsync(Guid planId, CancellationToken cancellationToken = default)
    {
        var audits = await _context.AuditoriaPlanos.AsNoTracking()
            .Include(a => a.Usuario)
            .Where(a => a.PlanoId == planId)
            .OrderByDescending(a => a.CriadoEm)
            .ToListAsync(cancellationToken);

        return audits.Select(a => new PlanAuditDto(
            a.Id,
            a.PlanoId,
            a.UsuarioId,
            a.Usuario?.Nome,
            a.Acao,
            a.DadosAnteriores,
            a.DadosNovos,
            a.CriadoEm
        )).ToList();
    }

    private static string SerializePlanSnapshot(ServicePlan plan)
    {
        var snapshot = new
        {
            plan.Id,
            plan.Nome,
            plan.Descricao,
            plan.DuracaoMinutos,
            plan.PrecoHatch,
            plan.PrecoSedan,
            plan.PrecoSuv,
            plan.PrecoCamionete,
            plan.PrecoWagon,
            plan.Ativo
        };
        return JsonSerializer.Serialize(snapshot);
    }

    private static ServicePlanDto MapToDto(ServicePlan p) =>
        new(p.Id, p.Nome, p.Descricao, p.DuracaoMinutos, p.PrecoHatch, p.PrecoSedan, p.PrecoSuv, p.PrecoCamionete, p.PrecoWagon, p.Ativo, p.EhAdicional, p.CriadoEm, p.AtualizadoEm);
}
