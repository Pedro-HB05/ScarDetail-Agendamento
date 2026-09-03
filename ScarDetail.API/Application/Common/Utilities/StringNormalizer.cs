using System.Globalization;
using System.Text;
using System.Text.RegularExpressions;

namespace ScarDetail.API.Application.Common.Utilities;

public static class StringNormalizer
{
    public static string NormalizeText(string? input)
    {
        if (string.IsNullOrWhiteSpace(input))
            return string.Empty;

        // 1. Decomposição de acentos
        var normalizedString = input.Trim().Normalize(NormalizationForm.FormD);
        var stringBuilder = new StringBuilder();

        foreach (var c in normalizedString)
        {
            var unicodeCategory = CharUnicodeInfo.GetUnicodeCategory(c);
            if (unicodeCategory != UnicodeCategory.NonSpacingMark)
            {
                stringBuilder.Append(c);
            }
        }

        // 2. Normalização final: minúsculas e remoção de espaços duplos
        var cleaned = stringBuilder.ToString().Normalize(NormalizationForm.FormC).ToLowerInvariant();
        cleaned = Regex.Replace(cleaned, @"\s+", " ").Trim();

        return cleaned;
    }

    public static string CleanCep(string? cep)
    {
        if (string.IsNullOrWhiteSpace(cep))
            return string.Empty;

        return Regex.Replace(cep, @"\D", "");
    }
}
