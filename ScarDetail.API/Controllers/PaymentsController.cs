using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ScarDetail.API.Application.DTOs;
using ScarDetail.API.Application.Services;

namespace ScarDetail.API.Controllers;

[Authorize(Roles = "Admin")]
[Route("api/admin/[controller]")]
public class PaymentsController : BaseApiController
{
    private readonly IPaymentService _paymentService;

    public PaymentsController(IPaymentService paymentService)
    {
        _paymentService = paymentService;
    }

    [HttpPost("{agendamentoId:guid}")]
    public async Task<ActionResult<PaymentDto>> RegistrarPagamento(
        Guid agendamentoId,
        [FromBody] CreatePaymentDto dto,
        CancellationToken cancellationToken)
    {
        var adminId = GetCurrentUserId();
        var payment = await _paymentService.RegistrarPagamentoAsync(agendamentoId, adminId, dto, cancellationToken);
        return Ok(payment);
    }

    [HttpGet("{agendamentoId:guid}")]
    public async Task<ActionResult<PaymentDto>> ObterPagamento(
        Guid agendamentoId,
        CancellationToken cancellationToken)
    {
        var payment = await _paymentService.ObterPagamentoPorAgendamentoAsync(agendamentoId, cancellationToken);
        return Ok(payment);
    }
}
