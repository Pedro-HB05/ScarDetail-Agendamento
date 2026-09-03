using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ScarDetail.API.Application.DTOs;
using ScarDetail.API.Application.Services;

namespace ScarDetail.API.Controllers;

[Route("api/[controller]")]
public class WorkingHoursController : BaseApiController
{
    private readonly IBusinessHourService _businessHourService;

    public WorkingHoursController(IBusinessHourService businessHourService)
    {
        _businessHourService = businessHourService;
    }

    [HttpGet]
    public async Task<ActionResult<List<BusinessHourDto>>> GetWorkingHours(CancellationToken cancellationToken)
    {
        var list = await _businessHourService.GetAllHoursAsync(cancellationToken);
        return Ok(list);
    }

    [HttpGet("{dayOfWeek:int}")]
    public async Task<ActionResult<BusinessHourDto>> GetHourByDay(int dayOfWeek, CancellationToken cancellationToken)
    {
        var hour = await _businessHourService.GetHourByDayOfWeekAsync(dayOfWeek, cancellationToken);
        return Ok(hour);
    }

    [Authorize(Roles = "Admin")]
    [HttpPut("admin/{dayOfWeek:int}")]
    public async Task<ActionResult<BusinessHourDto>> UpdateHour(int dayOfWeek, [FromBody] UpdateBusinessHourDto dto, CancellationToken cancellationToken)
    {
        var updated = await _businessHourService.UpdateHourAsync(dayOfWeek, dto, cancellationToken);
        return Ok(updated);
    }
}
