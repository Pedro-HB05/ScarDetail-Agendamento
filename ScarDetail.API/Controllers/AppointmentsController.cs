using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ScarDetail.API.Application.DTOs;
using ScarDetail.API.Application.Services;
using ScarDetail.API.Domain.Enums;

namespace ScarDetail.API.Controllers;

[Authorize]
[Route("api/[controller]")]
public class AppointmentsController : BaseApiController
{
    private readonly IAppointmentService _appointmentService;
    private readonly ISchedulingEngine _schedulingEngine;

    public AppointmentsController(
        IAppointmentService appointmentService,
        ISchedulingEngine schedulingEngine)
    {
        _appointmentService = appointmentService;
        _schedulingEngine = schedulingEngine;
    }

    [AllowAnonymous]
    [HttpGet("available-slots")]
    public async Task<ActionResult<AvailableSlotsResponseDto>> GetAvailableSlots(
        [FromQuery] Guid planoId,
        [FromQuery] DateOnly data,
        [FromQuery] Guid? adicionalId,
        CancellationToken cancellationToken)
    {
        var slots = await _schedulingEngine.ObterHorariosDisponiveisAsync(planoId, data, adicionalId, cancellationToken);
        return Ok(slots);
    }

    [HttpGet("my")]
    public async Task<ActionResult<List<AppointmentDto>>> GetMyAppointments(
        [FromQuery] AppointmentStatus? status,
        CancellationToken cancellationToken)
    {
        var userId = GetCurrentUserId();
        var appointments = await _appointmentService.GetClientAppointmentsAsync(userId, status, cancellationToken);
        return Ok(appointments);
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<AppointmentDto>> GetAppointmentById(Guid id, CancellationToken cancellationToken)
    {
        var userId = GetCurrentUserId();
        var appointment = await _appointmentService.GetAppointmentByIdAsync(id, userId, IsAdmin(), cancellationToken);
        return Ok(appointment);
    }

    [HttpPost]
    public async Task<ActionResult<AppointmentDto>> CreateAppointment(
        [FromBody] CreateAppointmentDto dto,
        CancellationToken cancellationToken)
    {
        var userId = GetCurrentUserId();
        var created = await _appointmentService.CreateAppointmentAsync(userId, dto, cancellationToken);
        return CreatedAtAction(nameof(GetAppointmentById), new { id = created.Id }, created);
    }

    [HttpPost("{id:guid}/cancel")]
    public async Task<ActionResult<AppointmentDto>> CancelAppointment(
        Guid id,
        [FromBody] CancelAppointmentDto dto,
        CancellationToken cancellationToken)
    {
        var userId = GetCurrentUserId();
        var updated = await _appointmentService.CancelAppointmentAsync(id, userId, IsAdmin(), dto, cancellationToken);
        return Ok(updated);
    }

    [HttpPost("{id:guid}/reschedule")]
    public async Task<ActionResult<AppointmentDto>> RescheduleAppointment(
        Guid id,
        [FromBody] RescheduleAppointmentDto dto,
        CancellationToken cancellationToken)
    {
        var userId = GetCurrentUserId();
        var updated = await _appointmentService.RescheduleAppointmentAsync(id, userId, IsAdmin(), dto, cancellationToken);
        return Ok(updated);
    }

    // Rotas Administrativas
    [Authorize(Roles = "Admin")]
    [HttpGet("admin/all")]
    public async Task<ActionResult<List<AppointmentDto>>> GetAllAdmin(
        [FromQuery] DateTime? dataInicio,
        [FromQuery] DateTime? dataFim,
        [FromQuery] AppointmentStatus? status,
        [FromQuery] Guid? clienteId,
        CancellationToken cancellationToken)
    {
        var list = await _appointmentService.GetAdminAppointmentsAsync(dataInicio, dataFim, status, clienteId, cancellationToken);
        return Ok(list);
    }

    [Authorize(Roles = "Admin")]
    [HttpPatch("admin/{id:guid}/status")]
    public async Task<ActionResult<AppointmentDto>> UpdateStatus(
        Guid id,
        [FromBody] UpdateAppointmentStatusDto dto,
        CancellationToken cancellationToken)
    {
        var adminId = GetCurrentUserId();
        var updated = await _appointmentService.UpdateStatusAsync(id, adminId, true, dto, cancellationToken);
        return Ok(updated);
    }
}
