using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ScarDetail.API.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterDatabase()
                .Annotation("Npgsql:PostgresExtension:btree_gist", ",,")
                .Annotation("Npgsql:PostgresExtension:unaccent", ",,")
                .Annotation("Npgsql:PostgresExtension:uuid-ossp", ",,");

            migrationBuilder.CreateTable(
                name: "bairros_permitidos",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    nome = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    nome_normalizado = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    cidade = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    uf = table.Column<string>(type: "character varying(2)", maxLength: 2, nullable: false),
                    ativo = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    criado_em = table.Column<DateTime>(type: "timestamptz", nullable: false),
                    atualizado_em = table.Column<DateTime>(type: "timestamptz", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_bairros_permitidos", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "horarios_funcionamento",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    dia_semana = table.Column<int>(type: "integer", nullable: false),
                    nome_dia = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    horario_abertura = table.Column<TimeOnly>(type: "time", nullable: false),
                    horario_fechamento = table.Column<TimeOnly>(type: "time", nullable: false),
                    ativo = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    criado_em = table.Column<DateTime>(type: "timestamptz", nullable: false),
                    atualizado_em = table.Column<DateTime>(type: "timestamptz", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_horarios_funcionamento", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "planos",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    nome = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    descricao = table.Column<string>(type: "text", nullable: true),
                    duracao_minutos = table.Column<int>(type: "integer", nullable: false),
                    preco_hatch = table.Column<decimal>(type: "numeric(10,2)", nullable: false),
                    preco_sedan = table.Column<decimal>(type: "numeric(10,2)", nullable: false),
                    preco_suv = table.Column<decimal>(type: "numeric(10,2)", nullable: false),
                    preco_camionete = table.Column<decimal>(type: "numeric(10,2)", nullable: false),
                    preco_wagon = table.Column<decimal>(type: "numeric(10,2)", nullable: false),
                    ativo = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    criado_em = table.Column<DateTime>(type: "timestamptz", nullable: false),
                    atualizado_em = table.Column<DateTime>(type: "timestamptz", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_planos", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "usuarios",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    nome = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: false),
                    email = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    senha_hash = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    telefone = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    role = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    ativo = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    criado_em = table.Column<DateTime>(type: "timestamptz", nullable: false),
                    atualizado_em = table.Column<DateTime>(type: "timestamptz", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_usuarios", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "auditoria_planos",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    plano_id = table.Column<Guid>(type: "uuid", nullable: false),
                    usuario_id = table.Column<Guid>(type: "uuid", nullable: true),
                    acao = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    dados_anteriores = table.Column<string>(type: "jsonb", nullable: true),
                    dados_novos = table.Column<string>(type: "jsonb", nullable: true),
                    criado_em = table.Column<DateTime>(type: "timestamptz", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_auditoria_planos", x => x.id);
                    table.ForeignKey(
                        name: "FK_auditoria_planos_planos_plano_id",
                        column: x => x.plano_id,
                        principalTable: "planos",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_auditoria_planos_usuarios_usuario_id",
                        column: x => x.usuario_id,
                        principalTable: "usuarios",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "bloqueios_agenda",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    data_hora_inicio = table.Column<DateTime>(type: "timestamptz", nullable: false),
                    data_hora_fim = table.Column<DateTime>(type: "timestamptz", nullable: false),
                    motivo = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    criado_por_usuario_id = table.Column<Guid>(type: "uuid", nullable: false),
                    ativo = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    criado_em = table.Column<DateTime>(type: "timestamptz", nullable: false),
                    atualizado_em = table.Column<DateTime>(type: "timestamptz", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_bloqueios_agenda", x => x.id);
                    table.ForeignKey(
                        name: "FK_bloqueios_agenda_usuarios_criado_por_usuario_id",
                        column: x => x.criado_por_usuario_id,
                        principalTable: "usuarios",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "enderecos",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    usuario_id = table.Column<Guid>(type: "uuid", nullable: false),
                    apelido = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    cep = table.Column<string>(type: "character varying(9)", maxLength: 9, nullable: false),
                    logradouro = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: false),
                    numero = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    complemento = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    bairro = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    cidade = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    uf = table.Column<string>(type: "character varying(2)", maxLength: 2, nullable: false),
                    ponto_referencia = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    ativo = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    criado_em = table.Column<DateTime>(type: "timestamptz", nullable: false),
                    atualizado_em = table.Column<DateTime>(type: "timestamptz", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_enderecos", x => x.id);
                    table.ForeignKey(
                        name: "FK_enderecos_usuarios_usuario_id",
                        column: x => x.usuario_id,
                        principalTable: "usuarios",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "refresh_tokens",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    usuario_id = table.Column<Guid>(type: "uuid", nullable: false),
                    token = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    jwt_id = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    revogado = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    data_expiracao = table.Column<DateTime>(type: "timestamptz", nullable: false),
                    criado_em = table.Column<DateTime>(type: "timestamptz", nullable: false),
                    substituido_por_token = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_refresh_tokens", x => x.id);
                    table.ForeignKey(
                        name: "FK_refresh_tokens_usuarios_usuario_id",
                        column: x => x.usuario_id,
                        principalTable: "usuarios",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "veiculos",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    usuario_id = table.Column<Guid>(type: "uuid", nullable: false),
                    categoria = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    marca = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    modelo = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    ano = table.Column<int>(type: "integer", nullable: false),
                    placa = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: true),
                    cor = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: true),
                    ativo = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    criado_em = table.Column<DateTime>(type: "timestamptz", nullable: false),
                    atualizado_em = table.Column<DateTime>(type: "timestamptz", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_veiculos", x => x.id);
                    table.ForeignKey(
                        name: "FK_veiculos_usuarios_usuario_id",
                        column: x => x.usuario_id,
                        principalTable: "usuarios",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "agendamentos",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    cliente_id = table.Column<Guid>(type: "uuid", nullable: false),
                    veiculo_id = table.Column<Guid>(type: "uuid", nullable: false),
                    endereco_id = table.Column<Guid>(type: "uuid", nullable: false),
                    plano_id = table.Column<Guid>(type: "uuid", nullable: false),
                    servico_nome = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    veiculo_categoria = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    veiculo_marca = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    veiculo_modelo = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    veiculo_placa = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: true),
                    endereco_completo = table.Column<string>(type: "text", nullable: false),
                    valor_cobrado = table.Column<decimal>(type: "numeric(10,2)", nullable: false),
                    duracao_minutos = table.Column<int>(type: "integer", nullable: false),
                    buffer_deslocamento_minutos = table.Column<int>(type: "integer", nullable: false, defaultValue: 30),
                    data_hora_inicio = table.Column<DateTime>(type: "timestamptz", nullable: false),
                    data_hora_fim_servico = table.Column<DateTime>(type: "timestamptz", nullable: false),
                    data_hora_fim_ocupacao = table.Column<DateTime>(type: "timestamptz", nullable: false),
                    status = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    observacoes = table.Column<string>(type: "text", nullable: true),
                    motivo_cancelamento = table.Column<string>(type: "text", nullable: true),
                    cancelado_por_usuario_id = table.Column<Guid>(type: "uuid", nullable: true),
                    cancelado_em = table.Column<DateTime>(type: "timestamptz", nullable: true),
                    ativo = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    criado_em = table.Column<DateTime>(type: "timestamptz", nullable: false),
                    atualizado_em = table.Column<DateTime>(type: "timestamptz", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_agendamentos", x => x.id);
                    table.ForeignKey(
                        name: "FK_agendamentos_enderecos_endereco_id",
                        column: x => x.endereco_id,
                        principalTable: "enderecos",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_agendamentos_planos_plano_id",
                        column: x => x.plano_id,
                        principalTable: "planos",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_agendamentos_usuarios_cancelado_por_usuario_id",
                        column: x => x.cancelado_por_usuario_id,
                        principalTable: "usuarios",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_agendamentos_usuarios_cliente_id",
                        column: x => x.cliente_id,
                        principalTable: "usuarios",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_agendamentos_veiculos_veiculo_id",
                        column: x => x.veiculo_id,
                        principalTable: "veiculos",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "historico_status_agendamento",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    agendamento_id = table.Column<Guid>(type: "uuid", nullable: false),
                    status_anterior = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                    status_novo = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    alterado_por_usuario_id = table.Column<Guid>(type: "uuid", nullable: true),
                    observacao = table.Column<string>(type: "text", nullable: true),
                    criado_em = table.Column<DateTime>(type: "timestamptz", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_historico_status_agendamento", x => x.id);
                    table.ForeignKey(
                        name: "FK_historico_status_agendamento_agendamentos_agendamento_id",
                        column: x => x.agendamento_id,
                        principalTable: "agendamentos",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_historico_status_agendamento_usuarios_alterado_por_usuario_~",
                        column: x => x.alterado_por_usuario_id,
                        principalTable: "usuarios",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "pagamentos",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    agendamento_id = table.Column<Guid>(type: "uuid", nullable: false),
                    metodo = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    valor_original = table.Column<decimal>(type: "numeric(10,2)", nullable: false),
                    desconto = table.Column<decimal>(type: "numeric(10,2)", nullable: false, defaultValue: 0.00m),
                    acrescimo = table.Column<decimal>(type: "numeric(10,2)", nullable: false, defaultValue: 0.00m),
                    justificativa_ajuste = table.Column<string>(type: "text", nullable: true),
                    valor_final = table.Column<decimal>(type: "numeric(10,2)", nullable: false),
                    valor_recebido = table.Column<decimal>(type: "numeric(10,2)", nullable: false),
                    troco = table.Column<decimal>(type: "numeric(10,2)", nullable: false, defaultValue: 0.00m),
                    observacao = table.Column<string>(type: "text", nullable: true),
                    registrado_por_usuario_id = table.Column<Guid>(type: "uuid", nullable: false),
                    pago_em = table.Column<DateTime>(type: "timestamptz", nullable: false),
                    criado_em = table.Column<DateTime>(type: "timestamptz", nullable: false),
                    atualizado_em = table.Column<DateTime>(type: "timestamptz", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_pagamentos", x => x.id);
                    table.ForeignKey(
                        name: "FK_pagamentos_agendamentos_agendamento_id",
                        column: x => x.agendamento_id,
                        principalTable: "agendamentos",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_pagamentos_usuarios_registrado_por_usuario_id",
                        column: x => x.registrado_por_usuario_id,
                        principalTable: "usuarios",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_agendamentos_cancelado_por_usuario_id",
                table: "agendamentos",
                column: "cancelado_por_usuario_id");

            migrationBuilder.CreateIndex(
                name: "IX_agendamentos_cliente_id",
                table: "agendamentos",
                column: "cliente_id");

            migrationBuilder.CreateIndex(
                name: "IX_agendamentos_data_hora_inicio_data_hora_fim_ocupacao",
                table: "agendamentos",
                columns: new[] { "data_hora_inicio", "data_hora_fim_ocupacao" });

            migrationBuilder.CreateIndex(
                name: "IX_agendamentos_endereco_id",
                table: "agendamentos",
                column: "endereco_id");

            migrationBuilder.CreateIndex(
                name: "IX_agendamentos_plano_id",
                table: "agendamentos",
                column: "plano_id");

            migrationBuilder.CreateIndex(
                name: "IX_agendamentos_status",
                table: "agendamentos",
                column: "status");

            migrationBuilder.CreateIndex(
                name: "IX_agendamentos_veiculo_id",
                table: "agendamentos",
                column: "veiculo_id");

            migrationBuilder.CreateIndex(
                name: "IX_auditoria_planos_plano_id",
                table: "auditoria_planos",
                column: "plano_id");

            migrationBuilder.CreateIndex(
                name: "IX_auditoria_planos_usuario_id",
                table: "auditoria_planos",
                column: "usuario_id");

            migrationBuilder.CreateIndex(
                name: "IX_bairros_permitidos_nome_normalizado_cidade_uf",
                table: "bairros_permitidos",
                columns: new[] { "nome_normalizado", "cidade", "uf" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_bloqueios_agenda_criado_por_usuario_id",
                table: "bloqueios_agenda",
                column: "criado_por_usuario_id");

            migrationBuilder.CreateIndex(
                name: "IX_enderecos_usuario_id",
                table: "enderecos",
                column: "usuario_id");

            migrationBuilder.CreateIndex(
                name: "IX_historico_status_agendamento_agendamento_id",
                table: "historico_status_agendamento",
                column: "agendamento_id");

            migrationBuilder.CreateIndex(
                name: "IX_historico_status_agendamento_alterado_por_usuario_id",
                table: "historico_status_agendamento",
                column: "alterado_por_usuario_id");

            migrationBuilder.CreateIndex(
                name: "IX_horarios_funcionamento_dia_semana",
                table: "horarios_funcionamento",
                column: "dia_semana",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_pagamentos_agendamento_id",
                table: "pagamentos",
                column: "agendamento_id",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_pagamentos_registrado_por_usuario_id",
                table: "pagamentos",
                column: "registrado_por_usuario_id");

            migrationBuilder.CreateIndex(
                name: "IX_refresh_tokens_usuario_id",
                table: "refresh_tokens",
                column: "usuario_id");

            migrationBuilder.CreateIndex(
                name: "IX_usuarios_email",
                table: "usuarios",
                column: "email",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_veiculos_usuario_id",
                table: "veiculos",
                column: "usuario_id");

            migrationBuilder.Sql("""
                ALTER TABLE usuarios
                    ADD CONSTRAINT ck_usuarios_email_normalizado CHECK (email = lower(btrim(email)));

                ALTER TABLE planos
                    ADD CONSTRAINT ck_planos_duracao_positiva CHECK (duracao_minutos > 0),
                    ADD CONSTRAINT ck_planos_precos_nao_negativos CHECK (
                        preco_hatch >= 0 AND preco_sedan >= 0 AND preco_suv >= 0 AND
                        preco_camionete >= 0 AND preco_wagon >= 0);

                ALTER TABLE horarios_funcionamento
                    ADD CONSTRAINT ck_horarios_intervalo_valido
                    CHECK (dia_semana BETWEEN 0 AND 6 AND horario_abertura < horario_fechamento);

                ALTER TABLE bloqueios_agenda
                    ADD CONSTRAINT ck_bloqueios_intervalo_valido CHECK (data_hora_inicio < data_hora_fim);

                ALTER TABLE agendamentos
                    ADD CONSTRAINT ck_agendamentos_intervalo_valido CHECK (
                        data_hora_inicio < data_hora_fim_servico AND
                        data_hora_fim_servico <= data_hora_fim_ocupacao AND
                        duracao_minutos > 0 AND buffer_deslocamento_minutos >= 0 AND valor_cobrado >= 0),
                    ADD CONSTRAINT ex_agendamentos_sem_sobreposicao
                    EXCLUDE USING gist (tstzrange(data_hora_inicio, data_hora_fim_ocupacao, '[)') WITH &&)
                    WHERE (ativo AND status IN ('Pendente', 'Confirmado', 'ACaminho', 'EmExecucao'));

                ALTER TABLE pagamentos
                    ADD CONSTRAINT ck_pagamentos_valores_validos CHECK (
                        valor_original >= 0 AND desconto >= 0 AND acrescimo >= 0 AND
                        valor_final >= 0 AND valor_recebido >= valor_final AND troco >= 0);

                CREATE UNIQUE INDEX ux_refresh_tokens_token ON refresh_tokens (token);
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "auditoria_planos");

            migrationBuilder.DropTable(
                name: "bairros_permitidos");

            migrationBuilder.DropTable(
                name: "bloqueios_agenda");

            migrationBuilder.DropTable(
                name: "historico_status_agendamento");

            migrationBuilder.DropTable(
                name: "horarios_funcionamento");

            migrationBuilder.DropTable(
                name: "pagamentos");

            migrationBuilder.DropTable(
                name: "refresh_tokens");

            migrationBuilder.DropTable(
                name: "agendamentos");

            migrationBuilder.DropTable(
                name: "enderecos");

            migrationBuilder.DropTable(
                name: "planos");

            migrationBuilder.DropTable(
                name: "veiculos");

            migrationBuilder.DropTable(
                name: "usuarios");
        }
    }
}
