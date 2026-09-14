using Microsoft.EntityFrameworkCore;
using ScarDetail.API.Application.Common.Utilities;
using ScarDetail.API.Domain.Entities;

namespace ScarDetail.API.Infrastructure.Data;

public static class DbInitializer
{
    private static readonly string[] DayNames =
        ["Domingo", "Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado"];

    private static readonly string[] CuritibaNeighborhoods =
    [
        "Abranches", "Água Verde", "Ahú", "Alto Boqueirão", "Alto da Glória", "Alto da Rua XV",
        "Atuba", "Augusta", "Bacacheri", "Bairro Alto", "Barreirinha", "Batel", "Bigorrilho",
        "Boa Vista", "Bom Retiro", "Boqueirão", "Butiatuvinha", "Cabral", "Cachoeira", "Cajuru",
        "Campina do Siqueira", "Campo Comprido", "Campo de Santana", "Capão da Imbuia", "Capão Raso",
        "Cascatinha", "Caximba", "Centro", "Centro Cívico", "Cidade Industrial de Curitiba", "Cristo Rei",
        "Fanny", "Fazendinha", "Ganchinho", "Guabirotuba", "Guaíra", "Hauer", "Hugo Lange",
        "Jardim Botânico", "Jardim das Américas", "Jardim Social", "Juvevê", "Lamenha Pequena", "Lindóia",
        "Mercês", "Mossunguê", "Novo Mundo", "Orleans", "Parolin", "Pilarzinho", "Pinheirinho", "Portão",
        "Prado Velho", "Rebouças", "Riviera", "Santa Cândida", "Santa Felicidade", "Santa Quitéria",
        "Santo Inácio", "São Braz", "São Francisco", "São João", "São Lourenço", "São Miguel", "Seminário",
        "Sítio Cercado", "Taboão", "Tarumã", "Tatuquara", "Tingui", "Umbará", "Uberaba", "Vila Izabel",
        "Vista Alegre", "Xaxim"
    ];

    public static async Task SeedReferenceDataAsync(
        AppDbContext context,
        ILogger logger,
        CancellationToken cancellationToken = default)
    {
        logger.LogInformation("Aplicando dados de referência da ScarDetail");

        if (!await context.HorariosFuncionamento.AnyAsync(cancellationToken))
        {
            context.HorariosFuncionamento.AddRange(
                Enumerable.Range(0, 7).Select(day => new BusinessHour
                {
                    DiaSemana = day,
                    NomeDia = DayNames[day],
                    HorarioAbertura = new TimeOnly(8, 0),
                    HorarioFechamento = new TimeOnly(18, 0),
                    Ativo = true
                }));
        }

        await EnsureSchemaCompatibilityAsync(context, logger, cancellationToken);

        await EnsurePlansCoverageAsync(context, logger, cancellationToken);

        await EnsureCuritibaCoverageAsync(context, logger, cancellationToken);

        await context.SaveChangesAsync(cancellationToken);
        logger.LogInformation("Dados de referência aplicados com sucesso");
    }

    private static async Task EnsureSchemaCompatibilityAsync(
        AppDbContext context,
        ILogger logger,
        CancellationToken cancellationToken)
    {
        try
        {
            await context.Database.ExecuteSqlRawAsync(@"
                ALTER TABLE planos ADD COLUMN IF NOT EXISTS eh_adicional boolean NOT NULL DEFAULT FALSE;
                ALTER TABLE agendamentos ADD COLUMN IF NOT EXISTS adicional_id uuid NULL;
                ALTER TABLE agendamentos ADD COLUMN IF NOT EXISTS adicional_nome character varying(100) NULL;
                ALTER TABLE agendamentos ADD COLUMN IF NOT EXISTS valor_adicional numeric(10,2) NOT NULL DEFAULT 0;
                ALTER TABLE agendamentos ALTER COLUMN buffer_deslocamento_minutos SET DEFAULT 0;
                UPDATE agendamentos SET buffer_deslocamento_minutos = 0, data_hora_fim_ocupacao = data_hora_fim_servico WHERE buffer_deslocamento_minutos > 0;
            ", cancellationToken);
            logger.LogInformation("Compatibilidade de schema verificada (colunas de adicionais e buffer 0 garantidos).");
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Aviso ao verificar compatibilidade de colunas no banco de dados.");
        }
    }

    private static async Task EnsurePlansCoverageAsync(
        AppDbContext context,
        ILogger logger,
        CancellationToken cancellationToken)
    {
        var existingPlans = await context.Planos.ToListAsync(cancellationToken);
        var expectedPlans = ExpectedSeedPlans();

        foreach (var expected in expectedPlans)
        {
            var normalizedExpected = StringNormalizer.NormalizeText(expected.Nome);
            var normalizedAliases = expected.Aliases.Select(StringNormalizer.NormalizeText).ToHashSet(StringComparer.Ordinal);

            var matchingPlans = existingPlans.Where(p =>
            {
                var normalizedCurrent = StringNormalizer.NormalizeText(p.Nome);
                return normalizedCurrent == normalizedExpected || normalizedAliases.Contains(normalizedCurrent);
            }).ToList();

            if (matchingPlans.Count > 0)
            {
                var primary = matchingPlans.FirstOrDefault(p => StringNormalizer.NormalizeText(p.Nome) == normalizedExpected)
                              ?? matchingPlans.First();

                primary.Nome = expected.Nome;
                primary.Descricao = expected.Descricao;
                primary.DuracaoMinutos = expected.DuracaoMinutos;
                primary.PrecoHatch = expected.PrecoHatch;
                primary.PrecoSedan = expected.PrecoSedan;
                primary.PrecoSuv = expected.PrecoSuv;
                primary.PrecoCamionete = expected.PrecoCamionete;
                primary.PrecoWagon = expected.PrecoWagon;
                primary.EhAdicional = expected.EhAdicional;
                // Preserva o status Ativo definido pelo administrador
                primary.AtualizadoEm = DateTime.UtcNow;

                // Tratar duplicados: desativa (soft-delete) para não violar triggers de auditoria (auditoria_planos)
                var duplicates = matchingPlans.Where(p => p.Id != primary.Id).ToList();
                foreach (var dup in duplicates)
                {
                    dup.Ativo = false;
                    dup.AtualizadoEm = DateTime.UtcNow;
                }
            }
            else
            {
                var newPlan = new ServicePlan
                {
                    Nome = expected.Nome,
                    Descricao = expected.Descricao,
                    DuracaoMinutos = expected.DuracaoMinutos,
                    PrecoHatch = expected.PrecoHatch,
                    PrecoSedan = expected.PrecoSedan,
                    PrecoSuv = expected.PrecoSuv,
                    PrecoCamionete = expected.PrecoCamionete,
                    PrecoWagon = expected.PrecoWagon,
                    EhAdicional = expected.EhAdicional,
                    Ativo = true,
                    CriadoEm = DateTime.UtcNow,
                    AtualizadoEm = DateTime.UtcNow
                };
                context.Planos.Add(newPlan);
                existingPlans.Add(newPlan);
            }
        }

        logger.LogInformation("Planos de serviço sincronizados e duplicidades saneadas com sucesso.");
    }

    private static async Task EnsureCuritibaCoverageAsync(
        AppDbContext context,
        ILogger logger,
        CancellationToken cancellationToken)
    {
        var current = await context.BairrosPermitidos.ToListAsync(cancellationToken);
        var expectedNames = CuritibaNeighborhoods
            .Select(StringNormalizer.NormalizeText)
            .ToHashSet(StringComparer.Ordinal);

        var alreadyConfigured = current.Count == CuritibaNeighborhoods.Length &&
            current.All(b =>
                StringNormalizer.NormalizeText(b.Cidade) == "curitiba" &&
                b.Uf.Equals("PR", StringComparison.OrdinalIgnoreCase) &&
                expectedNames.Contains(b.NomeNormalizado));

        if (alreadyConfigured)
        {
            return;
        }

        if (current.Count > 0)
        {
            context.BairrosPermitidos.RemoveRange(current);
        }

        context.BairrosPermitidos.AddRange(CuritibaNeighborhoods.Select(name => new PermittedNeighborhood
        {
            Nome = name,
            NomeNormalizado = StringNormalizer.NormalizeText(name),
            Cidade = "Curitiba",
            Uf = "PR",
            Ativo = true
        }));

        logger.LogInformation("Cobertura atualizada para os 75 bairros oficiais de Curitiba/PR");
    }

    private record PlanSeed(
        string Nome,
        string[] Aliases,
        string Descricao,
        int DuracaoMinutos,
        decimal PrecoHatch,
        decimal PrecoSedan,
        decimal PrecoSuv,
        decimal PrecoCamionete,
        decimal PrecoWagon,
        bool EhAdicional = false
    );

    private static PlanSeed[] ExpectedSeedPlans() =>
    [
        new(
            "Somente Limpeza Externa",
            ["somente lavagem externa", "somente limpeza externa", "limpeza externa", "lavagem externa", "externa"],
            "Pré-lavagem técnica, lavagem da carroceria com shampoo de pH neutro e luvas de microfibra, limpeza superficial de rodas e acabamento nos pneus. Tempo estimado: \"1h\".",
            60,
            45m, 55m, 65m, 80m, 55m
        ),
        new(
            "Somente Limpeza Interna",
            ["somente limpeza interna", "limpeza interna", "somente lavagem interna", "lavagem interna", "interna"],
            "Aspiração completa de carpetes, tapetes, bancos e porta-malas, higienização de painel, volante, console central e portas, e limpeza dos vidros internos. Tempo estimado: \"1h\".",
            60,
            45m, 55m, 65m, 80m, 55m
        ),
        new(
            "Lavagem Completa (Sem Cera)",
            ["lavagem completa (sem cera)", "lavagem completa — sem cera", "lavagem completa sem cera", "completa sem cera", "lavagem sem cera", "sem cera"],
            "União de cuidado interno e externo: pré-lavagem, lavagem técnica, rodas e pneus, secagem, aspiração interna, higienização de superfícies e vidros internos/externos. Tempo estimado: \"1h30\".",
            90,
            60m, 80m, 90m, 120m, 80m
        ),
        new(
            "Lavagem Completa (Com Cera)",
            ["lavagem completa (com cera)", "lavagem completa — com cera", "lavagem completa com cera", "completa com cera", "lavagem com cera", "com cera"],
            "Todo o cuidado da Lavagem Completa Sem Cera com aplicação manual de cera automotiva para brilho profundo, toque suave e proteção UV. Tempo estimado: \"2h\".",
            120,
            80m, 100m, 120m, 150m, 100m
        ),
        new(
            "Lavagem Detalhada (Técnica)",
            [
                "lavagem detalhada (tecnica)",
                "lavagem detalhada — lavagem tecnica de alto padrao",
                "lavagem detalhada tecnica",
                "lavagem detalhada",
                "lavagem tecnica",
                "lavagem técnica",
                "limpeza tecnica",
                "limpeza técnica",
                "lavagem tecnica de alto padrao",
                "lavagem técnica de alto padrão",
                "detalhada",
                "tecnica",
                "técnica"
            ],
            "Detalhamento técnico de alto padrão: limpeza profunda de rodas e caixas de roda com pincéis, detalhamento externo de frestas e emblemas, renovação de plásticos, detalhamento minucioso da cabine e acabamento premium. Tempo estimado: \"3h\".",
            180,
            160m, 190m, 230m, 280m, 190m
        ),
        new(
            "Lavagem de Motor (Adicional)",
            [
                "lavagem de motor (adicional)",
                "lavagem de motor adicional",
                "lavagem de motor",
                "limpeza de motor",
                "limpeza de motor (adicional)",
                "lavagem motor",
                "motor"
            ],
            "Limpeza técnica de motor 100% a seco utilizando produtos profissionais da linha Vonixx. Não jogamos água no cofre do motor, garantindo segurança total para os componentes elétricos e eletrônicos. Tempo estimado: \"1h\".",
            60,
            50m, 50m, 65m, 80m, 50m,
            true
        )
    ];

    public static ServicePlan[] DefaultPlans() =>
        ExpectedSeedPlans().Select(s => new ServicePlan
        {
            Nome = s.Nome,
            Descricao = s.Descricao,
            DuracaoMinutos = s.DuracaoMinutos,
            PrecoHatch = s.PrecoHatch,
            PrecoSedan = s.PrecoSedan,
            PrecoSuv = s.PrecoSuv,
            PrecoCamionete = s.PrecoCamionete,
            PrecoWagon = s.PrecoWagon,
            EhAdicional = s.EhAdicional,
            Ativo = true
        }).ToArray();
}
