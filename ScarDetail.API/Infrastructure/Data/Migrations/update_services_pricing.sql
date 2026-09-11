-- ==============================================================================
-- Migration: Sincronização de Serviços e Tabela de Preços com a Landing Page
-- Sistema: ScarDetail
-- ==============================================================================

BEGIN;

-- 1. Atualizar "Somente Limpeza Externa" (mantém histórico/FKs de agendamentos)
UPDATE planos
SET
    nome = 'Somente Limpeza Externa',
    descricao = 'Pré-lavagem técnica, lavagem da carroceria com shampoo de pH neutro e luvas de microfibra, limpeza superficial de rodas e acabamento nos pneus. Tempo estimado: "1h".',
    duracao_minutos = 60,
    preco_hatch = 45.00,
    preco_sedan = 55.00,
    preco_suv = 65.00,
    preco_camionete = 80.00,
    preco_wagon = 55.00,
    ativo = TRUE,
    atualizado_em = NOW()
WHERE LOWER(nome) IN ('somente lavagem externa', 'somente limpeza externa', 'limpeza externa', 'lavagem externa');

-- Se não existia, insere
INSERT INTO planos (id, nome, descricao, duracao_minutos, preco_hatch, preco_sedan, preco_suv, preco_camionete, preco_wagon, ativo, criado_em, atualizado_em)
SELECT
    gen_random_uuid(),
    'Somente Limpeza Externa',
    'Pré-lavagem técnica, lavagem da carroceria com shampoo de pH neutro e luvas de microfibra, limpeza superficial de rodas e acabamento nos pneus. Tempo estimado: "1h".',
    60, 45.00, 55.00, 65.00, 80.00, 55.00, TRUE, NOW(), NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM planos WHERE LOWER(nome) IN ('somente lavagem externa', 'somente limpeza externa', 'limpeza externa', 'lavagem externa')
);

-- 2. Atualizar "Somente Limpeza Interna"
UPDATE planos
SET
    nome = 'Somente Limpeza Interna',
    descricao = 'Aspiração completa de carpetes, tapetes, bancos e porta-malas, higienização de painel, volante, console central e portas, e limpeza dos vidros internos. Tempo estimado: "1h".',
    duracao_minutos = 60,
    preco_hatch = 45.00,
    preco_sedan = 55.00,
    preco_suv = 65.00,
    preco_camionete = 80.00,
    preco_wagon = 55.00,
    ativo = TRUE,
    atualizado_em = NOW()
WHERE LOWER(nome) IN ('somente limpeza interna', 'limpeza interna');

INSERT INTO planos (id, nome, descricao, duracao_minutos, preco_hatch, preco_sedan, preco_suv, preco_camionete, preco_wagon, ativo, criado_em, atualizado_em)
SELECT
    gen_random_uuid(),
    'Somente Limpeza Interna',
    'Aspiração completa de carpetes, tapetes, bancos e porta-malas, higienização de painel, volante, console central e portas, e limpeza dos vidros internos. Tempo estimado: "1h".',
    60, 45.00, 55.00, 65.00, 80.00, 55.00, TRUE, NOW(), NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM planos WHERE LOWER(nome) IN ('somente limpeza interna', 'limpeza interna')
);

-- 3. Atualizar "Lavagem Completa (Sem Cera)"
UPDATE planos
SET
    nome = 'Lavagem Completa (Sem Cera)',
    descricao = 'União de cuidado interno e externo: pré-lavagem, lavagem técnica, rodas e pneus, secagem, aspiração interna, higienização de superfícies e vidros internos/externos. Tempo estimado: "1h30".',
    duracao_minutos = 90,
    preco_hatch = 60.00,
    preco_sedan = 80.00,
    preco_suv = 90.00,
    preco_camionete = 120.00,
    preco_wagon = 80.00,
    ativo = TRUE,
    atualizado_em = NOW()
WHERE LOWER(nome) IN ('lavagem completa (sem cera)', 'lavagem completa — sem cera', 'lavagem completa sem cera', 'completa sem cera');

INSERT INTO planos (id, nome, descricao, duracao_minutos, preco_hatch, preco_sedan, preco_suv, preco_camionete, preco_wagon, ativo, criado_em, atualizado_em)
SELECT
    gen_random_uuid(),
    'Lavagem Completa (Sem Cera)',
    'União de cuidado interno e externo: pré-lavagem, lavagem técnica, rodas e pneus, secagem, aspiração interna, higienização de superfícies e vidros internos/externos. Tempo estimado: "1h30".',
    90, 60.00, 80.00, 90.00, 120.00, 80.00, TRUE, NOW(), NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM planos WHERE LOWER(nome) IN ('lavagem completa (sem cera)', 'lavagem completa — sem cera', 'lavagem completa sem cera', 'completa sem cera')
);

-- 4. Atualizar "Lavagem Completa (Com Cera)"
UPDATE planos
SET
    nome = 'Lavagem Completa (Com Cera)',
    descricao = 'Todo o cuidado da Lavagem Completa Sem Cera com aplicação manual de cera automotiva para brilho profundo, toque suave e proteção UV. Tempo estimado: "2h".',
    duracao_minutos = 120,
    preco_hatch = 80.00,
    preco_sedan = 100.00,
    preco_suv = 120.00,
    preco_camionete = 150.00,
    preco_wagon = 100.00,
    ativo = TRUE,
    atualizado_em = NOW()
WHERE LOWER(nome) IN ('lavagem completa (com cera)', 'lavagem completa — com cera', 'lavagem completa com cera', 'completa com cera');

INSERT INTO planos (id, nome, descricao, duracao_minutos, preco_hatch, preco_sedan, preco_suv, preco_camionete, preco_wagon, ativo, criado_em, atualizado_em)
SELECT
    gen_random_uuid(),
    'Lavagem Completa (Com Cera)',
    'Todo o cuidado da Lavagem Completa Sem Cera com aplicação manual de cera automotiva para brilho profundo, toque suave e proteção UV. Tempo estimado: "2h".',
    120, 80.00, 100.00, 120.00, 150.00, 100.00, TRUE, NOW(), NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM planos WHERE LOWER(nome) IN ('lavagem completa (com cera)', 'lavagem completa — com cera', 'lavagem completa com cera', 'completa com cera')
);

-- 5. Atualizar/Inserir "Lavagem Detalhada (Técnica)"
UPDATE planos
SET
    nome = 'Lavagem Detalhada (Técnica)',
    descricao = 'Detalhamento técnico de alto padrão: limpeza profunda de rodas e caixas de roda com pincéis, detalhamento externo de frestas e emblemas, renovação de plásticos, detalhamento minucioso da cabine e acabamento premium. Tempo estimado: "3h".',
    duracao_minutos = 180,
    preco_hatch = 160.00,
    preco_sedan = 190.00,
    preco_suv = 230.00,
    preco_camionete = 280.00,
    preco_wagon = 190.00,
    ativo = TRUE,
    atualizado_em = NOW()
WHERE LOWER(nome) IN ('lavagem detalhada (tecnica)', 'lavagem detalhada — lavagem tecnica de alto padrao', 'lavagem detalhada tecnica', 'lavagem detalhada');

INSERT INTO planos (id, nome, descricao, duracao_minutos, preco_hatch, preco_sedan, preco_suv, preco_camionete, preco_wagon, ativo, criado_em, atualizado_em)
SELECT
    gen_random_uuid(),
    'Lavagem Detalhada (Técnica)',
    'Detalhamento técnico de alto padrão: limpeza profunda de rodas e caixas de roda com pincéis, detalhamento externo de frestas e emblemas, renovação de plásticos, detalhamento minucioso da cabine e acabamento premium. Tempo estimado: "3h".',
    180, 160.00, 190.00, 230.00, 280.00, 190.00, TRUE, NOW(), NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM planos WHERE LOWER(nome) IN ('lavagem detalhada (tecnica)', 'lavagem detalhada — lavagem tecnica de alto padrao', 'lavagem detalhada tecnica', 'lavagem detalhada')
);

-- 6. Atualizar/Inserir "Lavagem de Motor (Adicional)"
UPDATE planos
SET
    nome = 'Lavagem de Motor (Adicional)',
    descricao = 'Limpeza técnica e minuciosa do cofre do motor com produtos específicos, remoção segura de resíduos e condicionamento com proteção térmica dos componentes plásticos e borrachas. Tempo estimado: "1h".',
    duracao_minutos = 60,
    preco_hatch = 50.00,
    preco_sedan = 50.00,
    preco_suv = 65.00,
    preco_camionete = 80.00,
    preco_wagon = 50.00,
    ativo = TRUE,
    atualizado_em = NOW()
WHERE LOWER(nome) IN ('lavagem de motor (adicional)', 'lavagem de motor adicional', 'lavagem de motor');

INSERT INTO planos (id, nome, descricao, duracao_minutos, preco_hatch, preco_sedan, preco_suv, preco_camionete, preco_wagon, ativo, criado_em, atualizado_em)
SELECT
    gen_random_uuid(),
    'Lavagem de Motor (Adicional)',
    'Limpeza técnica e minuciosa do cofre do motor com produtos específicos, remoção segura de resíduos e condicionamento com proteção térmica dos componentes plásticos e borrachas. Tempo estimado: "1h".',
    60, 50.00, 50.00, 65.00, 80.00, 50.00, TRUE, NOW(), NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM planos WHERE LOWER(nome) IN ('lavagem de motor (adicional)', 'lavagem de motor adicional', 'lavagem de motor')
);

COMMIT;
