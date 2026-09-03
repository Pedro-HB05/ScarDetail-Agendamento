using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using Microsoft.IdentityModel.Tokens;
using ScarDetail.API.Domain.Entities;

namespace ScarDetail.API.Infrastructure.Security;

public interface ITokenService
{
    (string Token, string JwtId, DateTime Expiration) GenerateAccessToken(User user);
    string GenerateRefreshToken();
    ClaimsPrincipal? GetPrincipalFromExpiredToken(string token);
}

public class TokenService : ITokenService
{
    private readonly IConfiguration _configuration;

    public TokenService(IConfiguration configuration)
    {
        _configuration = configuration;
    }

    public (string Token, string JwtId, DateTime Expiration) GenerateAccessToken(User user)
    {
        var secretKey = GetSecretKey();
        var issuer = _configuration["Jwt:Issuer"] ?? "ScarDetail.API";
        var audience = _configuration["Jwt:Audience"] ?? "ScarDetail.App";
        var expirationMinutes = int.TryParse(_configuration["Jwt:ExpirationMinutes"], out var minutes) ? minutes : 120;

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var jwtId = Guid.NewGuid().ToString();
        var expiration = DateTime.UtcNow.AddMinutes(expirationMinutes);

        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new(ClaimTypes.Email, user.Email),
            new(ClaimTypes.Name, user.Nome),
            new(ClaimTypes.Role, user.Role.ToString()),
            new(JwtRegisteredClaimNames.Jti, jwtId),
            new(JwtRegisteredClaimNames.Sub, user.Id.ToString())
        };

        var tokenDescriptor = new SecurityTokenDescriptor
        {
            Subject = new ClaimsIdentity(claims),
            Expires = expiration,
            Issuer = issuer,
            Audience = audience,
            SigningCredentials = credentials
        };

        var tokenHandler = new JwtSecurityTokenHandler();
        var securityToken = tokenHandler.CreateToken(tokenDescriptor);
        var tokenString = tokenHandler.WriteToken(securityToken);

        return (tokenString, jwtId, expiration);
    }

    public string GenerateRefreshToken()
    {
        var randomNumber = new byte[64];
        using var rng = RandomNumberGenerator.Create();
        rng.GetBytes(randomNumber);
        return Convert.ToBase64String(randomNumber);
    }

    public ClaimsPrincipal? GetPrincipalFromExpiredToken(string token)
    {
        var secretKey = GetSecretKey();
        var tokenValidationParameters = new TokenValidationParameters
        {
            ValidateAudience = false,
            ValidateIssuer = false,
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey)),
            ValidateLifetime = false // Permitir token expirado
        };

        var tokenHandler = new JwtSecurityTokenHandler();
        ClaimsPrincipal principal;
        SecurityToken securityToken;
        try
        {
            principal = tokenHandler.ValidateToken(token, tokenValidationParameters, out securityToken);
        }
        catch (SecurityTokenException)
        {
            return null;
        }
        catch (ArgumentException)
        {
            return null;
        }

        if (securityToken is not JwtSecurityToken jwtSecurityToken ||
            !jwtSecurityToken.Header.Alg.Equals(SecurityAlgorithms.HmacSha256, StringComparison.InvariantCultureIgnoreCase))
        {
            return null;
        }

        return principal;
    }

    private string GetSecretKey() =>
        _configuration["Jwt:SecretKey"] is { Length: >= 32 } secretKey
            ? secretKey
            : throw new InvalidOperationException("Jwt:SecretKey não está configurada corretamente.");
}
