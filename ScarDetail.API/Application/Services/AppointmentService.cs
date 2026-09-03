using Microsoft.EntityFrameworkCore;
using Npgsql;
using ScarDetail.API.Application.Common.Exceptions;
using ScarDetail.API.Application.Common.Utilities;
using ScarDetail.API.Application.DTOs;
using ScarDetail.API.Domain.Entities;
using ScarDetail.API.Domain.Enums;
using ScarDetail.API.Infrastructure.Data;

namespace ScarDetail.API.Application.Services;

public interface IAppointmentService
{
    Task<AppointmentDto> CreateAppointmentAsync(Guid clienteId, CreateAppointmentDto dto, CancellationToken cancellationToken = default);
    Task<AppointmentDto> GetAppointmentByIdAsync(Guid id, Guid userId, bool isAdmin = false, CancellationToken cancellationToken = default);
    Task<List<AppointmentDto>> GetClientAppointmentsAsync(Guid clienteId, AppointmentStatus? status = null, CancellationToken cancellationToken = default);
    Task<List<AppointmentDto>> GetAdminAppointmentsAsync(DateTime? dataInicio = null, DateTime? dataFim = null, AppointmentStatus? status = null, Guid? clienteId = null, CancellationToken cancellationToken = default);
    Task<AppointmentDto> UpdateStatusAsync(Guid id, Guid usuarioId, bool isAdmin, UpdateAppointmentStatusDto dto, CancellationToken cancellationToken = default);
    Task<AppointmentDto> CancelAppointmentAsync(Guid id, Guid usuarioId, bool isAdmin, CancelAppointmentDto dto, CancellationToken cancellationToken = default);
    Task<AppointmentDto> RescheduleAppointmentAsync(Guid id, Guid usuarioId, bool isAdmin, RescheduleAppointmentDto dto, CancellationToken cancellationToken = default);
}

public class AppointmentService : IAppointmentService
{
    private const long AgendaTransactionLockId = 7_246_331_991L;
    private readonly AppDbContext _context;
    private readonly ISchedulingEngine _schedulingEngine;
    private readonly IAddressService _addressService;
    private const int BufferDeslocamentoMinutosPadrao = 30;

    public AppointmentService(
        AppDbContext context,
        ISchedulingEngine schedulingEngine,
        IAddressService addressService)
    {
        _context = context;
        _schedulingEngine = schedulingEngine;
        _addressService = addressService;
    }

    public async Task<AppointmentDto> CreateAppointmentAsync(Guid clienteId, CreateAppointmentDto dto, CancellationToken cancellationToken = default)
    {
        // 1. Validar Veículo do Cliente
        var veiculo = await _context.Veiculos.AsNoTracking()
            .FirstOrDefaultAsync(v => v.Id == dto.VeiculoId && v.UsuarioId == clienteId, cancellationToken);

        if (veiculo == null)
            throw new NotFoundException("Veículo não encontrado ou não pertence a este cliente.");

        if (!veiculo.Ativo)
            throw new ValidationAppException("Não é possível realizar agendamento para um veículo inativo.");

        // 2. Validar Endereço do Cliente
        var endereco = await _context.Enderecos.AsNoTracking()
            .FirstOrDefaultAsync(e => e.Id == dto.EnderecoId && e.UsuarioId == clienteId, cancellationToken);

        if (endereco == null)
            throw new NotFoundException("Endereço não encontrado ou não pertence a este cliente.");

        if (!endereco.Ativo)
            throw new ValidationAppException("Não é possível realizar agendamento para um endereço desativado.");

        // 3. Validar se o bairro ainda é atendido
        await _addressService.ValidarBairroAtendidoAsync(endereco.Bairro, endereco.Cidade, endereco.Uf, cancellationToken);

        // 4. Validar Plano/Serviço
        var plano = await _context.Planos.AsNoTracking()
            .FirstOrDefaultAsync(p => p.Id == dto.PlanoId, cancellationToken);

        if (plano == null)
            throw new NotFoundException("Serviço/Plano selecionado não foi encontrado.");

        if (!plano.Ativo)
            throw new ValidationAppException("Este serviço está desativado no momento e não aceita novos agendamentos.");

        // 5. Calcular preço e tempos (com suporte integral à Wagon)
        var valorCobrado = plano.ObterPrecoPorCategoria(veiculo.Categoria);
        var duracaoMinutos = plano.DuracaoMinutos;
        var dataHoraInicioUtc = TimeZoneHelper.NormalizeToUtc(dto.DataHoraInicio);
        var dataHoraFimServicoUtc = dataHoraInicioUtc.AddMinutes(duracaoMinutos);
        var dataHoraFimOcupacaoUtc = dataHoraInicioUtc.AddMinutes(duracaoMinutos + BufferDeslocamentoMinutosPadrao);

        // 6. Transação com proteção contra concorrência. A transação precisa ser
        // executada pela estratégia do Npgsql para que todo o bloco possa ser
        // repetido com segurança em caso de uma falha transitória de conexão.
        var strategy = _context.Database.CreateExecutionStrategy();
        var appointmentId = await strategy.ExecuteAsync(async () =>
        {
            await using var transaction = await _context.Database.BeginTransactionAsync(cancellationToken);
            try
            {
                await AcquireAgendaLockAsync(cancellationToken);
                await _schedulingEngine.ValidarDisponibilidadeHorarioAsync(
                    dataHoraInicioUtc,
                    duracaoMinutos,
                    BufferDeslocamentoMinutosPadrao,
                    cancellationToken: cancellationToken);

                var enderecoFormatado = $"{endereco.Logradouro}, {endereco.Numero}" +
                    (string.IsNullOrWhiteSpace(endereco.Complemento) ? "" : $" ({endereco.Complemento})") +
                    $" - {endereco.Bairro}, {endereco.Cidade}/{endereco.Uf} - CEP {endereco.Cep}";

                var appointment = new Appointment
                {
                    ClienteId = clienteId,
                    VeiculoId = veiculo.Id,
                    EnderecoId = endereco.Id,
                    PlanoId = plano.Id,

                    // Snapshots imutáveis
                    ServicoNome = plano.Nome,
                    VeiculoCategoria = veiculo.Categoria,
                    VeiculoMarca = veiculo.Marca,
                    VeiculoModelo = veiculo.Modelo,
                    VeiculoPlaca = veiculo.Placa,
                    EnderecoCompleto = enderecoFormatado,
                    ValorCobrado = valorCobrado,
                    DuracaoMinutos = duracaoMinutos,
                    BufferDeslocamentoMinutos = BufferDeslocamentoMinutosPadrao,

                    DataHoraInicio = dataHoraInicioUtc,
                    DataHoraFimServico = dataHoraFimServicoUtc,
                    DataHoraFimOcupacao = dataHoraFimOcupacaoUtc,

                    Status = AppointmentStatus.Pendente,
                    Observacoes = dto.Observacoes?.Trim(),
                    Ativo = true
                };

                _context.Agendamentos.Add(appointment);

                // Registrar Histórico de Status inicial
                _context.HistoricosStatusAgendamento.Add(new AppointmentStatusHistory
                {
                    AgendamentoId = appointment.Id,
                    StatusAnterior = null,
                    StatusNovo = AppointmentStatus.Pendente,
                    AlteradoPorUsuarioId = clienteId,
                    Observacao = "Agendamento criado pelo cliente."
                });

                await _context.SaveChangesAsync(cancellationToken);
                await transaction.CommitAsync(cancellationToken);
                return appointment.Id;
            }
            catch (DbUpdateException ex) when (ex.InnerException is PostgresException pgEx && pgEx.SqlState == "23P01")
            {
                throw new ConflictException("Conflito de agendamento: O horário selecionado acabou de ser reservado.");
            }
        });

        return await GetAppointmentByIdAsync(appointmentId, clienteId, isAdmin: true, cancellationToken);
    }

    public async Task<AppointmentDto> GetAppointmentByIdAsync(Guid id, Guid userId, bool isAdmin = false, CancellationToken cancellationToken = default)
    {
        var appt = await _context.Agendamentos.AsNoTracking()
            .Include(a => a.Cliente)
            .Include(a => a.Veiculo)
            .Include(a => a.Endereco)
            .Include(a => a.Plano)
            .Include(a => a.Pagamento)
                .ThenInclude(p => p!.RegistradoPorUsuario)
            .Include(a => a.HistoricosStatus)
                .ThenInclude(h => h.AlteradoPorUsuario)
            .FirstOrDefaultAsync(a => a.Id == id, cancellationToken);

        if (appt == null)
            throw new NotFoundException("Agendamento não encontrado.");

        if (!isAdmin && appt.ClienteId != userId)
            throw new ForbiddenAppException("Você não tem permissão para visualizar este agendamento.");

        return MapToDto(appt);
    }

    public async Task<List<AppointmentDto>> GetClientAppointmentsAsync(Guid clienteId, AppointmentStatus? status = null, CancellationToken cancellationToken = default)
    {
        var query = _context.Agendamentos.AsNoTracking()
            .Include(a => a.Cliente)
            .Include(a => a.Veiculo)
            .Include(a => a.Endereco)
            .Include(a => a.Plano)
            .Include(a => a.Pagamento)
            .Include(a => a.HistoricosStatus)
                .ThenInclude(h => h.AlteradoPorUsuario)
            .Where(a => a.ClienteId == clienteId);

        if (status.HasValue)
        {
            query = query.Where(a => a.Status == status.Value);
        }

        var list = await query.OrderByDescending(a => a.DataHoraInicio).ToListAsync(cancellationToken);
        return list.Select(MapToDto).ToList();
    }

    public async Task<List<AppointmentDto>> GetAdminAppointmentsAsync(
        DateTime? dataInicio = null,
        DateTime? dataFim = null,
        AppointmentStatus? status = null,
        Guid? clienteId = null,
        CancellationToken cancellationToken = default)
    {
        var query = _context.Agendamentos.AsNoTracking()
            .Include(a => a.Cliente)
            .Include(a => a.Veiculo)
            .Include(a => a.Endereco)
            .Include(a => a.Plano)
            .Include(a => a.Pagamento)
            .Include(a => a.HistoricosStatus)
                .ThenInclude(h => h.AlteradoPorUsuario)
            .AsQueryable();

        if (dataInicio.HasValue)
        {
            query = query.Where(a => a.DataHoraFimOcupacao >= dataInicio.Value);
        }

        if (dataFim.HasValue)
        {
            query = query.Where(a => a.DataHoraInicio <= dataFim.Value);
        }

        if (status.HasValue)
        {
            query = query.Where(a => a.Status == status.Value);
        }

        if (clienteId.HasValue)
        {
            query = query.Where(a => a.ClienteId == clienteId.Value);
        }

        var list = await query.OrderBy(a => a.DataHoraInicio).ToListAsync(cancellationToken);
        return list.Select(MapToDto).ToList();
    }

    public async Task<AppointmentDto> UpdateStatusAsync(Guid id, Guid usuarioId, bool isAdmin, UpdateAppointmentStatusDto dto, CancellationToken cancellationToken = default)
    {
        var appt = await _context.Agendamentos
            .Include(a => a.HistoricosStatus)
            .FirstOrDefaultAsync(a => a.Id == id, cancellationToken);

        if (appt == null)
            throw new NotFoundException("Agendamento não encontrado.");

        if (!isAdmin && appt.ClienteId != usuarioId)
            throw new ForbiddenAppException("Você não tem permissão para alterar este agendamento.");

        ValidarTransicaoStatus(appt.Status, dto.NovoStatus, isAdmin, dto.Observacao);

        var statusAnterior = appt.Status;
        appt.Status = dto.NovoStatus;

        if (dto.NovoStatus == AppointmentStatus.Cancelado)
        {
            appt.MotivoCancelamento = dto.Observacao ?? "Cancelado";
            appt.CanceladoPorUsuarioId = usuarioId;
            appt.CanceladoEm = DateTime.UtcNow;
        }

        _context.HistoricosStatusAgendamento.Add(new AppointmentStatusHistory
        {
            AgendamentoId = appt.Id,
            StatusAnterior = statusAnterior,
            StatusNovo = dto.NovoStatus,
            AlteradoPorUsuarioId = usuarioId,
            Observacao = dto.Observacao?.Trim() ?? $"Status alterado de {statusAnterior} para {dto.NovoStatus}."
        });

        await _context.SaveChangesAsync(cancellationToken);
        return await GetAppointmentByIdAsync(appt.Id, usuarioId, isAdmin: true, cancellationToken);
    }

    public async Task<AppointmentDto> CancelAppointmentAsync(Guid id, Guid usuarioId, bool isAdmin, CancelAppointmentDto dto, CancellationToken cancellationToken = default)
    {
        return await UpdateStatusAsync(id, usuarioId, isAdmin, new UpdateAppointmentStatusDto(
            AppointmentStatus.Cancelado,
            dto.Motivo
        ), cancellationToken);
    }

    public async Task<AppointmentDto> RescheduleAppointmentAsync(Guid id, Guid usuarioId, bool isAdmin, RescheduleAppointmentDto dto, CancellationToken cancellationToken = default)
    {
        var appt = await _context.Agendamentos.FirstOrDefaultAsync(a => a.Id == id, cancellationToken);
        if (appt == null)
            throw new NotFoundException("Agendamento não encontrado.");

        if (!isAdmin && appt.ClienteId != usuarioId)
            throw new ForbiddenAppException("Você não tem permissão para reagendar este agendamento.");

        if (appt.Status is AppointmentStatus.Finalizado or AppointmentStatus.Cancelado)
        {
            throw new ValidationAppException("Não é possível reagendar um agendamento finalizado ou cancelado.");
        }

        var novaDataHoraInicioUtc = TimeZoneHelper.NormalizeToUtc(dto.NovaDataHoraInicio);
        var novaDataHoraFimServicoUtc = novaDataHoraInicioUtc.AddMinutes(appt.DuracaoMinutos);
        var novaDataHoraFimOcupacaoUtc = novaDataHoraInicioUtc.AddMinutes(appt.DuracaoMinutos + appt.BufferDeslocamentoMinutos);

        var dataAnterior = appt.DataHoraInicio;
        var strategy = _context.Database.CreateExecutionStrategy();
        await strategy.ExecuteAsync(async () =>
        {
            await using var transaction = await _context.Database.BeginTransactionAsync(cancellationToken);
            await AcquireAgendaLockAsync(cancellationToken);

            // Validar o novo horário novamente dentro da transação.
            await _schedulingEngine.ValidarDisponibilidadeHorarioAsync(
                novaDataHoraInicioUtc,
                appt.DuracaoMinutos,
                appt.BufferDeslocamentoMinutos,
                agendamentoIdIgnorar: appt.Id,
                cancellationToken: cancellationToken);

            appt.DataHoraInicio = novaDataHoraInicioUtc;
            appt.DataHoraFimServico = novaDataHoraFimServicoUtc;
            appt.DataHoraFimOcupacao = novaDataHoraFimOcupacaoUtc;

            _context.HistoricosStatusAgendamento.Add(new AppointmentStatusHistory
            {
                AgendamentoId = appt.Id,
                StatusAnterior = appt.Status,
                StatusNovo = appt.Status,
                AlteradoPorUsuarioId = usuarioId,
                Observacao = $"Reagendado de {dataAnterior:dd/MM/yyyy HH:mm} para {novaDataHoraInicioUtc:dd/MM/yyyy HH:mm}. Motivo: {dto.Motivo}"
            });

            try
            {
                await _context.SaveChangesAsync(cancellationToken);
                await transaction.CommitAsync(cancellationToken);
            }
            catch (DbUpdateException ex) when (ex.InnerException is PostgresException pgEx && pgEx.SqlState == "23P01")
            {
                throw new ConflictException("Conflito de reagendamento: o horário acabou de ser ocupado.");
            }
        });

        return await GetAppointmentByIdAsync(appt.Id, usuarioId, isAdmin: true, cancellationToken);
    }

    private Task AcquireAgendaLockAsync(CancellationToken cancellationToken) =>
        _context.Database.IsNpgsql()
            ? _context.Database.ExecuteSqlInterpolatedAsync($"SELECT pg_advisory_xact_lock({AgendaTransactionLockId})", cancellationToken)
            : Task.CompletedTask;

    private static void ValidarTransicaoStatus(AppointmentStatus atual, AppointmentStatus novo, bool isAdmin, string? observacao)
    {
        if (atual == novo) return;

        var permitida = (atual, novo) switch
        {
            (AppointmentStatus.Pendente, AppointmentStatus.Confirmado) => true,
            (AppointmentStatus.Pendente, AppointmentStatus.Cancelado) => true,

            (AppointmentStatus.Confirmado, AppointmentStatus.ACaminho) => isAdmin,
            (AppointmentStatus.Confirmado, AppointmentStatus.Cancelado) => true,

            (AppointmentStatus.ACaminho, AppointmentStatus.EmExecucao) => isAdmin,
            (AppointmentStatus.ACaminho, AppointmentStatus.Cancelado) => isAdmin,

            (AppointmentStatus.EmExecucao, AppointmentStatus.Finalizado) => isAdmin,
            (AppointmentStatus.EmExecucao, AppointmentStatus.Cancelado) => isAdmin && !string.IsNullOrWhiteSpace(observacao),

            _ => false
        };

        if (!permitida)
        {
            if (atual == AppointmentStatus.EmExecucao && novo == AppointmentStatus.Cancelado && string.IsNullOrWhiteSpace(observacao))
            {
                throw new ValidationAppException("O cancelamento de um atendimento em execução exige uma justificativa obrigatória.");
            }

            throw new ValidationAppException($"Transição de status inválida: de '{atual}' para '{novo}'.");
        }
    }

    private static AppointmentDto MapToDto(Appointment a)
    {
        return new AppointmentDto(
            a.Id,
            a.ClienteId,
            a.Cliente?.Nome ?? string.Empty,
            a.Cliente?.Email ?? string.Empty,
            a.Cliente?.Telefone ?? string.Empty,
            a.VeiculoId,
            a.VeiculoCategoria,
            a.VeiculoCategoria.ToDisplayName(),
            a.VeiculoMarca,
            a.VeiculoModelo,
            a.VeiculoPlaca,
            a.EnderecoId,
            a.EnderecoCompleto,
            a.PlanoId,
            a.ServicoNome,
            a.ValorCobrado,
            a.DuracaoMinutos,
            a.BufferDeslocamentoMinutos,
            a.DataHoraInicio,
            a.DataHoraFimServico,
            a.DataHoraFimOcupacao,
            a.Status,
            a.Observacoes,
            a.MotivoCancelamento,
            a.CanceladoEm,
            a.Ativo,
            a.CriadoEm,
            a.Pagamento == null ? null : new PaymentDto(
                a.Pagamento.Id,
                a.Pagamento.AgendamentoId,
                a.Pagamento.Metodo,
                a.Pagamento.ValorOriginal,
                a.Pagamento.Desconto,
                a.Pagamento.Acrescimo,
                a.Pagamento.JustificativaAjuste,
                a.Pagamento.ValorFinal,
                a.Pagamento.ValorRecebido,
                a.Pagamento.Troco,
                a.Pagamento.Observacao,
                a.Pagamento.RegistradoPorUsuarioId,
                a.Pagamento.RegistradoPorUsuario?.Nome,
                a.Pagamento.PagoEm
            ),
            a.HistoricosStatus.OrderByDescending(h => h.CriadoEm).Select(h => new AppointmentStatusHistoryDto(
                h.Id,
                h.StatusAnterior,
                h.StatusNovo,
                h.AlteradoPorUsuarioId,
                h.AlteradoPorUsuario?.Nome,
                h.Observacao,
                h.CriadoEm
            )).ToList()
        );
    }
}
