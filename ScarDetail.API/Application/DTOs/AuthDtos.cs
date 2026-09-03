using ScarDetail.API.Domain.Enums;

namespace ScarDetail.API.Application.DTOs;

public record RegisterDto(
    string Nome,
    string Email,
    string Senha,
    string Telefone
);

public record OwnerSetupDto(
    string Nome,
    string Email,
    string Senha,
    string Telefone
);

public record OwnerSetupStatusDto(
    bool ConfiguracaoDisponivel,
    string Mensagem
);

public record LoginDto(
    string Email,
    string Senha
);

public record RefreshTokenRequestDto(
    string AccessToken,
    string RefreshToken
);

public record AuthResponseDto(
    string AccessToken,
    string RefreshToken,
    DateTime Expiracao,
    UserDto Usuario
);

public record UserDto(
    Guid Id,
    string Nome,
    string Email,
    string Telefone,
    UserRole Role,
    bool Ativo,
    DateTime CriadoEm
);

public record UpdateProfileDto(
    string Nome,
    string Telefone
);
