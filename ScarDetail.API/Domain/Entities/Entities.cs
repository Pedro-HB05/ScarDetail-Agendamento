using ScarDetail.API.Domain.Enums;

namespace ScarDetail.API.Domain.Entities;

public class User
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Nome { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string SenhaHash { get; set; } = string.Empty;
    public string Telefone { get; set; } = string.Empty;
    public UserRole Role { get; set; } = UserRole.Client;
    public bool Ativo { get; set; } = true;
    public DateTime CriadoEm { get; set; } = DateTime.UtcNow;
    public DateTime AtualizadoEm { get; set; } = DateTime.UtcNow;

    public ICollection<RefreshToken> RefreshTokens { get; set; } = new List<RefreshToken>();
    public ICollection<Vehicle> Veiculos { get; set; } = new List<Vehicle>();
    public ICollection<Address> Enderecos { get; set; } = new List<Address>();
    public ICollection<Appointment> Agendamentos { get; set; } = new List<Appointment>();
}

public class RefreshToken
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid UsuarioId { get; set; }
    public User Usuario { get; set; } = null!;
    public string Token { get; set; } = string.Empty;
    public string JwtId { get; set; } = string.Empty;
    public bool Revogado { get; set; } = false;
    public DateTime DataExpiracao { get; set; }
    public DateTime CriadoEm { get; set; } = DateTime.UtcNow;
    public string? SubstituidoPorToken { get; set; }

    public bool IsActive => !Revogado && DateTime.UtcNow < DataExpiracao;
}

public class Vehicle
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid UsuarioId { get; set; }
    public User Usuario { get; set; } = null!;
    public VehicleCategory Categoria { get; set; }
    public string Marca { get; set; } = string.Empty;
    public string Modelo { get; set; } = string.Empty;
    public int Ano { get; set; }
    public string? Placa { get; set; }
    public string? Cor { get; set; }
    public bool Ativo { get; set; } = true;
    public DateTime CriadoEm { get; set; } = DateTime.UtcNow;
    public DateTime AtualizadoEm { get; set; } = DateTime.UtcNow;

    public ICollection<Appointment> Agendamentos { get; set; } = new List<Appointment>();
}

public class Address
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid UsuarioId { get; set; }
    public User Usuario { get; set; } = null!;
    public string Apelido { get; set; } = string.Empty;
    public string Cep { get; set; } = string.Empty;
    public string Logradouro { get; set; } = string.Empty;
    public string Numero { get; set; } = string.Empty;
    public string? Complemento { get; set; }
    public string Bairro { get; set; } = string.Empty;
    public string Cidade { get; set; } = string.Empty;
    public string Uf { get; set; } = string.Empty;
    public string? PontoReferencia { get; set; }
    public bool Ativo { get; set; } = true;
    public DateTime CriadoEm { get; set; } = DateTime.UtcNow;
    public DateTime AtualizadoEm { get; set; } = DateTime.UtcNow;

    public ICollection<Appointment> Agendamentos { get; set; } = new List<Appointment>();
}

public class PermittedNeighborhood
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Nome { get; set; } = string.Empty;
    public string NomeNormalizado { get; set; } = string.Empty;
    public string Cidade { get; set; } = string.Empty;
    public string Uf { get; set; } = string.Empty;
    public bool Ativo { get; set; } = true;
    public DateTime CriadoEm { get; set; } = DateTime.UtcNow;
    public DateTime AtualizadoEm { get; set; } = DateTime.UtcNow;
}

public class ServicePlan
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Nome { get; set; } = string.Empty;
    public string? Descricao { get; set; }
    public int DuracaoMinutos { get; set; }
    public decimal PrecoHatch { get; set; }
    public decimal PrecoSedan { get; set; }
    public decimal PrecoSuv { get; set; }
    public decimal PrecoCamionete { get; set; }
    public decimal PrecoWagon { get; set; }
    public bool Ativo { get; set; } = true;
    public DateTime CriadoEm { get; set; } = DateTime.UtcNow;
    public DateTime AtualizadoEm { get; set; } = DateTime.UtcNow;

    public ICollection<Appointment> Agendamentos { get; set; } = new List<Appointment>();
    public ICollection<PlanAudit> Auditorias { get; set; } = new List<PlanAudit>();

    public decimal ObterPrecoPorCategoria(VehicleCategory categoria) => categoria switch
    {
        VehicleCategory.Hatch => PrecoHatch,
        VehicleCategory.Sedan => PrecoSedan,
        VehicleCategory.SUV => PrecoSuv,
        VehicleCategory.Camionete => PrecoCamionete,
        VehicleCategory.Wagon => PrecoWagon,
        _ => throw new ArgumentOutOfRangeException(nameof(categoria), $"Categoria {categoria} não suportada.")
    };
}

public class PlanAudit
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid PlanoId { get; set; }
    public ServicePlan Plano { get; set; } = null!;
    public Guid? UsuarioId { get; set; }
    public User? Usuario { get; set; }
    public string Acao { get; set; } = string.Empty;
    public string? DadosAnteriores { get; set; }
    public string? DadosNovos { get; set; }
    public DateTime CriadoEm { get; set; } = DateTime.UtcNow;
}

public class BusinessHour
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public int DiaSemana { get; set; } // 0 = Domingo, 1 = Segunda ... 6 = Sábado
    public string NomeDia { get; set; } = string.Empty;
    public TimeOnly HorarioAbertura { get; set; }
    public TimeOnly HorarioFechamento { get; set; }
    public bool Ativo { get; set; } = true;
    public DateTime CriadoEm { get; set; } = DateTime.UtcNow;
    public DateTime AtualizadoEm { get; set; } = DateTime.UtcNow;
}

public class AgendaBlock
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public DateTime DataHoraInicio { get; set; }
    public DateTime DataHoraFim { get; set; }
    public string Motivo { get; set; } = string.Empty;
    public Guid CriadoPorUsuarioId { get; set; }
    public User CriadoPorUsuario { get; set; } = null!;
    public bool Ativo { get; set; } = true;
    public DateTime CriadoEm { get; set; } = DateTime.UtcNow;
    public DateTime AtualizadoEm { get; set; } = DateTime.UtcNow;
}

public class Appointment
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid ClienteId { get; set; }
    public User Cliente { get; set; } = null!;
    public Guid VeiculoId { get; set; }
    public Vehicle Veiculo { get; set; } = null!;
    public Guid EnderecoId { get; set; }
    public Address Endereco { get; set; } = null!;
    public Guid PlanoId { get; set; }
    public ServicePlan Plano { get; set; } = null!;

    // Snapshots imutáveis
    public string ServicoNome { get; set; } = string.Empty;
    public VehicleCategory VeiculoCategoria { get; set; }
    public string VeiculoMarca { get; set; } = string.Empty;
    public string VeiculoModelo { get; set; } = string.Empty;
    public string? VeiculoPlaca { get; set; }
    public string EnderecoCompleto { get; set; } = string.Empty;
    public decimal ValorCobrado { get; set; }
    public int DuracaoMinutos { get; set; }
    public int BufferDeslocamentoMinutos { get; set; } = 30;

    // Datas e Horários
    public DateTime DataHoraInicio { get; set; }
    public DateTime DataHoraFimServico { get; set; }
    public DateTime DataHoraFimOcupacao { get; set; }

    public AppointmentStatus Status { get; set; } = AppointmentStatus.Pendente;
    public string? Observacoes { get; set; }
    public string? MotivoCancelamento { get; set; }
    public Guid? CanceladoPorUsuarioId { get; set; }
    public User? CanceladoPorUsuario { get; set; }
    public DateTime? CanceladoEm { get; set; }

    public bool Ativo { get; set; } = true;
    public DateTime CriadoEm { get; set; } = DateTime.UtcNow;
    public DateTime AtualizadoEm { get; set; } = DateTime.UtcNow;

    public Payment? Pagamento { get; set; }
    public ICollection<AppointmentStatusHistory> HistoricosStatus { get; set; } = new List<AppointmentStatusHistory>();
}

public class AppointmentStatusHistory
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid AgendamentoId { get; set; }
    public Appointment Agendamento { get; set; } = null!;
    public AppointmentStatus? StatusAnterior { get; set; }
    public AppointmentStatus StatusNovo { get; set; }
    public Guid? AlteradoPorUsuarioId { get; set; }
    public User? AlteradoPorUsuario { get; set; }
    public string? Observacao { get; set; }
    public DateTime CriadoEm { get; set; } = DateTime.UtcNow;
}

public class Payment
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid AgendamentoId { get; set; }
    public Appointment Agendamento { get; set; } = null!;
    public PaymentMethod Metodo { get; set; }
    public decimal ValorOriginal { get; set; }
    public decimal Desconto { get; set; } = 0.00m;
    public decimal Acrescimo { get; set; } = 0.00m;
    public string? JustificativaAjuste { get; set; }
    public decimal ValorFinal { get; set; }
    public decimal ValorRecebido { get; set; }
    public decimal Troco { get; set; } = 0.00m;
    public string? Observacao { get; set; }
    public Guid RegistradoPorUsuarioId { get; set; }
    public User RegistradoPorUsuario { get; set; } = null!;
    public DateTime PagoEm { get; set; } = DateTime.UtcNow;
    public DateTime CriadoEm { get; set; } = DateTime.UtcNow;
    public DateTime AtualizadoEm { get; set; } = DateTime.UtcNow;
}
