using Microsoft.EntityFrameworkCore;
using ScarDetail.API.Application.Common.Exceptions;
using ScarDetail.API.Application.DTOs;
using ScarDetail.API.Domain.Entities;
using ScarDetail.API.Domain.Enums;
using ScarDetail.API.Infrastructure.Data;
using ScarDetail.API.Infrastructure.Security;

namespace ScarDetail.API.Application.Services;

public interface IAuthService
{
    Task<AuthResponseDto> RegisterAsync(RegisterDto dto, CancellationToken cancellationToken = default);
    Task<AuthResponseDto> LoginAsync(LoginDto dto, CancellationToken cancellationToken = default);
    Task<AuthResponseDto> RefreshTokenAsync(RefreshTokenRequestDto dto, CancellationToken cancellationToken = default);
    Task<UserDto> GetCurrentUserAsync(Guid userId, CancellationToken cancellationToken = default);
    Task<UserDto> UpdateProfileAsync(Guid userId, UpdateProfileDto dto, CancellationToken cancellationToken = default);
    Task<OwnerSetupStatusDto> GetOwnerSetupStatusAsync(CancellationToken cancellationToken = default);
    Task<AuthResponseDto> RegisterOwnerAsync(OwnerSetupDto dto, CancellationToken cancellationToken = default);
}

public class AuthService : IAuthService
{
    private static readonly SemaphoreSlim OwnerSetupLock = new(1, 1);

    private readonly AppDbContext _context;
    private readonly IPasswordHasher _passwordHasher;
    private readonly ITokenService _tokenService;

    public AuthService(AppDbContext context, IPasswordHasher passwordHasher, ITokenService tokenService)
    {
        _context = context;
        _passwordHasher = passwordHasher;
        _tokenService = tokenService;
    }

    public async Task<AuthResponseDto> RegisterAsync(RegisterDto dto, CancellationToken cancellationToken = default)
    {
        var normalizedEmail = dto.Email.Trim().ToLowerInvariant();

        var existingUser = await _context.Usuarios
            .AnyAsync(u => u.Email.ToLower() == normalizedEmail, cancellationToken);

        if (existingUser)
        {
            throw new ConflictException("Já existe uma conta cadastrada com este endereço de e-mail.");
        }

        var user = new User
        {
            Nome = dto.Nome.Trim(),
            Email = normalizedEmail,
            SenhaHash = _passwordHasher.HashPassword(dto.Senha),
            Telefone = dto.Telefone.Trim(),
            Role = UserRole.Client,
            Ativo = true
        };

        _context.Usuarios.Add(user);

        var (accessToken, jwtId, expiration) = _tokenService.GenerateAccessToken(user);
        var refreshTokenString = _tokenService.GenerateRefreshToken();

        var refreshToken = new RefreshToken
        {
            UsuarioId = user.Id,
            Token = refreshTokenString,
            JwtId = jwtId,
            DataExpiracao = DateTime.UtcNow.AddDays(7),
            Revogado = false
        };

        _context.RefreshTokens.Add(refreshToken);
        await _context.SaveChangesAsync(cancellationToken);

        return new AuthResponseDto(
            accessToken,
            refreshTokenString,
            expiration,
            new UserDto(user.Id, user.Nome, user.Email, user.Telefone, user.Role, user.Ativo, user.CriadoEm)
        );
    }

    public async Task<OwnerSetupStatusDto> GetOwnerSetupStatusAsync(CancellationToken cancellationToken = default)
    {
        var ownerExists = await _context.Usuarios
            .AnyAsync(u => u.Role == UserRole.Admin, cancellationToken);

        return ownerExists
            ? new OwnerSetupStatusDto(false, "O acesso do proprietário já foi configurado.")
            : new OwnerSetupStatusDto(true, "Crie o acesso exclusivo do proprietário.");
    }

    public async Task<AuthResponseDto> RegisterOwnerAsync(OwnerSetupDto dto, CancellationToken cancellationToken = default)
    {
        await OwnerSetupLock.WaitAsync(cancellationToken);
        try
        {
            if (await _context.Usuarios.AnyAsync(u => u.Role == UserRole.Admin, cancellationToken))
            {
                throw new ConflictException("O acesso do proprietário já foi configurado.");
            }

            var normalizedEmail = dto.Email.Trim().ToLowerInvariant();
            if (await _context.Usuarios.AnyAsync(u => u.Email.ToLower() == normalizedEmail, cancellationToken))
            {
                throw new ConflictException("Já existe uma conta cadastrada com este endereço de e-mail.");
            }

            var owner = new User
            {
                Nome = dto.Nome.Trim(),
                Email = normalizedEmail,
                SenhaHash = _passwordHasher.HashPassword(dto.Senha),
                Telefone = dto.Telefone.Trim(),
                Role = UserRole.Admin,
                Ativo = true
            };

            _context.Usuarios.Add(owner);
            var (accessToken, jwtId, expiration) = _tokenService.GenerateAccessToken(owner);
            var refreshTokenString = _tokenService.GenerateRefreshToken();
            _context.RefreshTokens.Add(new RefreshToken
            {
                UsuarioId = owner.Id,
                Token = refreshTokenString,
                JwtId = jwtId,
                DataExpiracao = DateTime.UtcNow.AddDays(7),
                Revogado = false
            });

            await _context.SaveChangesAsync(cancellationToken);

            return new AuthResponseDto(
                accessToken,
                refreshTokenString,
                expiration,
                new UserDto(owner.Id, owner.Nome, owner.Email, owner.Telefone, owner.Role, owner.Ativo, owner.CriadoEm)
            );
        }
        finally
        {
            OwnerSetupLock.Release();
        }
    }

    public async Task<AuthResponseDto> LoginAsync(LoginDto dto, CancellationToken cancellationToken = default)
    {
        var normalizedEmail = dto.Email.Trim().ToLowerInvariant();

        var user = await _context.Usuarios
            .FirstOrDefaultAsync(u => u.Email.ToLower() == normalizedEmail, cancellationToken);

        if (user == null || !_passwordHasher.VerifyPassword(dto.Senha, user.SenhaHash))
        {
            throw new UnauthorizedAppException("E-mail ou senha incorretos.");
        }

        if (!user.Ativo)
        {
            throw new ForbiddenAppException("Sua conta está desativada. Entre em contato com o suporte.");
        }

        var (accessToken, jwtId, expiration) = _tokenService.GenerateAccessToken(user);
        var refreshTokenString = _tokenService.GenerateRefreshToken();

        var refreshToken = new RefreshToken
        {
            UsuarioId = user.Id,
            Token = refreshTokenString,
            JwtId = jwtId,
            DataExpiracao = DateTime.UtcNow.AddDays(7),
            Revogado = false
        };

        _context.RefreshTokens.Add(refreshToken);
        await _context.SaveChangesAsync(cancellationToken);

        return new AuthResponseDto(
            accessToken,
            refreshTokenString,
            expiration,
            new UserDto(user.Id, user.Nome, user.Email, user.Telefone, user.Role, user.Ativo, user.CriadoEm)
        );
    }

    public async Task<AuthResponseDto> RefreshTokenAsync(RefreshTokenRequestDto dto, CancellationToken cancellationToken = default)
    {
        var principal = _tokenService.GetPrincipalFromExpiredToken(dto.AccessToken);
        if (principal == null)
        {
            throw new UnauthorizedAppException("Access Token inválido.");
        }

        var userIdClaim = principal.Claims.FirstOrDefault(c => c.Type == System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var userId))
        {
            throw new UnauthorizedAppException("Token inválido.");
        }

        var user = await _context.Usuarios.FindAsync(new object[] { userId }, cancellationToken);
        if (user == null || !user.Ativo)
        {
            throw new UnauthorizedAppException("Usuário não encontrado ou inativo.");
        }

        var savedRefreshToken = await _context.RefreshTokens
            .FirstOrDefaultAsync(r => r.Token == dto.RefreshToken && r.UsuarioId == userId, cancellationToken);

        if (savedRefreshToken == null || !savedRefreshToken.IsActive)
        {
            throw new UnauthorizedAppException("Refresh Token inválido ou expirado.");
        }

        var accessTokenJwtId = principal.Claims
            .FirstOrDefault(c => c.Type == System.IdentityModel.Tokens.Jwt.JwtRegisteredClaimNames.Jti)?.Value;
        if (string.IsNullOrWhiteSpace(accessTokenJwtId) ||
            !string.Equals(savedRefreshToken.JwtId, accessTokenJwtId, StringComparison.Ordinal))
        {
            throw new UnauthorizedAppException("O refresh token não pertence ao access token informado.");
        }

        // Revoga o token atual e gera um novo (Rotation)
        savedRefreshToken.Revogado = true;

        var (newAccessToken, newJwtId, newExpiration) = _tokenService.GenerateAccessToken(user);
        var newRefreshTokenString = _tokenService.GenerateRefreshToken();

        savedRefreshToken.SubstituidoPorToken = newRefreshTokenString;

        var newRefreshToken = new RefreshToken
        {
            UsuarioId = user.Id,
            Token = newRefreshTokenString,
            JwtId = newJwtId,
            DataExpiracao = DateTime.UtcNow.AddDays(7),
            Revogado = false
        };

        _context.RefreshTokens.Add(newRefreshToken);
        await _context.SaveChangesAsync(cancellationToken);

        return new AuthResponseDto(
            newAccessToken,
            newRefreshTokenString,
            newExpiration,
            new UserDto(user.Id, user.Nome, user.Email, user.Telefone, user.Role, user.Ativo, user.CriadoEm)
        );
    }

    public async Task<UserDto> GetCurrentUserAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        var user = await _context.Usuarios.AsNoTracking()
            .FirstOrDefaultAsync(u => u.Id == userId, cancellationToken);

        if (user == null)
            throw new NotFoundException("Usuário não encontrado.");

        return new UserDto(user.Id, user.Nome, user.Email, user.Telefone, user.Role, user.Ativo, user.CriadoEm);
    }

    public async Task<UserDto> UpdateProfileAsync(Guid userId, UpdateProfileDto dto, CancellationToken cancellationToken = default)
    {
        var user = await _context.Usuarios.FindAsync(new object[] { userId }, cancellationToken);
        if (user == null)
            throw new NotFoundException("Usuário não encontrado.");

        user.Nome = dto.Nome.Trim();
        user.Telefone = dto.Telefone.Trim();

        await _context.SaveChangesAsync(cancellationToken);

        return new UserDto(user.Id, user.Nome, user.Email, user.Telefone, user.Role, user.Ativo, user.CriadoEm);
    }
}
