using System.Text.Json;
using System.Text.Json.Serialization;
using ScarDetail.API.Application.Common.Exceptions;
using ScarDetail.API.Application.Common.Utilities;

namespace ScarDetail.API.Infrastructure.ExternalServices;

public class ViaCepRawResponse
{
    [JsonPropertyName("cep")]
    public string? Cep { get; set; }

    [JsonPropertyName("logradouro")]
    public string? Logradouro { get; set; }

    [JsonPropertyName("complemento")]
    public string? Complemento { get; set; }

    [JsonPropertyName("bairro")]
    public string? Bairro { get; set; }

    [JsonPropertyName("localidade")]
    public string? Localidade { get; set; }

    [JsonPropertyName("uf")]
    public string? Uf { get; set; }

    [JsonPropertyName("erro")]
    public object? Erro { get; set; } // Pode vir como bool ou string "true"
}

public class ViaCepResult
{
    public string Cep { get; set; } = string.Empty;
    public string Logradouro { get; set; } = string.Empty;
    public string Complemento { get; set; } = string.Empty;
    public string Bairro { get; set; } = string.Empty;
    public string BairroNormalizado { get; set; } = string.Empty;
    public string Cidade { get; set; } = string.Empty;
    public string Uf { get; set; } = string.Empty;
    public bool Valido { get; set; }
}

public interface IViaCepService
{
    Task<ViaCepResult> ConsultarCepAsync(string cep, CancellationToken cancellationToken = default);
}

public class ViaCepService : IViaCepService
{
    private readonly HttpClient _httpClient;
    private readonly ILogger<ViaCepService> _logger;

    public ViaCepService(HttpClient httpClient, ILogger<ViaCepService> logger)
    {
        _httpClient = httpClient;
        _logger = logger;
    }

    public async Task<ViaCepResult> ConsultarCepAsync(string cep, CancellationToken cancellationToken = default)
    {
        var cleanCep = StringNormalizer.CleanCep(cep);
        if (cleanCep.Length != 8)
        {
            throw new ValidationAppException("CEP inválido. O CEP deve conter exatamente 8 dígitos.");
        }

        try
        {
            var response = await _httpClient.GetAsync($"https://viacep.com.br/ws/{cleanCep}/json/", cancellationToken);
            if (!response.IsSuccessStatusCode)
            {
                _logger.LogWarning("ViaCEP retornou status code {StatusCode} para o CEP {Cep}", response.StatusCode, cleanCep);
                throw new AppException("Serviço de consulta de CEP temporariamente indisponível. Tente novamente.", 503);
            }

            var jsonContent = await response.Content.ReadAsStringAsync(cancellationToken);
            var viaCepData = JsonSerializer.Deserialize<ViaCepRawResponse>(jsonContent, new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true
            });

            if (viaCepData == null || (viaCepData.Erro != null && viaCepData.Erro.ToString()?.ToLower() == "true"))
            {
                throw new NotFoundException("CEP não encontrado na base do ViaCEP.");
            }

            return new ViaCepResult
            {
                Cep = viaCepData.Cep ?? cleanCep,
                Logradouro = viaCepData.Logradouro ?? string.Empty,
                Complemento = viaCepData.Complemento ?? string.Empty,
                Bairro = viaCepData.Bairro ?? string.Empty,
                BairroNormalizado = StringNormalizer.NormalizeText(viaCepData.Bairro),
                Cidade = viaCepData.Localidade ?? string.Empty,
                Uf = viaCepData.Uf?.ToUpperInvariant() ?? string.Empty,
                Valido = true
            };
        }
        catch (AppException)
        {
            throw;
        }
        catch (HttpRequestException ex)
        {
            _logger.LogError(ex, "Erro de rede ao consultar ViaCEP para o CEP {Cep}", cleanCep);
            throw new AppException("Não foi possível conectar ao serviço ViaCEP. Verifique sua conexão.", 503);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erro inesperado ao consultar CEP {Cep}", cleanCep);
            throw new AppException("Falha ao processar a consulta de CEP.", 500);
        }
    }
}
