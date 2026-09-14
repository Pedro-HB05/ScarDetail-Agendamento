using System.Text.Json;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ScarDetail.API.Application.Common.Exceptions;
using ScarDetail.API.Application.DTOs;
using ScarDetail.API.Application.Services;

namespace ScarDetail.API.Controllers;

[Route("api/[controller]")]
public class ServicesController : BaseApiController
{
    private readonly IServicePlanService _planService;

    public ServicesController(IServicePlanService planService)
    {
        _planService = planService;
    }

    // Rotas Públicas / Clientes
    [HttpGet]
    public async Task<ActionResult<List<ServicePlanDto>>> GetActiveServices(CancellationToken cancellationToken)
    {
        var services = await _planService.GetActivePlansAsync(cancellationToken);
        return Ok(services);
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<ServicePlanDto>> GetServiceById(Guid id, CancellationToken cancellationToken)
    {
        var service = await _planService.GetPlanByIdAsync(id, cancellationToken);
        return Ok(service);
    }

    // Rotas Administrativas
    [Authorize(Roles = "Admin")]
    [HttpGet("admin/all")]
    public async Task<ActionResult<List<ServicePlanDto>>> GetAllServicesAdmin(CancellationToken cancellationToken)
    {
        var services = await _planService.GetAllPlansAsync(cancellationToken);
        return Ok(services);
    }

    [Authorize(Roles = "Admin")]
    [HttpPost("admin")]
    public async Task<ActionResult<ServicePlanDto>> CreateService([FromBody] CreateServicePlanDto dto, CancellationToken cancellationToken)
    {
        var adminId = GetCurrentUserId();
        var created = await _planService.CreatePlanAsync(dto, adminId, cancellationToken);
        return CreatedAtAction(nameof(GetServiceById), new { id = created.Id }, created);
    }

    [Authorize(Roles = "Admin")]
    [HttpPut("admin/{id:guid}")]
    public async Task<ActionResult<ServicePlanDto>> UpdateService(Guid id, [FromBody] UpdateServicePlanDto dto, CancellationToken cancellationToken)
    {
        var adminId = GetCurrentUserId();
        var updated = await _planService.UpdatePlanAsync(id, dto, adminId, cancellationToken);
        return Ok(updated);
    }

    [Authorize(Roles = "Admin")]
    [HttpPatch("admin/{id:guid}/status")]
    public async Task<IActionResult> ToggleServiceStatus(Guid id, [FromBody] JsonElement body, CancellationToken cancellationToken)
    {
        bool active;
        if (body.ValueKind == JsonValueKind.True)
        {
            active = true;
        }
        else if (body.ValueKind == JsonValueKind.False)
        {
            active = false;
        }
        else if (body.ValueKind == JsonValueKind.Object)
        {
            if (body.TryGetProperty("ativo", out var ativoProp) && (ativoProp.ValueKind == JsonValueKind.True || ativoProp.ValueKind == JsonValueKind.False))
            {
                active = ativoProp.GetBoolean();
            }
            else if (body.TryGetProperty("active", out var activeProp) && (activeProp.ValueKind == JsonValueKind.True || activeProp.ValueKind == JsonValueKind.False))
            {
                active = activeProp.GetBoolean();
            }
            else
            {
                throw new ValidationAppException("O status ativo/inativo deve ser informado.");
            }
        }
        else
        {
            throw new ValidationAppException("Formato de status inválido.");
        }

        var adminId = GetCurrentUserId();
        await _planService.TogglePlanActiveStatusAsync(id, active, adminId, cancellationToken);
        return NoContent();
    }

    [Authorize(Roles = "Admin")]
    [HttpGet("admin/{id:guid}/audits")]
    public async Task<ActionResult<List<PlanAuditDto>>> GetPlanAudits(Guid id, CancellationToken cancellationToken)
    {
        var audits = await _planService.GetPlanAuditHistoryAsync(id, cancellationToken);
        return Ok(audits);
    }
}
