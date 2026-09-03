using ScarDetail.API.Domain.Enums;

namespace ScarDetail.API.Application.DTOs;

public record PaymentDto(
    Guid Id,
    Guid AgendamentoId,
    PaymentMethod Metodo,
    decimal ValorOriginal,
    decimal Desconto,
    decimal Acrescimo,
    string? JustificativaAjuste,
    decimal ValorFinal,
    decimal ValorRecebido,
    decimal Troco,
    string? Observacao,
    Guid RegistradoPorUsuarioId,
    string? RegistradoPorNome,
    DateTime PagoEm
);

public record CreatePaymentDto(
    PaymentMethod Metodo,
    decimal Desconto = 0.00m,
    decimal Acrescimo = 0.00m,
    string? JustificativaAjuste = null,
    decimal ValorRecebido = 0.00m,
    string? Observacao = null
);
