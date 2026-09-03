using Microsoft.EntityFrameworkCore;
using ScarDetail.API.Application.Common.Exceptions;
using ScarDetail.API.Application.Common.Utilities;
using ScarDetail.API.Application.DTOs;
using ScarDetail.API.Domain.Enums;
using ScarDetail.API.Infrastructure.Data;

namespace ScarDetail.API.Application.Services;

public interface ISchedulingEngine
{
    Task<AvailableSlotsResponseDto> ObterHorariosDisponiveisAsync(
        Guid planoId,
        DateOnly data,
        CancellationToken cancellationToken = default);

    Task ValidarDisponibilidadeHorarioAsync(
        DateTime dataHoraInicio,
        int duracaoMinutos,
        int bufferMinutos,
        Guid? agendamentoIdIgnorar = null,
        CancellationToken cancellationToken = default);
}

public class SchedulingEngine : ISchedulingEngine
{
    private readonly AppDbContext _context;
    private const int BufferDeslocamentoMinutosPadrao = 30;
    private const int IntervaloGradeMinutos = 15;

    public SchedulingEngine(AppDbContext context)
    {
        _context = context;
    }

    public async Task<AvailableSlotsResponseDto> ObterHorariosDisponiveisAsync(
        Guid planoId,
        DateOnly data,
        CancellationToken cancellationToken = default)
    {
        var plano = await _context.Planos.AsNoTracking()
            .FirstOrDefaultAsync(p => p.Id == planoId, cancellationToken);

        if (plano == null)
            throw new NotFoundException("Serviço/Plano não encontrado.");

        if (!plano.Ativo)
            throw new ValidationAppException("Não é possível consultar horários para um serviço inativo.");

        // 1. Obter dia da semana (0 = Domingo .. 6 = Sábado)
        var diaSemanaInt = (int)data.DayOfWeek;
        var horarioFuncionamento = await _context.HorariosFuncionamento.AsNoTracking()
            .FirstOrDefaultAsync(h => h.DiaSemana == diaSemanaInt, cancellationToken);

        if (horarioFuncionamento == null || !horarioFuncionamento.Ativo)
        {
            return new AvailableSlotsResponseDto(
                data,
                horarioFuncionamento?.NomeDia ?? data.DayOfWeek.ToString(),
                plano.DuracaoMinutos,
                BufferDeslocamentoMinutosPadrao,
                new List<TimeSlotDto>()
            );
        }

        // 2. Definir janelas do dia no fuso America/Sao_Paulo convertidas para UTC
        var dataHoraAberturaLocal = data.ToDateTime(horarioFuncionamento.HorarioAbertura);
        var dataHoraFechamentoLocal = data.ToDateTime(horarioFuncionamento.HorarioFechamento);

        var dataHoraAberturaUtc = TimeZoneHelper.ConvertToUtcFromSaoPaulo(dataHoraAberturaLocal);
        var dataHoraFechamentoUtc = TimeZoneHelper.ConvertToUtcFromSaoPaulo(dataHoraFechamentoLocal);

        // 3. Carregar bloqueios do dia
        var bloqueios = await _context.BloqueiosAgenda.AsNoTracking()
            .Where(b => b.Ativo && b.DataHoraInicio < dataHoraFechamentoUtc && b.DataHoraFim > dataHoraAberturaUtc)
            .ToListAsync(cancellationToken);

        // 4. Carregar agendamentos concorrentes ativos no dia (Bloqueiam: Pendente, Confirmado, A Caminho, Em Execução)
        var agendamentos = await _context.Agendamentos.AsNoTracking()
            .Where(a => a.Ativo &&
                        a.Status != AppointmentStatus.Finalizado &&
                        a.Status != AppointmentStatus.Cancelado &&
                        a.DataHoraInicio < dataHoraFechamentoUtc &&
                        a.DataHoraFimOcupacao > dataHoraAberturaUtc)
            .ToListAsync(cancellationToken);

        // 5. Gerar slots de 15 em 15 minutos
        var slots = new List<TimeSlotDto>();
        var tempoOcupacaoTotal = TimeSpan.FromMinutes(plano.DuracaoMinutos + BufferDeslocamentoMinutosPadrao);
        var tempoServico = TimeSpan.FromMinutes(plano.DuracaoMinutos);

        var slotAtualLocal = dataHoraAberturaLocal;
        var agoraUtc = DateTime.UtcNow;
        var antecedenciaMinima = agoraUtc.AddHours(2);
        var antecedenciaMaxima = agoraUtc.AddDays(60);

        while (slotAtualLocal.Add(tempoOcupacaoTotal) <= dataHoraFechamentoLocal)
        {
            var slotInicioUtc = TimeZoneHelper.ConvertToUtcFromSaoPaulo(slotAtualLocal);
            var slotFimServicoUtc = slotInicioUtc.Add(tempoServico);
            var slotFimOcupacaoUtc = slotInicioUtc.Add(tempoOcupacaoTotal);

            var disponivel = true;
            string? motivoIndisponibilidade = null;

            // Validação de antecedência mínima (2h)
            if (slotInicioUtc < antecedenciaMinima)
            {
                disponivel = false;
                motivoIndisponibilidade = "Antecedência mínima de 2 horas não atingida.";
            }
            // Validação de antecedência máxima (60 dias)
            else if (slotInicioUtc > antecedenciaMaxima)
            {
                disponivel = false;
                motivoIndisponibilidade = "Prazo máximo de 60 dias excedido.";
            }
            // Validação contra bloqueios da agenda: [inicio, fim)
            else if (bloqueios.Any(b => slotInicioUtc < b.DataHoraFim && slotFimOcupacaoUtc > b.DataHoraInicio))
            {
                disponivel = false;
                motivoIndisponibilidade = "Horário bloqueado pela administração.";
            }
            // Validação contra agendamentos existentes: [inicio, fim_ocupacao)
            else if (agendamentos.Any(a => slotInicioUtc < a.DataHoraFimOcupacao && slotFimOcupacaoUtc > a.DataHoraInicio))
            {
                disponivel = false;
                motivoIndisponibilidade = "Horário já reservado por outro cliente.";
            }

            var slotFimServicoLocal = slotAtualLocal.Add(tempoServico);

            slots.Add(new TimeSlotDto(
                slotInicioUtc,
                slotFimServicoUtc,
                slotFimOcupacaoUtc,
                slotAtualLocal.ToString("HH:mm"),
                slotFimServicoLocal.ToString("HH:mm"),
                disponivel,
                motivoIndisponibilidade
            ));

            slotAtualLocal = slotAtualLocal.AddMinutes(IntervaloGradeMinutos);
        }

        return new AvailableSlotsResponseDto(
            data,
            horarioFuncionamento.NomeDia,
            plano.DuracaoMinutos,
            BufferDeslocamentoMinutosPadrao,
            slots
        );
    }

    public async Task ValidarDisponibilidadeHorarioAsync(
        DateTime dataHoraInicioUtc,
        int duracaoMinutos,
        int bufferMinutos,
        Guid? agendamentoIdIgnorar = null,
        CancellationToken cancellationToken = default)
    {
        dataHoraInicioUtc = TimeZoneHelper.NormalizeToUtc(dataHoraInicioUtc);
        if (duracaoMinutos <= 0 || bufferMinutos < 0)
        {
            throw new ValidationAppException("Duração e deslocamento devem formar um intervalo válido.");
        }

        var agoraUtc = DateTime.UtcNow;
        if (dataHoraInicioUtc < agoraUtc.AddHours(2))
        {
            throw new ValidationAppException("O agendamento deve ser feito com no mínimo 2 horas de antecedência.");
        }

        if (dataHoraInicioUtc > agoraUtc.AddDays(60))
        {
            throw new ValidationAppException("O agendamento não pode exceder 60 dias de antecedência.");
        }

        var inicioLocal = TimeZoneHelper.ConvertToSaoPaulo(dataHoraInicioUtc);
        if (inicioLocal.Minute % IntervaloGradeMinutos != 0 || inicioLocal.Second != 0 || inicioLocal.Millisecond != 0)
        {
            throw new ValidationAppException("O horário deve respeitar a grade de 15 minutos.");
        }
        var diaSemanaInt = (int)inicioLocal.DayOfWeek;

        var horario = await _context.HorariosFuncionamento.AsNoTracking()
            .FirstOrDefaultAsync(h => h.DiaSemana == diaSemanaInt, cancellationToken);

        if (horario == null || !horario.Ativo)
        {
            throw new ValidationAppException("A estética não possui atendimento disponível neste dia da semana.");
        }

        var aberturaLocal = inicioLocal.Date.Add(horario.HorarioAbertura.ToTimeSpan());
        var fechamentoLocal = inicioLocal.Date.Add(horario.HorarioFechamento.ToTimeSpan());

        var fimOcupacaoUtc = dataHoraInicioUtc.AddMinutes(duracaoMinutos + bufferMinutos);
        var fimOcupacaoLocal = TimeZoneHelper.ConvertToSaoPaulo(fimOcupacaoUtc);

        if (inicioLocal < aberturaLocal || fimOcupacaoLocal > fechamentoLocal)
        {
            throw new ValidationAppException(
                $"O horário solicitado com duração e deslocamento ({inicioLocal:HH:mm} às {fimOcupacaoLocal:HH:mm}) ultrapassa o expediente ({aberturaLocal:HH:mm} às {fechamentoLocal:HH:mm}).");
        }

        // Verificar Bloqueios
        var bloqueioConflitante = await _context.BloqueiosAgenda.AsNoTracking()
            .AnyAsync(b => b.Ativo && dataHoraInicioUtc < b.DataHoraFim && fimOcupacaoUtc > b.DataHoraInicio, cancellationToken);

        if (bloqueioConflitante)
        {
            throw new ConflictException("O horário selecionado está bloqueado na agenda.");
        }

        // Verificar Agendamentos Concorrentes
        var query = _context.Agendamentos.AsNoTracking()
            .Where(a => a.Ativo &&
                        a.Status != AppointmentStatus.Finalizado &&
                        a.Status != AppointmentStatus.Cancelado &&
                        dataHoraInicioUtc < a.DataHoraFimOcupacao &&
                        fimOcupacaoUtc > a.DataHoraInicio);

        if (agendamentoIdIgnorar.HasValue)
        {
            query = query.Where(a => a.Id != agendamentoIdIgnorar.Value);
        }

        var agendamentoConflitante = await query.AnyAsync(cancellationToken);
        if (agendamentoConflitante)
        {
            throw new ConflictException("O horário solicitado acabou de ser ocupado por outro cliente. Por favor, escolha outro horário.");
        }
    }
}
