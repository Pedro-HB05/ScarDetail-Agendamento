using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ScarDetail.API.Application.DTOs;
using ScarDetail.API.Application.Services;

namespace ScarDetail.API.Controllers;

[Authorize(Roles = "Admin")]
[Route("api/admin/[controller]")]
public class ReportsController : BaseApiController
{
    private readonly IReportService _reportService;

    public ReportsController(IReportService reportService)
    {
        _reportService = reportService;
    }

    [HttpGet("financial")]
    public async Task<ActionResult<FinancialSummaryDto>> GetFinancialSummary(
        [FromQuery] DateTime dataInicio,
        [FromQuery] DateTime dataFim,
        CancellationToken cancellationToken)
    {
        var summary = await _reportService.ObterResumoFinanceiroAsync(dataInicio, dataFim, cancellationToken);
        return Ok(summary);
    }

    [HttpGet("overview")]
    public async Task<ActionResult<AgendaOverviewDto>> GetAgendaOverview(CancellationToken cancellationToken)
    {
        var overview = await _reportService.ObterVisaoGeralAgendaAsync(cancellationToken);
        return Ok(overview);
    }

    [HttpGet("daily")]
    public async Task<ActionResult<DailyAgendaSummaryDto>> GetDailyAgenda(
        [FromQuery] DateOnly data,
        CancellationToken cancellationToken)
    {
        var daily = await _reportService.ObterAgendaDoDiaAsync(data, cancellationToken);
        return Ok(daily);
    }
}
