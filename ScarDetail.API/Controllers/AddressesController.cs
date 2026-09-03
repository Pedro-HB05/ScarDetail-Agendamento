using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ScarDetail.API.Application.DTOs;
using ScarDetail.API.Application.Services;

namespace ScarDetail.API.Controllers;

[Authorize]
[Route("api/[controller]")]
public class AddressesController : BaseApiController
{
    private readonly IAddressService _addressService;

    public AddressesController(IAddressService addressService)
    {
        _addressService = addressService;
    }

    [AllowAnonymous]
    [HttpGet("check-cep/{cep}")]
    public async Task<ActionResult<CheckCepResponseDto>> CheckCep(string cep, CancellationToken cancellationToken)
    {
        var result = await _addressService.ConsultarEValidarCepAsync(cep, cancellationToken);
        return Ok(result);
    }

    [HttpGet]
    public async Task<ActionResult<List<AddressDto>>> GetMyAddresses([FromQuery] bool includeInactive, CancellationToken cancellationToken)
    {
        var userId = GetCurrentUserId();
        var addresses = await _addressService.GetUserAddressesAsync(userId, includeInactive, cancellationToken);
        return Ok(addresses);
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<AddressDto>> GetAddressById(Guid id, CancellationToken cancellationToken)
    {
        var userId = GetCurrentUserId();
        var address = await _addressService.GetAddressByIdAsync(id, userId, IsAdmin(), cancellationToken);
        return Ok(address);
    }

    [HttpPost]
    public async Task<ActionResult<AddressDto>> CreateAddress([FromBody] CreateAddressDto dto, CancellationToken cancellationToken)
    {
        var userId = GetCurrentUserId();
        var address = await _addressService.CreateAddressAsync(userId, dto, cancellationToken);
        return CreatedAtAction(nameof(GetAddressById), new { id = address.Id }, address);
    }

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<AddressDto>> UpdateAddress(Guid id, [FromBody] UpdateAddressDto dto, CancellationToken cancellationToken)
    {
        var userId = GetCurrentUserId();
        var address = await _addressService.UpdateAddressAsync(id, userId, dto, IsAdmin(), cancellationToken);
        return Ok(address);
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> DeleteAddress(Guid id, CancellationToken cancellationToken)
    {
        var userId = GetCurrentUserId();
        await _addressService.DeleteAddressAsync(id, userId, IsAdmin(), cancellationToken);
        return NoContent();
    }
}
