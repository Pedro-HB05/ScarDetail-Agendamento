using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ScarDetail.API.Application.DTOs;
using ScarDetail.API.Application.Services;

namespace ScarDetail.API.Controllers;

[Authorize]
[Route("api/[controller]")]
public class VehiclesController : BaseApiController
{
    private readonly IVehicleService _vehicleService;

    public VehiclesController(IVehicleService vehicleService)
    {
        _vehicleService = vehicleService;
    }

    [HttpGet]
    public async Task<ActionResult<List<VehicleDto>>> GetMyVehicles([FromQuery] bool includeInactive, CancellationToken cancellationToken)
    {
        var userId = GetCurrentUserId();
        var vehicles = await _vehicleService.GetUserVehiclesAsync(userId, includeInactive, cancellationToken);
        return Ok(vehicles);
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<VehicleDto>> GetVehicleById(Guid id, CancellationToken cancellationToken)
    {
        var userId = GetCurrentUserId();
        var vehicle = await _vehicleService.GetVehicleByIdAsync(id, userId, IsAdmin(), cancellationToken);
        return Ok(vehicle);
    }

    [HttpPost]
    public async Task<ActionResult<VehicleDto>> CreateVehicle([FromBody] CreateVehicleDto dto, CancellationToken cancellationToken)
    {
        var userId = GetCurrentUserId();
        var vehicle = await _vehicleService.CreateVehicleAsync(userId, dto, cancellationToken);
        return CreatedAtAction(nameof(GetVehicleById), new { id = vehicle.Id }, vehicle);
    }

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<VehicleDto>> UpdateVehicle(Guid id, [FromBody] UpdateVehicleDto dto, CancellationToken cancellationToken)
    {
        var userId = GetCurrentUserId();
        var vehicle = await _vehicleService.UpdateVehicleAsync(id, userId, dto, IsAdmin(), cancellationToken);
        return Ok(vehicle);
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> DeleteVehicle(Guid id, CancellationToken cancellationToken)
    {
        var userId = GetCurrentUserId();
        await _vehicleService.DeleteVehicleAsync(id, userId, IsAdmin(), cancellationToken);
        return NoContent();
    }
}
