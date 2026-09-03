namespace ScarDetail.API.Application.DTOs;

public record FinancialSummaryDto(
    DateTime DataInicio,
    DateTime DataFim,
    decimal TotalFaturado,
    decimal TotalDescontos,
    decimal TotalAcrescimos,
    decimal FaturamentoPix,
    decimal FaturamentoCartao,
    decimal FaturamentoDinheiro,
    int TotalAtendimentosFinalizados,
    decimal TicketMedio
);

public record DailyAgendaSummaryDto(
    DateOnly Data,
    string DiaSemana,
    int TotalAgendamentos,
    int Pendentes,
    int Confirmados,
    int EmExecucao,
    int Finalizados,
    int Cancelados,
    List<AppointmentDto> Agendamentos
);

public record AgendaOverviewDto(
    int TotalHoje,
    int PendentesHoje,
    int ConfirmadosHoje,
    int TotalSemana,
    int TotalMes,
    decimal FaturamentoMesEstimado,
    decimal FaturamentoMesRealizado
);
