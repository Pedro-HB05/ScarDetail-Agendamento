using Microsoft.EntityFrameworkCore;
using ScarDetail.API.Domain.Entities;
using ScarDetail.API.Domain.Enums;

namespace ScarDetail.API.Infrastructure.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
    {
    }

    public DbSet<User> Usuarios => Set<User>();
    public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();
    public DbSet<Vehicle> Veiculos => Set<Vehicle>();
    public DbSet<Address> Enderecos => Set<Address>();
    public DbSet<PermittedNeighborhood> BairrosPermitidos => Set<PermittedNeighborhood>();
    public DbSet<ServicePlan> Planos => Set<ServicePlan>();
    public DbSet<PlanAudit> AuditoriaPlanos => Set<PlanAudit>();
    public DbSet<BusinessHour> HorariosFuncionamento => Set<BusinessHour>();
    public DbSet<AgendaBlock> BloqueiosAgenda => Set<AgendaBlock>();
    public DbSet<Appointment> Agendamentos => Set<Appointment>();
    public DbSet<AppointmentStatusHistory> HistoricosStatusAgendamento => Set<AppointmentStatusHistory>();
    public DbSet<Payment> Pagamentos => Set<Payment>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Extensões PostgreSQL
        modelBuilder.HasPostgresExtension("uuid-ossp");
        modelBuilder.HasPostgresExtension("btree_gist");
        modelBuilder.HasPostgresExtension("unaccent");

        // 1. User (usuarios)
        modelBuilder.Entity<User>(entity =>
        {
            entity.ToTable("usuarios");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.Nome).HasColumnName("nome").HasMaxLength(150).IsRequired();
            entity.Property(e => e.Email).HasColumnName("email").HasMaxLength(255).IsRequired();
            entity.Property(e => e.SenhaHash).HasColumnName("senha_hash").HasMaxLength(255).IsRequired();
            entity.Property(e => e.Telefone).HasColumnName("telefone").HasMaxLength(20).IsRequired();
            entity.Property(e => e.Role).HasColumnName("role").HasConversion<string>().HasMaxLength(20).IsRequired();
            entity.Property(e => e.Ativo).HasColumnName("ativo").HasDefaultValue(true).IsRequired();
            entity.Property(e => e.CriadoEm).HasColumnName("criado_em").HasColumnType("timestamptz").IsRequired();
            entity.Property(e => e.AtualizadoEm).HasColumnName("atualizado_em").HasColumnType("timestamptz").IsRequired();

            entity.HasIndex(e => e.Email).IsUnique();
        });

        // 2. RefreshToken (refresh_tokens)
        modelBuilder.Entity<RefreshToken>(entity =>
        {
            entity.ToTable("refresh_tokens");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.UsuarioId).HasColumnName("usuario_id").IsRequired();
            entity.Property(e => e.Token).HasColumnName("token").HasMaxLength(500).IsRequired();
            entity.Property(e => e.JwtId).HasColumnName("jwt_id").HasMaxLength(255).IsRequired();
            entity.Property(e => e.Revogado).HasColumnName("revogado").HasDefaultValue(false).IsRequired();
            entity.Property(e => e.DataExpiracao).HasColumnName("data_expiracao").HasColumnType("timestamptz").IsRequired();
            entity.Property(e => e.CriadoEm).HasColumnName("criado_em").HasColumnType("timestamptz").IsRequired();
            entity.Property(e => e.SubstituidoPorToken).HasColumnName("substituido_por_token").HasMaxLength(500);

            entity.HasOne(e => e.Usuario)
                  .WithMany(u => u.RefreshTokens)
                  .HasForeignKey(e => e.UsuarioId)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        // 3. Vehicle (veiculos)
        modelBuilder.Entity<Vehicle>(entity =>
        {
            entity.ToTable("veiculos");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.UsuarioId).HasColumnName("usuario_id").IsRequired();
            entity.Property(e => e.Categoria).HasColumnName("categoria").HasConversion<string>().HasMaxLength(20).IsRequired();
            entity.Property(e => e.Marca).HasColumnName("marca").HasMaxLength(50).IsRequired();
            entity.Property(e => e.Modelo).HasColumnName("modelo").HasMaxLength(50).IsRequired();
            entity.Property(e => e.Ano).HasColumnName("ano").IsRequired();
            entity.Property(e => e.Placa).HasColumnName("placa").HasMaxLength(10);
            entity.Property(e => e.Cor).HasColumnName("cor").HasMaxLength(30);
            entity.Property(e => e.Ativo).HasColumnName("ativo").HasDefaultValue(true).IsRequired();
            entity.Property(e => e.CriadoEm).HasColumnName("criado_em").HasColumnType("timestamptz").IsRequired();
            entity.Property(e => e.AtualizadoEm).HasColumnName("atualizado_em").HasColumnType("timestamptz").IsRequired();

            entity.HasOne(e => e.Usuario)
                  .WithMany(u => u.Veiculos)
                  .HasForeignKey(e => e.UsuarioId)
                  .OnDelete(DeleteBehavior.Restrict);
        });

        // 4. Address (enderecos)
        modelBuilder.Entity<Address>(entity =>
        {
            entity.ToTable("enderecos");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.UsuarioId).HasColumnName("usuario_id").IsRequired();
            entity.Property(e => e.Apelido).HasColumnName("apelido").HasMaxLength(50).IsRequired();
            entity.Property(e => e.Cep).HasColumnName("cep").HasMaxLength(9).IsRequired();
            entity.Property(e => e.Logradouro).HasColumnName("logradouro").HasMaxLength(150).IsRequired();
            entity.Property(e => e.Numero).HasColumnName("numero").HasMaxLength(20).IsRequired();
            entity.Property(e => e.Complemento).HasColumnName("complemento").HasMaxLength(100);
            entity.Property(e => e.Bairro).HasColumnName("bairro").HasMaxLength(100).IsRequired();
            entity.Property(e => e.Cidade).HasColumnName("cidade").HasMaxLength(100).IsRequired();
            entity.Property(e => e.Uf).HasColumnName("uf").HasMaxLength(2).IsRequired();
            entity.Property(e => e.PontoReferencia).HasColumnName("ponto_referencia").HasMaxLength(255);
            entity.Property(e => e.Ativo).HasColumnName("ativo").HasDefaultValue(true).IsRequired();
            entity.Property(e => e.CriadoEm).HasColumnName("criado_em").HasColumnType("timestamptz").IsRequired();
            entity.Property(e => e.AtualizadoEm).HasColumnName("atualizado_em").HasColumnType("timestamptz").IsRequired();

            entity.HasOne(e => e.Usuario)
                  .WithMany(u => u.Enderecos)
                  .HasForeignKey(e => e.UsuarioId)
                  .OnDelete(DeleteBehavior.Restrict);
        });

        // 5. PermittedNeighborhood (bairros_permitidos)
        modelBuilder.Entity<PermittedNeighborhood>(entity =>
        {
            entity.ToTable("bairros_permitidos");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.Nome).HasColumnName("nome").HasMaxLength(100).IsRequired();
            entity.Property(e => e.NomeNormalizado).HasColumnName("nome_normalizado").HasMaxLength(100).IsRequired();
            entity.Property(e => e.Cidade).HasColumnName("cidade").HasMaxLength(100).IsRequired();
            entity.Property(e => e.Uf).HasColumnName("uf").HasMaxLength(2).IsRequired();
            entity.Property(e => e.Ativo).HasColumnName("ativo").HasDefaultValue(true).IsRequired();
            entity.Property(e => e.CriadoEm).HasColumnName("criado_em").HasColumnType("timestamptz").IsRequired();
            entity.Property(e => e.AtualizadoEm).HasColumnName("atualizado_em").HasColumnType("timestamptz").IsRequired();

            entity.HasIndex(e => new { e.NomeNormalizado, e.Cidade, e.Uf }).IsUnique();
        });

        // 6. ServicePlan (planos)
        modelBuilder.Entity<ServicePlan>(entity =>
        {
            entity.ToTable("planos");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.Nome).HasColumnName("nome").HasMaxLength(100).IsRequired();
            entity.Property(e => e.Descricao).HasColumnName("descricao");
            entity.Property(e => e.DuracaoMinutos).HasColumnName("duracao_minutos").IsRequired();
            entity.Property(e => e.PrecoHatch).HasColumnName("preco_hatch").HasColumnType("numeric(10,2)").IsRequired();
            entity.Property(e => e.PrecoSedan).HasColumnName("preco_sedan").HasColumnType("numeric(10,2)").IsRequired();
            entity.Property(e => e.PrecoSuv).HasColumnName("preco_suv").HasColumnType("numeric(10,2)").IsRequired();
            entity.Property(e => e.PrecoCamionete).HasColumnName("preco_camionete").HasColumnType("numeric(10,2)").IsRequired();
            entity.Property(e => e.PrecoWagon).HasColumnName("preco_wagon").HasColumnType("numeric(10,2)").IsRequired();
            entity.Property(e => e.Ativo).HasColumnName("ativo").HasDefaultValue(true).IsRequired();
            entity.Property(e => e.EhAdicional).HasColumnName("eh_adicional").HasDefaultValue(false).IsRequired();
            entity.Property(e => e.CriadoEm).HasColumnName("criado_em").HasColumnType("timestamptz").IsRequired();
            entity.Property(e => e.AtualizadoEm).HasColumnName("atualizado_em").HasColumnType("timestamptz").IsRequired();
        });

        // 7. PlanAudit (auditoria_planos)
        modelBuilder.Entity<PlanAudit>(entity =>
        {
            entity.ToTable("auditoria_planos");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.PlanoId).HasColumnName("plano_id").IsRequired();
            entity.Property(e => e.UsuarioId).HasColumnName("usuario_id");
            entity.Property(e => e.Acao).HasColumnName("acao").HasMaxLength(20).IsRequired();
            entity.Property(e => e.DadosAnteriores).HasColumnName("dados_anteriores").HasColumnType("jsonb");
            entity.Property(e => e.DadosNovos).HasColumnName("dados_novos").HasColumnType("jsonb");
            entity.Property(e => e.CriadoEm).HasColumnName("criado_em").HasColumnType("timestamptz").IsRequired();

            entity.HasOne(e => e.Plano)
                  .WithMany(p => p.Auditorias)
                  .HasForeignKey(e => e.PlanoId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.Usuario)
                  .WithMany()
                  .HasForeignKey(e => e.UsuarioId)
                  .OnDelete(DeleteBehavior.SetNull);
        });

        // 8. BusinessHour (horarios_funcionamento)
        modelBuilder.Entity<BusinessHour>(entity =>
        {
            entity.ToTable("horarios_funcionamento");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.DiaSemana).HasColumnName("dia_semana").IsRequired();
            entity.Property(e => e.NomeDia).HasColumnName("nome_dia").HasMaxLength(20).IsRequired();
            entity.Property(e => e.HorarioAbertura).HasColumnName("horario_abertura").HasColumnType("time").IsRequired();
            entity.Property(e => e.HorarioFechamento).HasColumnName("horario_fechamento").HasColumnType("time").IsRequired();
            entity.Property(e => e.Ativo).HasColumnName("ativo").HasDefaultValue(true).IsRequired();
            entity.Property(e => e.CriadoEm).HasColumnName("criado_em").HasColumnType("timestamptz").IsRequired();
            entity.Property(e => e.AtualizadoEm).HasColumnName("atualizado_em").HasColumnType("timestamptz").IsRequired();

            entity.HasIndex(e => e.DiaSemana).IsUnique();
        });

        // 9. AgendaBlock (bloqueios_agenda)
        modelBuilder.Entity<AgendaBlock>(entity =>
        {
            entity.ToTable("bloqueios_agenda");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.DataHoraInicio).HasColumnName("data_hora_inicio").HasColumnType("timestamptz").IsRequired();
            entity.Property(e => e.DataHoraFim).HasColumnName("data_hora_fim").HasColumnType("timestamptz").IsRequired();
            entity.Property(e => e.Motivo).HasColumnName("motivo").HasMaxLength(255).IsRequired();
            entity.Property(e => e.CriadoPorUsuarioId).HasColumnName("criado_por_usuario_id").IsRequired();
            entity.Property(e => e.Ativo).HasColumnName("ativo").HasDefaultValue(true).IsRequired();
            entity.Property(e => e.CriadoEm).HasColumnName("criado_em").HasColumnType("timestamptz").IsRequired();
            entity.Property(e => e.AtualizadoEm).HasColumnName("atualizado_em").HasColumnType("timestamptz").IsRequired();

            entity.HasOne(e => e.CriadoPorUsuario)
                  .WithMany()
                  .HasForeignKey(e => e.CriadoPorUsuarioId)
                  .OnDelete(DeleteBehavior.Restrict);
        });

        // 10. Appointment (agendamentos)
        modelBuilder.Entity<Appointment>(entity =>
        {
            entity.ToTable("agendamentos");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.ClienteId).HasColumnName("cliente_id").IsRequired();
            entity.Property(e => e.VeiculoId).HasColumnName("veiculo_id").IsRequired();
            entity.Property(e => e.EnderecoId).HasColumnName("endereco_id").IsRequired();
            entity.Property(e => e.PlanoId).HasColumnName("plano_id").IsRequired();
            entity.Property(e => e.AdicionalId).HasColumnName("adicional_id");

            // Snapshots
            entity.Property(e => e.ServicoNome).HasColumnName("servico_nome").HasMaxLength(100).IsRequired();
            entity.Property(e => e.AdicionalNome).HasColumnName("adicional_nome").HasMaxLength(100);
            entity.Property(e => e.ValorAdicional).HasColumnName("valor_adicional").HasColumnType("numeric(10,2)").HasDefaultValue(0).IsRequired();
            entity.Property(e => e.VeiculoCategoria).HasColumnName("veiculo_categoria").HasConversion<string>().HasMaxLength(20).IsRequired();
            entity.Property(e => e.VeiculoMarca).HasColumnName("veiculo_marca").HasMaxLength(50).IsRequired();
            entity.Property(e => e.VeiculoModelo).HasColumnName("veiculo_modelo").HasMaxLength(50).IsRequired();
            entity.Property(e => e.VeiculoPlaca).HasColumnName("veiculo_placa").HasMaxLength(10);
            entity.Property(e => e.EnderecoCompleto).HasColumnName("endereco_completo").IsRequired();
            entity.Property(e => e.ValorCobrado).HasColumnName("valor_cobrado").HasColumnType("numeric(10,2)").IsRequired();
            entity.Property(e => e.DuracaoMinutos).HasColumnName("duracao_minutos").IsRequired();
            entity.Property(e => e.BufferDeslocamentoMinutos).HasColumnName("buffer_deslocamento_minutos").HasDefaultValue(30).IsRequired();

            // Datas/Horas
            entity.Property(e => e.DataHoraInicio).HasColumnName("data_hora_inicio").HasColumnType("timestamptz").IsRequired();
            entity.Property(e => e.DataHoraFimServico).HasColumnName("data_hora_fim_servico").HasColumnType("timestamptz").IsRequired();
            entity.Property(e => e.DataHoraFimOcupacao).HasColumnName("data_hora_fim_ocupacao").HasColumnType("timestamptz").IsRequired();

            entity.Property(e => e.Status).HasColumnName("status").HasConversion<string>().HasMaxLength(20).IsRequired();
            entity.Property(e => e.Observacoes).HasColumnName("observacoes");
            entity.Property(e => e.MotivoCancelamento).HasColumnName("motivo_cancelamento");
            entity.Property(e => e.CanceladoPorUsuarioId).HasColumnName("cancelado_por_usuario_id");
            entity.Property(e => e.CanceladoEm).HasColumnName("cancelado_em").HasColumnType("timestamptz");

            entity.Property(e => e.Ativo).HasColumnName("ativo").HasDefaultValue(true).IsRequired();
            entity.Property(e => e.CriadoEm).HasColumnName("criado_em").HasColumnType("timestamptz").IsRequired();
            entity.Property(e => e.AtualizadoEm).HasColumnName("atualizado_em").HasColumnType("timestamptz").IsRequired();

            entity.HasOne(e => e.Cliente)
                  .WithMany(u => u.Agendamentos)
                  .HasForeignKey(e => e.ClienteId)
                  .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(e => e.Veiculo)
                  .WithMany(v => v.Agendamentos)
                  .HasForeignKey(e => e.VeiculoId)
                  .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(e => e.Endereco)
                  .WithMany(a => a.Agendamentos)
                  .HasForeignKey(e => e.EnderecoId)
                  .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(e => e.Plano)
                  .WithMany(p => p.Agendamentos)
                  .HasForeignKey(e => e.PlanoId)
                  .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(e => e.Adicional)
                  .WithMany()
                  .HasForeignKey(e => e.AdicionalId)
                  .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(e => e.CanceladoPorUsuario)
                  .WithMany()
                  .HasForeignKey(e => e.CanceladoPorUsuarioId)
                  .OnDelete(DeleteBehavior.SetNull);

            entity.HasIndex(e => e.ClienteId);
            entity.HasIndex(e => e.Status);
            entity.HasIndex(e => new { e.DataHoraInicio, e.DataHoraFimOcupacao });
        });

        // 11. AppointmentStatusHistory (historico_status_agendamento)
        modelBuilder.Entity<AppointmentStatusHistory>(entity =>
        {
            entity.ToTable("historico_status_agendamento");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.AgendamentoId).HasColumnName("agendamento_id").IsRequired();
            entity.Property(e => e.StatusAnterior).HasColumnName("status_anterior").HasConversion<string>().HasMaxLength(20);
            entity.Property(e => e.StatusNovo).HasColumnName("status_novo").HasConversion<string>().HasMaxLength(20).IsRequired();
            entity.Property(e => e.AlteradoPorUsuarioId).HasColumnName("alterado_por_usuario_id");
            entity.Property(e => e.Observacao).HasColumnName("observacao");
            entity.Property(e => e.CriadoEm).HasColumnName("criado_em").HasColumnType("timestamptz").IsRequired();

            entity.HasOne(e => e.Agendamento)
                  .WithMany(a => a.HistoricosStatus)
                  .HasForeignKey(e => e.AgendamentoId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.AlteradoPorUsuario)
                  .WithMany()
                  .HasForeignKey(e => e.AlteradoPorUsuarioId)
                  .OnDelete(DeleteBehavior.SetNull);
        });

        // 12. Payment (pagamentos)
        modelBuilder.Entity<Payment>(entity =>
        {
            entity.ToTable("pagamentos");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.AgendamentoId).HasColumnName("agendamento_id").IsRequired();
            entity.Property(e => e.Metodo).HasColumnName("metodo").HasConversion<string>().HasMaxLength(20).IsRequired();
            entity.Property(e => e.ValorOriginal).HasColumnName("valor_original").HasColumnType("numeric(10,2)").IsRequired();
            entity.Property(e => e.Desconto).HasColumnName("desconto").HasColumnType("numeric(10,2)").HasDefaultValue(0.00m).IsRequired();
            entity.Property(e => e.Acrescimo).HasColumnName("acrescimo").HasColumnType("numeric(10,2)").HasDefaultValue(0.00m).IsRequired();
            entity.Property(e => e.JustificativaAjuste).HasColumnName("justificativa_ajuste");
            entity.Property(e => e.ValorFinal).HasColumnName("valor_final").HasColumnType("numeric(10,2)").IsRequired();
            entity.Property(e => e.ValorRecebido).HasColumnName("valor_recebido").HasColumnType("numeric(10,2)").IsRequired();
            entity.Property(e => e.Troco).HasColumnName("troco").HasColumnType("numeric(10,2)").HasDefaultValue(0.00m).IsRequired();
            entity.Property(e => e.Observacao).HasColumnName("observacao");
            entity.Property(e => e.RegistradoPorUsuarioId).HasColumnName("registrado_por_usuario_id").IsRequired();
            entity.Property(e => e.PagoEm).HasColumnName("pago_em").HasColumnType("timestamptz").IsRequired();
            entity.Property(e => e.CriadoEm).HasColumnName("criado_em").HasColumnType("timestamptz").IsRequired();
            entity.Property(e => e.AtualizadoEm).HasColumnName("atualizado_em").HasColumnType("timestamptz").IsRequired();

            entity.HasOne(e => e.Agendamento)
                  .WithOne(a => a.Pagamento)
                  .HasForeignKey<Payment>(e => e.AgendamentoId)
                  .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(e => e.RegistradoPorUsuario)
                  .WithMany()
                  .HasForeignKey(e => e.RegistradoPorUsuarioId)
                  .OnDelete(DeleteBehavior.Restrict);

            entity.HasIndex(e => e.AgendamentoId).IsUnique();
        });
    }

    public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        var entries = ChangeTracker.Entries()
            .Where(e => e.State is EntityState.Added or EntityState.Modified);

        foreach (var entry in entries)
        {
            var propAtualizadoEm = entry.Properties.FirstOrDefault(p => p.Metadata.Name == "AtualizadoEm");
            if (propAtualizadoEm != null)
            {
                propAtualizadoEm.CurrentValue = DateTime.UtcNow;
            }

            if (entry.State == EntityState.Added)
            {
                var propCriadoEm = entry.Properties.FirstOrDefault(p => p.Metadata.Name == "CriadoEm");
                if (propCriadoEm != null && (propCriadoEm.CurrentValue == null || (DateTime)propCriadoEm.CurrentValue == default))
                {
                    propCriadoEm.CurrentValue = DateTime.UtcNow;
                }
            }
        }

        return base.SaveChangesAsync(cancellationToken);
    }
}
