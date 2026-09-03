using Microsoft.EntityFrameworkCore;
using ScarDetail.API.Application.Common.Utilities;
using ScarDetail.API.Application.DTOs;
using ScarDetail.API.Domain.Enums;
using ScarDetail.API.Infrastructure.Data;

namespace ScarDetail.API.Application.Services;

public interface IReportService
{
    Task<FinancialSummaryDto> ObterResumoFinanceiroAsync(DateTime dataInicio, DateTime dataFim, CancellationToken cancellationToken = default);
    Task<AgendaOverviewDto> ObterVisaoGeralAgendaAsync(CancellationToken cancellationToken = default);
    Task<DailyAgendaSummaryDto> ObterAgendaDoDiaAsync(DateOnly data, CancellationToken cancellationToken = default);
}

public class ReportService : IReportService
{
    private readonly AppDbContext _context;
    private readonly IAppointmentService _appointmentService;

    public ReportService(AppDbContext context, IAppointmentService appointmentService)
    {
        _context = context;
        _appointmentService = appointmentService;
    }

    public async Task<FinancialSummaryDto> ObterResumoFinanceiroAsync(DateTime dataInicio, DateTime dataFim, CancellationToken cancellationToken = default)
    {
        var dataInicioUtc = TimeZoneHelper.NormalizeToUtc(dataInicio);
        var dataFimUtc = TimeZoneHelper.NormalizeToUtc(dataFim);
        if (dataInicioUtc > dataFimUtc)
            throw new ArgumentException("A data inicial deve ser anterior à data final.");

        var pagamentos = await _context.Pagamentos.AsNoTracking()
            .Where(p => p.PagoEm >= dataInicioUtc && p.PagoEm <= dataFimUtc)
            .ToListAsync(cancellationToken);

        var totalFaturado = pagamentos.Sum(p => p.ValorFinal);
        var totalDescontos = pagamentos.Sum(p => p.Desconto);
        var totalAcrescimos = pagamentos.Sum(p => p.Acrescimo);
        var pix = pagamentos.Where(p => p.Metodo == PaymentMethod.PIX).Sum(p => p.ValorFinal);
        var cartao = pagamentos.Where(p => p.Metodo == PaymentMethod.Cartao).Sum(p => p.ValorFinal);
        var dinheiro = pagamentos.Where(p => p.Metodo == PaymentMethod.Dinheiro).Sum(p => p.ValorFinal);
        var qtd = pagamentos.Count;
        var ticketMedio = qtd > 0 ? Math.Round(totalFaturado / qtd, 2) : 0.00m;

        return new FinancialSummaryDto(
            dataInicioUtc,
            dataFimUtc,
            totalFaturado,
            totalDescontos,
            totalAcrescimos,
            pix,
            cartao,
            dinheiro,
            qtd,
            ticketMedio
        );
    }

    public async Task<AgendaOverviewDto> ObterVisaoGeralAgendaAsync(CancellationToken cancellationToken = default)
    {
        var agoraLocal = TimeZoneHelper.NowInSaoPaulo();
        var inicioHojeLocal = agoraLocal.Date;
        var fimHojeLocal = inicioHojeLocal.AddDays(1).AddTicks(-1);

        var inicioHojeUtc = TimeZoneHelper.ConvertToUtcFromSaoPaulo(inicioHojeLocal);
        var fimHojeUtc = TimeZoneHelper.ConvertToUtcFromSaoPaulo(fimHojeLocal);

        var diaSemana = (int)agoraLocal.DayOfWeek;
        var inicioSemanaLocal = agoraLocal.Date.AddDays(-diaSemana);
        var fimSemanaLocal = inicioSemanaLocal.AddDays(7).AddTicks(-1);

        var inicioSemanaUtc = TimeZoneHelper.ConvertToUtcFromSaoPaulo(inicioSemanaLocal);
        var fimSemanaUtc = TimeZoneHelper.ConvertToUtcFromSaoPaulo(fimSemanaLocal);

        var inicioMesLocal = new DateTime(agoraLocal.Year, agoraLocal.Month, 1);
        var fimMesLocal = inicioMesLocal.AddMonths(1).AddTicks(-1);

        var inicioMesUtc = TimeZoneHelper.ConvertToUtcFromSaoPaulo(inicioMesLocal);
        var fimMesUtc = TimeZoneHelper.ConvertToUtcFromSaoPaulo(fimMesLocal);

        var agendamentosHoje = await _context.Agendamentos.AsNoTracking()
            .Where(a => a.Ativo && a.DataHoraInicio >= inicioHojeUtc && a.DataHoraInicio <= fimHojeUtc)
            .ToListAsync(cancellationToken);

        var totalHoje = agendamentosHoje.Count;
        var pendentesHoje = agendamentosHoje.Count(a => a.Status == AppointmentStatus.Pendente);
        var confirmadosHoje = agendamentosHoje.Count(a => a.Status == AppointmentStatus.Confirmado);

        var totalSemana = await _context.Agendamentos.AsNoTracking()
            .CountAsync(a => a.Ativo && a.DataHoraInicio >= inicioSemanaUtc && a.DataHoraInicio <= fimSemanaUtc, cancellationToken);

        var agendamentosMes = await _context.Agendamentos.AsNoTracking()
            .Include(a => a.Pagamento)
            .Where(a => a.Ativo && a.DataHoraInicio >= inicioMesUtc && a.DataHoraInicio <= fimMesUtc)
            .ToListAsync(cancellationToken);

        var totalMes = agendamentosMes.Count;
        var faturamentoMesEstimado = agendamentosMes.Where(a => a.Status != AppointmentStatus.Cancelado).Sum(a => a.ValorCobrado);
        var faturamentoMesRealizado = agendamentosMes.Where(a => a.Pagamento != null).Sum(a => a.Pagamento!.ValorFinal);

        return new AgendaOverviewDto(
            totalHoje,
            pendentesHoje,
            confirmadosHoje,
            totalSemana,
            totalMes,
            faturamentoMesEstimado,
            faturamentoMesRealizado
        );
    }

    public async Task<DailyAgendaSummaryDto> ObterAgendaDoDiaAsync(DateOnly data, CancellationToken cancellationToken = default)
    {
        var inicioLocal = data.ToDateTime(new TimeOnly(0, 0, 0));
        var fimLocal = data.ToDateTime(new TimeOnly(23, 59, 59));

        var inicioUtc = TimeZoneHelper.ConvertToUtcFromSaoPaulo(inicioLocal);
        var fimUtc = TimeZoneHelper.ConvertToUtcFromSaoPaulo(fimLocal);

        var agendamentos = await _appointmentService.GetAdminAppointmentsAsync(
            dataInicio: inicioUtc,
            dataFim: fimUtc,
            cancellationToken: cancellationToken);

        var total = agendamentos.Count;
        var pendentes = agendamentos.Count(a => a.Status == AppointmentStatus.Pendente);
        var confirmados = agendamentos.Count(a => a.Status == AppointmentStatus.Confirmado);
        var emExecucao = agendamentos.Count(a => a.Status is AppointmentStatus.ACaminho or AppointmentStatus.EmExecucao);
        var finalizados = agendamentos.Count(a => a.Status == AppointmentStatus.Finalizado);
        var cancelados = agendamentos.Count(a => a.Status == AppointmentStatus.Cancelado);

        return new DailyAgendaSummaryDto(
            data,
            data.DayOfWeek.ToString(),
            total,
            pendentes,
            confirmados,
            emExecucao,
            finalizados,
            cancelados,
            agendamentos
        );
    }
}
