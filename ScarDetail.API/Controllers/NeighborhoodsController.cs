using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ScarDetail.API.Application.DTOs;
using ScarDetail.API.Application.Services;

namespace ScarDetail.API.Controllers;

[Authorize(Roles = "Admin")]
[Route("api/admin/[controller]")]
public class NeighborhoodsController : BaseApiController
{
    private readonly INeighborhoodService _neighborhoodService;

    public NeighborhoodsController(INeighborhoodService neighborhoodService)
    {
        _neighborhoodService = neighborhoodService;
    }

    [HttpGet]
    public async Task<ActionResult<List<NeighborhoodDto>>> GetAllNeighborhoods([FromQuery] bool onlyActive, CancellationToken cancellationToken)
    {
        var list = await _neighborhoodService.GetAllNeighborhoodsAsync(onlyActive, cancellationToken);
        return Ok(list);
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<NeighborhoodDto>> GetNeighborhoodById(Guid id, CancellationToken cancellationToken)
    {
        var item = await _neighborhoodService.GetNeighborhoodByIdAsync(id, cancellationToken);
        return Ok(item);
    }

    [HttpPost]
    public async Task<ActionResult<NeighborhoodDto>> CreateNeighborhood([FromBody] CreateNeighborhoodDto dto, CancellationToken cancellationToken)
    {
        var created = await _neighborhoodService.CreateNeighborhoodAsync(dto, cancellationToken);
        return CreatedAtAction(nameof(GetNeighborhoodById), new { id = created.Id }, created);
    }

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<NeighborhoodDto>> UpdateNeighborhood(Guid id, [FromBody] UpdateNeighborhoodDto dto, CancellationToken cancellationToken)
    {
        var updated = await _neighborhoodService.UpdateNeighborhoodAsync(id, dto, cancellationToken);
        return Ok(updated);
    }

    [HttpPatch("{id:guid}/status")]
    public async Task<IActionResult> ToggleStatus(Guid id, [FromBody] bool active, CancellationToken cancellationToken)
    {
        await _neighborhoodService.ToggleNeighborhoodStatusAsync(id, active, cancellationToken);
        return NoContent();
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> DeleteNeighborhood(Guid id, CancellationToken cancellationToken)
    {
        await _neighborhoodService.DeleteNeighborhoodAsync(id, cancellationToken);
        return NoContent();
    }
}
