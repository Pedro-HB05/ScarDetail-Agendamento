using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ScarDetail.API.Application.DTOs;
using ScarDetail.API.Application.Services;

namespace ScarDetail.API.Controllers;

[Authorize(Roles = "Admin")]
[Route("api/admin/[controller]")]
public class AgendaBlocksController : BaseApiController
{
    private readonly IAgendaBlockService _blockService;

    public AgendaBlocksController(IAgendaBlockService blockService)
    {
        _blockService = blockService;
    }

    [HttpGet]
    public async Task<ActionResult<List<AgendaBlockDto>>> GetBlocks(
        [FromQuery] DateTime? dataInicio,
        [FromQuery] DateTime? dataFim,
        [FromQuery] bool includeInactive,
        CancellationToken cancellationToken)
    {
        var blocks = await _blockService.GetBlocksAsync(dataInicio, dataFim, includeInactive, cancellationToken);
        return Ok(blocks);
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<AgendaBlockDto>> GetBlockById(Guid id, CancellationToken cancellationToken)
    {
        var block = await _blockService.GetBlockByIdAsync(id, cancellationToken);
        return Ok(block);
    }

    [HttpGet("check-conflicts")]
    public async Task<ActionResult<BlockConflictCheckResponseDto>> CheckConflicts(
        [FromQuery] DateTime dataHoraInicio,
        [FromQuery] DateTime dataHoraFim,
        CancellationToken cancellationToken)
    {
        var result = await _blockService.CheckConflictsAsync(dataHoraInicio, dataHoraFim, cancellationToken);
        return Ok(result);
    }

    [HttpPost]
    public async Task<ActionResult<AgendaBlockDto>> CreateBlock([FromBody] CreateAgendaBlockDto dto, CancellationToken cancellationToken)
    {
        var adminId = GetCurrentUserId();
        var created = await _blockService.CreateBlockAsync(adminId, dto, cancellationToken);
        return CreatedAtAction(nameof(GetBlockById), new { id = created.Id }, created);
    }

    [HttpPost("whole-day")]
    public async Task<ActionResult<AgendaBlockDto>> CreateWholeDayBlock([FromBody] CreateWholeDayBlockDto dto, CancellationToken cancellationToken)
    {
        var adminId = GetCurrentUserId();
        var created = await _blockService.CreateWholeDayBlockAsync(adminId, dto, cancellationToken);
        return CreatedAtAction(nameof(GetBlockById), new { id = created.Id }, created);
    }

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<AgendaBlockDto>> UpdateBlock(Guid id, [FromBody] UpdateAgendaBlockDto dto, CancellationToken cancellationToken)
    {
        var updated = await _blockService.UpdateBlockAsync(id, dto, cancellationToken);
        return Ok(updated);
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> DeleteBlock(Guid id, CancellationToken cancellationToken)
    {
        await _blockService.DeleteBlockAsync(id, cancellationToken);
        return NoContent();
    }
}
