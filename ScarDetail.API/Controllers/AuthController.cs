using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using ScarDetail.API.Application.DTOs;
using ScarDetail.API.Application.Services;

namespace ScarDetail.API.Controllers;

[Route("api/[controller]")]
public class AuthController : BaseApiController
{
    private readonly IAuthService _authService;

    public AuthController(IAuthService authService)
    {
        _authService = authService;
    }

    [HttpGet("owner-setup")]
    public async Task<ActionResult<OwnerSetupStatusDto>> GetOwnerSetupStatus(CancellationToken cancellationToken)
    {
        return Ok(await _authService.GetOwnerSetupStatusAsync(cancellationToken));
    }

    [EnableRateLimiting("login-policy")]
    [HttpPost("owner-setup")]
    public async Task<ActionResult<AuthResponseDto>> RegisterOwner(
        [FromBody] OwnerSetupDto dto,
        CancellationToken cancellationToken)
    {
        return Ok(await _authService.RegisterOwnerAsync(dto, cancellationToken));
    }

    [HttpPost("register")]
    public async Task<ActionResult<AuthResponseDto>> Register([FromBody] RegisterDto dto, CancellationToken cancellationToken)
    {
        var result = await _authService.RegisterAsync(dto, cancellationToken);
        return Ok(result);
    }

    [EnableRateLimiting("login-policy")]
    [HttpPost("login")]
    public async Task<ActionResult<AuthResponseDto>> Login([FromBody] LoginDto dto, CancellationToken cancellationToken)
    {
        var result = await _authService.LoginAsync(dto, cancellationToken);
        return Ok(result);
    }

    [EnableRateLimiting("login-policy")]
    [HttpPost("refresh")]
    public async Task<ActionResult<AuthResponseDto>> RefreshToken([FromBody] RefreshTokenRequestDto dto, CancellationToken cancellationToken)
    {
        var result = await _authService.RefreshTokenAsync(dto, cancellationToken);
        return Ok(result);
    }

    [Authorize]
    [HttpGet("me")]
    public async Task<ActionResult<UserDto>> GetMe(CancellationToken cancellationToken)
    {
        var userId = GetCurrentUserId();
        var result = await _authService.GetCurrentUserAsync(userId, cancellationToken);
        return Ok(result);
    }

    [Authorize]
    [HttpPut("profile")]
    public async Task<ActionResult<UserDto>> UpdateProfile([FromBody] UpdateProfileDto dto, CancellationToken cancellationToken)
    {
        var userId = GetCurrentUserId();
        var result = await _authService.UpdateProfileAsync(userId, dto, cancellationToken);
        return Ok(result);
    }
}
