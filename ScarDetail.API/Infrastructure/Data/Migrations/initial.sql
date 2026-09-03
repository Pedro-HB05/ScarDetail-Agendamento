CREATE TABLE IF NOT EXISTS "__EFMigrationsHistory" (
    "MigrationId" character varying(150) NOT NULL,
    "ProductVersion" character varying(32) NOT NULL,
    CONSTRAINT "PK___EFMigrationsHistory" PRIMARY KEY ("MigrationId")
);

START TRANSACTION;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260902195407_InitialCreate') THEN
    CREATE EXTENSION IF NOT EXISTS btree_gist;
    CREATE EXTENSION IF NOT EXISTS unaccent;
    CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260902195407_InitialCreate') THEN
    CREATE TABLE bairros_permitidos (
        id uuid NOT NULL,
        nome character varying(100) NOT NULL,
        nome_normalizado character varying(100) NOT NULL,
        cidade character varying(100) NOT NULL,
        uf character varying(2) NOT NULL,
        ativo boolean NOT NULL DEFAULT TRUE,
        criado_em timestamptz NOT NULL,
        atualizado_em timestamptz NOT NULL,
        CONSTRAINT "PK_bairros_permitidos" PRIMARY KEY (id)
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260902195407_InitialCreate') THEN
    CREATE TABLE horarios_funcionamento (
        id uuid NOT NULL,
        dia_semana integer NOT NULL,
        nome_dia character varying(20) NOT NULL,
        horario_abertura time NOT NULL,
        horario_fechamento time NOT NULL,
        ativo boolean NOT NULL DEFAULT TRUE,
        criado_em timestamptz NOT NULL,
        atualizado_em timestamptz NOT NULL,
        CONSTRAINT "PK_horarios_funcionamento" PRIMARY KEY (id)
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260902195407_InitialCreate') THEN
    CREATE TABLE planos (
        id uuid NOT NULL,
        nome character varying(100) NOT NULL,
        descricao text,
        duracao_minutos integer NOT NULL,
        preco_hatch numeric(10,2) NOT NULL,
        preco_sedan numeric(10,2) NOT NULL,
        preco_suv numeric(10,2) NOT NULL,
        preco_camionete numeric(10,2) NOT NULL,
        preco_wagon numeric(10,2) NOT NULL,
        ativo boolean NOT NULL DEFAULT TRUE,
        criado_em timestamptz NOT NULL,
        atualizado_em timestamptz NOT NULL,
        CONSTRAINT "PK_planos" PRIMARY KEY (id)
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260902195407_InitialCreate') THEN
    CREATE TABLE usuarios (
        id uuid NOT NULL,
        nome character varying(150) NOT NULL,
        email character varying(255) NOT NULL,
        senha_hash character varying(255) NOT NULL,
        telefone character varying(20) NOT NULL,
        role character varying(20) NOT NULL,
        ativo boolean NOT NULL DEFAULT TRUE,
        criado_em timestamptz NOT NULL,
        atualizado_em timestamptz NOT NULL,
        CONSTRAINT "PK_usuarios" PRIMARY KEY (id)
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260902195407_InitialCreate') THEN
    CREATE TABLE auditoria_planos (
        id uuid NOT NULL,
        plano_id uuid NOT NULL,
        usuario_id uuid,
        acao character varying(20) NOT NULL,
        dados_anteriores jsonb,
        dados_novos jsonb,
        criado_em timestamptz NOT NULL,
        CONSTRAINT "PK_auditoria_planos" PRIMARY KEY (id),
        CONSTRAINT "FK_auditoria_planos_planos_plano_id" FOREIGN KEY (plano_id) REFERENCES planos (id) ON DELETE CASCADE,
        CONSTRAINT "FK_auditoria_planos_usuarios_usuario_id" FOREIGN KEY (usuario_id) REFERENCES usuarios (id) ON DELETE SET NULL
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260902195407_InitialCreate') THEN
    CREATE TABLE bloqueios_agenda (
        id uuid NOT NULL,
        data_hora_inicio timestamptz NOT NULL,
        data_hora_fim timestamptz NOT NULL,
        motivo character varying(255) NOT NULL,
        criado_por_usuario_id uuid NOT NULL,
        ativo boolean NOT NULL DEFAULT TRUE,
        criado_em timestamptz NOT NULL,
        atualizado_em timestamptz NOT NULL,
        CONSTRAINT "PK_bloqueios_agenda" PRIMARY KEY (id),
        CONSTRAINT "FK_bloqueios_agenda_usuarios_criado_por_usuario_id" FOREIGN KEY (criado_por_usuario_id) REFERENCES usuarios (id) ON DELETE RESTRICT
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260902195407_InitialCreate') THEN
    CREATE TABLE enderecos (
        id uuid NOT NULL,
        usuario_id uuid NOT NULL,
        apelido character varying(50) NOT NULL,
        cep character varying(9) NOT NULL,
        logradouro character varying(150) NOT NULL,
        numero character varying(20) NOT NULL,
        complemento character varying(100),
        bairro character varying(100) NOT NULL,
        cidade character varying(100) NOT NULL,
        uf character varying(2) NOT NULL,
        ponto_referencia character varying(255),
        ativo boolean NOT NULL DEFAULT TRUE,
        criado_em timestamptz NOT NULL,
        atualizado_em timestamptz NOT NULL,
        CONSTRAINT "PK_enderecos" PRIMARY KEY (id),
        CONSTRAINT "FK_enderecos_usuarios_usuario_id" FOREIGN KEY (usuario_id) REFERENCES usuarios (id) ON DELETE RESTRICT
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260902195407_InitialCreate') THEN
    CREATE TABLE refresh_tokens (
        id uuid NOT NULL,
        usuario_id uuid NOT NULL,
        token character varying(500) NOT NULL,
        jwt_id character varying(255) NOT NULL,
        revogado boolean NOT NULL DEFAULT FALSE,
        data_expiracao timestamptz NOT NULL,
        criado_em timestamptz NOT NULL,
        substituido_por_token character varying(500),
        CONSTRAINT "PK_refresh_tokens" PRIMARY KEY (id),
        CONSTRAINT "FK_refresh_tokens_usuarios_usuario_id" FOREIGN KEY (usuario_id) REFERENCES usuarios (id) ON DELETE CASCADE
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260902195407_InitialCreate') THEN
    CREATE TABLE veiculos (
        id uuid NOT NULL,
        usuario_id uuid NOT NULL,
        categoria character varying(20) NOT NULL,
        marca character varying(50) NOT NULL,
        modelo character varying(50) NOT NULL,
        ano integer NOT NULL,
        placa character varying(10),
        cor character varying(30),
        ativo boolean NOT NULL DEFAULT TRUE,
        criado_em timestamptz NOT NULL,
        atualizado_em timestamptz NOT NULL,
        CONSTRAINT "PK_veiculos" PRIMARY KEY (id),
        CONSTRAINT "FK_veiculos_usuarios_usuario_id" FOREIGN KEY (usuario_id) REFERENCES usuarios (id) ON DELETE RESTRICT
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260902195407_InitialCreate') THEN
    CREATE TABLE agendamentos (
        id uuid NOT NULL,
        cliente_id uuid NOT NULL,
        veiculo_id uuid NOT NULL,
        endereco_id uuid NOT NULL,
        plano_id uuid NOT NULL,
        servico_nome character varying(100) NOT NULL,
        veiculo_categoria character varying(20) NOT NULL,
        veiculo_marca character varying(50) NOT NULL,
        veiculo_modelo character varying(50) NOT NULL,
        veiculo_placa character varying(10),
        endereco_completo text NOT NULL,
        valor_cobrado numeric(10,2) NOT NULL,
        duracao_minutos integer NOT NULL,
        buffer_deslocamento_minutos integer NOT NULL DEFAULT 30,
        data_hora_inicio timestamptz NOT NULL,
        data_hora_fim_servico timestamptz NOT NULL,
        data_hora_fim_ocupacao timestamptz NOT NULL,
        status character varying(20) NOT NULL,
        observacoes text,
        motivo_cancelamento text,
        cancelado_por_usuario_id uuid,
        cancelado_em timestamptz,
        ativo boolean NOT NULL DEFAULT TRUE,
        criado_em timestamptz NOT NULL,
        atualizado_em timestamptz NOT NULL,
        CONSTRAINT "PK_agendamentos" PRIMARY KEY (id),
        CONSTRAINT "FK_agendamentos_enderecos_endereco_id" FOREIGN KEY (endereco_id) REFERENCES enderecos (id) ON DELETE RESTRICT,
        CONSTRAINT "FK_agendamentos_planos_plano_id" FOREIGN KEY (plano_id) REFERENCES planos (id) ON DELETE RESTRICT,
        CONSTRAINT "FK_agendamentos_usuarios_cancelado_por_usuario_id" FOREIGN KEY (cancelado_por_usuario_id) REFERENCES usuarios (id) ON DELETE SET NULL,
        CONSTRAINT "FK_agendamentos_usuarios_cliente_id" FOREIGN KEY (cliente_id) REFERENCES usuarios (id) ON DELETE RESTRICT,
        CONSTRAINT "FK_agendamentos_veiculos_veiculo_id" FOREIGN KEY (veiculo_id) REFERENCES veiculos (id) ON DELETE RESTRICT
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260902195407_InitialCreate') THEN
    CREATE TABLE historico_status_agendamento (
        id uuid NOT NULL,
        agendamento_id uuid NOT NULL,
        status_anterior character varying(20),
        status_novo character varying(20) NOT NULL,
        alterado_por_usuario_id uuid,
        observacao text,
        criado_em timestamptz NOT NULL,
        CONSTRAINT "PK_historico_status_agendamento" PRIMARY KEY (id),
        CONSTRAINT "FK_historico_status_agendamento_agendamentos_agendamento_id" FOREIGN KEY (agendamento_id) REFERENCES agendamentos (id) ON DELETE CASCADE,
        CONSTRAINT "FK_historico_status_agendamento_usuarios_alterado_por_usuario_~" FOREIGN KEY (alterado_por_usuario_id) REFERENCES usuarios (id) ON DELETE SET NULL
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260902195407_InitialCreate') THEN
    CREATE TABLE pagamentos (
        id uuid NOT NULL,
        agendamento_id uuid NOT NULL,
        metodo character varying(20) NOT NULL,
        valor_original numeric(10,2) NOT NULL,
        desconto numeric(10,2) NOT NULL DEFAULT 0.0,
        acrescimo numeric(10,2) NOT NULL DEFAULT 0.0,
        justificativa_ajuste text,
        valor_final numeric(10,2) NOT NULL,
        valor_recebido numeric(10,2) NOT NULL,
        troco numeric(10,2) NOT NULL DEFAULT 0.0,
        observacao text,
        registrado_por_usuario_id uuid NOT NULL,
        pago_em timestamptz NOT NULL,
        criado_em timestamptz NOT NULL,
        atualizado_em timestamptz NOT NULL,
        CONSTRAINT "PK_pagamentos" PRIMARY KEY (id),
        CONSTRAINT "FK_pagamentos_agendamentos_agendamento_id" FOREIGN KEY (agendamento_id) REFERENCES agendamentos (id) ON DELETE RESTRICT,
        CONSTRAINT "FK_pagamentos_usuarios_registrado_por_usuario_id" FOREIGN KEY (registrado_por_usuario_id) REFERENCES usuarios (id) ON DELETE RESTRICT
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260902195407_InitialCreate') THEN
    CREATE INDEX "IX_agendamentos_cancelado_por_usuario_id" ON agendamentos (cancelado_por_usuario_id);
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260902195407_InitialCreate') THEN
    CREATE INDEX "IX_agendamentos_cliente_id" ON agendamentos (cliente_id);
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260902195407_InitialCreate') THEN
    CREATE INDEX "IX_agendamentos_data_hora_inicio_data_hora_fim_ocupacao" ON agendamentos (data_hora_inicio, data_hora_fim_ocupacao);
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260902195407_InitialCreate') THEN
    CREATE INDEX "IX_agendamentos_endereco_id" ON agendamentos (endereco_id);
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260902195407_InitialCreate') THEN
    CREATE INDEX "IX_agendamentos_plano_id" ON agendamentos (plano_id);
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260902195407_InitialCreate') THEN
    CREATE INDEX "IX_agendamentos_status" ON agendamentos (status);
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260902195407_InitialCreate') THEN
    CREATE INDEX "IX_agendamentos_veiculo_id" ON agendamentos (veiculo_id);
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260902195407_InitialCreate') THEN
    CREATE INDEX "IX_auditoria_planos_plano_id" ON auditoria_planos (plano_id);
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260902195407_InitialCreate') THEN
    CREATE INDEX "IX_auditoria_planos_usuario_id" ON auditoria_planos (usuario_id);
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260902195407_InitialCreate') THEN
    CREATE UNIQUE INDEX "IX_bairros_permitidos_nome_normalizado_cidade_uf" ON bairros_permitidos (nome_normalizado, cidade, uf);
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260902195407_InitialCreate') THEN
    CREATE INDEX "IX_bloqueios_agenda_criado_por_usuario_id" ON bloqueios_agenda (criado_por_usuario_id);
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260902195407_InitialCreate') THEN
    CREATE INDEX "IX_enderecos_usuario_id" ON enderecos (usuario_id);
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260902195407_InitialCreate') THEN
    CREATE INDEX "IX_historico_status_agendamento_agendamento_id" ON historico_status_agendamento (agendamento_id);
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260902195407_InitialCreate') THEN
    CREATE INDEX "IX_historico_status_agendamento_alterado_por_usuario_id" ON historico_status_agendamento (alterado_por_usuario_id);
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260902195407_InitialCreate') THEN
    CREATE UNIQUE INDEX "IX_horarios_funcionamento_dia_semana" ON horarios_funcionamento (dia_semana);
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260902195407_InitialCreate') THEN
    CREATE UNIQUE INDEX "IX_pagamentos_agendamento_id" ON pagamentos (agendamento_id);
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260902195407_InitialCreate') THEN
    CREATE INDEX "IX_pagamentos_registrado_por_usuario_id" ON pagamentos (registrado_por_usuario_id);
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260902195407_InitialCreate') THEN
    CREATE INDEX "IX_refresh_tokens_usuario_id" ON refresh_tokens (usuario_id);
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260902195407_InitialCreate') THEN
    CREATE UNIQUE INDEX "IX_usuarios_email" ON usuarios (email);
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260902195407_InitialCreate') THEN
    CREATE INDEX "IX_veiculos_usuario_id" ON veiculos (usuario_id);
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260902195407_InitialCreate') THEN
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
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260902195407_InitialCreate') THEN
    INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
    VALUES ('20260902195407_InitialCreate', '10.0.4');
    END IF;
END $EF$;
COMMIT;

