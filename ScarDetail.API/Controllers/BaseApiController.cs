using System.Security.Claims;
using Microsoft.AspNetCore.Mvc;
using ScarDetail.API.Application.Common.Exceptions;

namespace ScarDetail.API.Controllers;

[ApiController]
public abstract class BaseApiController : ControllerBase
{
    protected Guid GetCurrentUserId()
    {
        var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub");
        if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var userId))
        {
            throw new UnauthorizedAppException("Usuário não autenticado ou token inválido.");
        }
        return userId;
    }

    protected bool IsAdmin()
    {
        return User.IsInRole("Admin");
    }
}
