using Microsoft.EntityFrameworkCore;
using ScarDetail.API.Application.Common.Exceptions;
using ScarDetail.API.Application.DTOs;
using ScarDetail.API.Domain.Entities;
using ScarDetail.API.Domain.Enums;
using ScarDetail.API.Infrastructure.Data;

namespace ScarDetail.API.Application.Services;

public interface IPaymentService
{
    Task<PaymentDto> RegistrarPagamentoAsync(Guid agendamentoId, Guid adminUserId, CreatePaymentDto dto, CancellationToken cancellationToken = default);
    Task<PaymentDto> ObterPagamentoPorAgendamentoAsync(Guid agendamentoId, CancellationToken cancellationToken = default);
}

public class PaymentService : IPaymentService
{
    private readonly AppDbContext _context;

    public PaymentService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<PaymentDto> RegistrarPagamentoAsync(Guid agendamentoId, Guid adminUserId, CreatePaymentDto dto, CancellationToken cancellationToken = default)
    {
        var appt = await _context.Agendamentos
            .Include(a => a.Pagamento)
            .FirstOrDefaultAsync(a => a.Id == agendamentoId, cancellationToken);

        if (appt == null)
            throw new NotFoundException("Agendamento não encontrado.");

        if (appt.Pagamento != null)
            throw new ConflictException("Já existe um pagamento registrado para este agendamento.");

        if (appt.Status is not (AppointmentStatus.EmExecucao or AppointmentStatus.Finalizado))
            throw new ValidationAppException("O pagamento só pode ser registrado durante ou após a execução do serviço.");

        if ((dto.Desconto > 0 || dto.Acrescimo > 0) && string.IsNullOrWhiteSpace(dto.JustificativaAjuste))
            throw new ValidationAppException("Informe uma justificativa para desconto ou acréscimo.");

        var valorOriginal = appt.ValorCobrado;
        var valorFinal = valorOriginal - dto.Desconto + dto.Acrescimo;

        if (valorFinal < 0)
        {
            throw new ValidationAppException("O valor final do pagamento não pode ser negativo.");
        }

        var valorRecebido = dto.ValorRecebido > 0 ? dto.ValorRecebido : valorFinal;
        if (valorRecebido < valorFinal)
            throw new ValidationAppException("O valor recebido não pode ser menor que o valor final.");
        var troco = valorRecebido > valorFinal ? valorRecebido - valorFinal : 0.00m;

        var pagamento = new Payment
        {
            AgendamentoId = appt.Id,
            Metodo = dto.Metodo,
            ValorOriginal = valorOriginal,
            Desconto = dto.Desconto,
            Acrescimo = dto.Acrescimo,
            JustificativaAjuste = dto.JustificativaAjuste?.Trim(),
            ValorFinal = valorFinal,
            ValorRecebido = valorRecebido,
            Troco = troco,
            Observacao = dto.Observacao?.Trim(),
            RegistradoPorUsuarioId = adminUserId,
            PagoEm = DateTime.UtcNow
        };

        _context.Pagamentos.Add(pagamento);

        // Se o status ainda não for Finalizado, avança para Finalizado
        if (appt.Status != AppointmentStatus.Finalizado)
        {
            var statusAnterior = appt.Status;
            appt.Status = AppointmentStatus.Finalizado;

            _context.HistoricosStatusAgendamento.Add(new AppointmentStatusHistory
            {
                AgendamentoId = appt.Id,
                StatusAnterior = statusAnterior,
                StatusNovo = AppointmentStatus.Finalizado,
                AlteradoPorUsuarioId = adminUserId,
                Observacao = "Pagamento registrado e serviço finalizado com sucesso."
            });
        }

        await _context.SaveChangesAsync(cancellationToken);

        var adminUser = await _context.Usuarios.FindAsync(new object[] { adminUserId }, cancellationToken);
        pagamento.RegistradoPorUsuario = adminUser!;

        return MapToDto(pagamento);
    }

    public async Task<PaymentDto> ObterPagamentoPorAgendamentoAsync(Guid agendamentoId, CancellationToken cancellationToken = default)
    {
        var pagamento = await _context.Pagamentos.AsNoTracking()
            .Include(p => p.RegistradoPorUsuario)
            .FirstOrDefaultAsync(p => p.AgendamentoId == agendamentoId, cancellationToken);

        if (pagamento == null)
            throw new NotFoundException("Pagamento não encontrado para este agendamento.");

        return MapToDto(pagamento);
    }

    private static PaymentDto MapToDto(Payment p) =>
        new(p.Id, p.AgendamentoId, p.Metodo, p.ValorOriginal, p.Desconto, p.Acrescimo, p.JustificativaAjuste, p.ValorFinal, p.ValorRecebido, p.Troco, p.Observacao, p.RegistradoPorUsuarioId, p.RegistradoPorUsuario?.Nome, p.PagoEm);
}
