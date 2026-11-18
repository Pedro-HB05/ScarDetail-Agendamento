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
    Task DeletePlanAsync(Guid id, Guid? adminUserId = null, CancellationToken cancellationToken = default);
    Task ReorderPlansAsync(ReorderServicesDto dto, Guid? adminUserId = null, CancellationToken cancellationToken = default);
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
            .OrderBy(p => p.Ordem)
            .ThenBy(p => p.Nome)
            .ToListAsync(cancellationToken);

        return plans.Select(MapToDto).ToList();
    }

    public async Task<List<ServicePlanDto>> GetAllPlansAsync(CancellationToken cancellationToken = default)
    {
        var plans = await _context.Planos.AsNoTracking()
            .OrderBy(p => p.Ordem)
            .ThenBy(p => p.Nome)
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
        var maxOrdem = await _context.Planos.AnyAsync(cancellationToken)
            ? await _context.Planos.MaxAsync(p => p.Ordem, cancellationToken)
            : 0;
        var ordem = dto.Ordem > 0 ? dto.Ordem : maxOrdem + 1;

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
            Ordem = ordem,
            Ativo = true,
            CriadoEm = DateTime.UtcNow,
            AtualizadoEm = DateTime.UtcNow
        };

        _context.Planos.Add(plan);

        Guid? validAdminId = null;
        if (adminUserId.HasValue && await _context.Usuarios.AnyAsync(u => u.Id == adminUserId.Value, cancellationToken))
        {
            validAdminId = adminUserId.Value;
        }

        _context.AuditoriaPlanos.Add(new PlanAudit
        {
            PlanoId = plan.Id,
            UsuarioId = validAdminId,
            Acao = "INSERT",
            DadosNovos = SerializePlanSnapshot(plan),
            CriadoEm = DateTime.UtcNow
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
        if (dto.Ordem > 0)
        {
            plan.Ordem = dto.Ordem;
        }
        plan.Ativo = dto.Ativo;
        plan.AtualizadoEm = DateTime.UtcNow;

        Guid? validAdminId = null;
        if (adminUserId.HasValue && await _context.Usuarios.AnyAsync(u => u.Id == adminUserId.Value, cancellationToken))
        {
            validAdminId = adminUserId.Value;
        }

        _context.AuditoriaPlanos.Add(new PlanAudit
        {
            PlanoId = plan.Id,
            UsuarioId = validAdminId,
            Acao = "UPDATE",
            DadosAnteriores = dadosAntigos,
            DadosNovos = SerializePlanSnapshot(plan),
            CriadoEm = DateTime.UtcNow
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
        plan.AtualizadoEm = DateTime.UtcNow;

        Guid? validAdminId = null;
        if (adminUserId.HasValue && await _context.Usuarios.AnyAsync(u => u.Id == adminUserId.Value, cancellationToken))
        {
            validAdminId = adminUserId.Value;
        }

        _context.AuditoriaPlanos.Add(new PlanAudit
        {
            PlanoId = plan.Id,
            UsuarioId = validAdminId,
            Acao = active ? "ACTIVATE" : "DEACTIVATE",
            DadosAnteriores = dadosAntigos,
            DadosNovos = SerializePlanSnapshot(plan),
            CriadoEm = DateTime.UtcNow
        });
        await _context.SaveChangesAsync(cancellationToken);
    }

    public async Task DeletePlanAsync(Guid id, Guid? adminUserId = null, CancellationToken cancellationToken = default)
    {
        var plan = await _context.Planos.FirstOrDefaultAsync(p => p.Id == id, cancellationToken);
        if (plan == null)
            throw new NotFoundException("Serviço/Plano não encontrado.");

        var hasAppointments = await _context.Agendamentos.AsNoTracking().AnyAsync(
            a => a.PlanoId == id || a.AdicionalId == id,
            cancellationToken);

        if (hasAppointments)
        {
            throw new ValidationAppException(
                "Não é possível excluir definitivamente este serviço porque existem agendamentos vinculados a ele no histórico. Para que ele não fique mais disponível para novos clientes, desative o serviço.");
        }

        var audits = await _context.AuditoriaPlanos.Where(a => a.PlanoId == id).ToListAsync(cancellationToken);
        if (audits.Count > 0)
        {
            _context.AuditoriaPlanos.RemoveRange(audits);
        }

        _context.Planos.Remove(plan);
        await _context.SaveChangesAsync(cancellationToken);
    }

    public async Task ReorderPlansAsync(ReorderServicesDto dto, Guid? adminUserId = null, CancellationToken cancellationToken = default)
    {
        var allPlans = await _context.Planos.ToListAsync(cancellationToken);
        if (allPlans.Count == 0) return;

        var planDict = allPlans.ToDictionary(p => p.Id);

        if (dto.OrderedIds != null && dto.OrderedIds.Count > 0)
        {
            for (int i = 0; i < dto.OrderedIds.Count; i++)
            {
                var id = dto.OrderedIds[i];
                if (planDict.TryGetValue(id, out var plan))
                {
                    plan.Ordem = i + 1;
                    plan.AtualizadoEm = DateTime.UtcNow;
                }
            }
        }
        else if (dto.Items != null && dto.Items.Count > 0)
        {
            foreach (var item in dto.Items)
            {
                if (planDict.TryGetValue(item.Id, out var plan))
                {
                    plan.Ordem = item.Ordem;
                    plan.AtualizadoEm = DateTime.UtcNow;
                }
            }
        }

        Guid? validAdminId = null;
        if (adminUserId.HasValue && await _context.Usuarios.AnyAsync(u => u.Id == adminUserId.Value, cancellationToken))
        {
            validAdminId = adminUserId.Value;
        }

        _context.AuditoriaPlanos.Add(new PlanAudit
        {
            PlanoId = allPlans[0].Id,
            UsuarioId = validAdminId,
            Acao = "REORDER",
            DadosNovos = JsonSerializer.Serialize(allPlans.OrderBy(p => p.Ordem).Select(p => new { p.Id, p.Nome, p.Ordem })),
            CriadoEm = DateTime.UtcNow
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
            plan.PrecoWagon,
            plan.PrecoSuv,
            plan.PrecoCamionete,
            plan.EhAdicional,
            plan.Ordem,
            plan.Ativo
        };
        return JsonSerializer.Serialize(snapshot);
    }

    private static ServicePlanDto MapToDto(ServicePlan p) =>
        new(p.Id, p.Nome, p.Descricao, p.DuracaoMinutos, p.PrecoHatch, p.PrecoSedan, p.PrecoWagon, p.PrecoSuv, p.PrecoCamionete, p.Ativo, p.EhAdicional, p.Ordem, p.CriadoEm, p.AtualizadoEm);
}
