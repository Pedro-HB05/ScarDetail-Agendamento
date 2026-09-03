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

        if (!await context.Planos.AnyAsync(cancellationToken))
        {
            context.Planos.AddRange(DefaultPlans());
        }

        await EnsureCuritibaCoverageAsync(context, logger, cancellationToken);

        await context.SaveChangesAsync(cancellationToken);
        logger.LogInformation("Dados de referência aplicados com sucesso");
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

    private static ServicePlan[] DefaultPlans() =>
    [
        CreatePlan("Completa com Cera", "Lavagem completa com aplicação de cera.", 120, 65m, 85m, 95m, 105m, 85m),
        CreatePlan("Completa sem Cera", "Lavagem completa sem aplicação de cera.", 90, 55m, 70m, 80m, 90m, 70m),
        CreatePlan("Somente Lavagem Externa", "Lavagem da parte externa do veículo.", 45, 30m, 40m, 45m, 50m, 40m),
        CreatePlan("Somente Limpeza Interna", "Limpeza da parte interna do veículo.", 45, 30m, 40m, 45m, 50m, 40m)
    ];

    private static ServicePlan CreatePlan(
        string name,
        string description,
        int duration,
        decimal hatch,
        decimal sedan,
        decimal suv,
        decimal pickup,
        decimal wagon) => new()
        {
            Nome = name,
            Descricao = description,
            DuracaoMinutos = duration,
            PrecoHatch = hatch,
            PrecoSedan = sedan,
            PrecoSuv = suv,
            PrecoCamionete = pickup,
            PrecoWagon = wagon,
            Ativo = true
        };
}
