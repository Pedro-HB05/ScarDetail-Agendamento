using Microsoft.EntityFrameworkCore;
using ScarDetail.API.Application.Common.Exceptions;
using ScarDetail.API.Application.DTOs;
using ScarDetail.API.Domain.Entities;
using ScarDetail.API.Infrastructure.Data;

namespace ScarDetail.API.Application.Services;

public interface IBusinessHourService
{
    Task<List<BusinessHourDto>> GetAllHoursAsync(CancellationToken cancellationToken = default);
    Task<BusinessHourDto> GetHourByDayOfWeekAsync(int dayOfWeek, CancellationToken cancellationToken = default);
    Task<BusinessHourDto> UpdateHourAsync(int dayOfWeek, UpdateBusinessHourDto dto, CancellationToken cancellationToken = default);
}

public class BusinessHourService : IBusinessHourService
{
    private readonly AppDbContext _context;

    public BusinessHourService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<List<BusinessHourDto>> GetAllHoursAsync(CancellationToken cancellationToken = default)
    {
        var hours = await _context.HorariosFuncionamento.AsNoTracking()
            .OrderBy(h => h.DiaSemana)
            .ToListAsync(cancellationToken);

        return hours.Select(MapToDto).ToList();
    }

    public async Task<BusinessHourDto> GetHourByDayOfWeekAsync(int dayOfWeek, CancellationToken cancellationToken = default)
    {
        var hour = await _context.HorariosFuncionamento.AsNoTracking()
            .FirstOrDefaultAsync(h => h.DiaSemana == dayOfWeek, cancellationToken);

        if (hour == null)
            throw new NotFoundException($"Horário de funcionamento não configurado para o dia {dayOfWeek}.");

        return MapToDto(hour);
    }

    public async Task<BusinessHourDto> UpdateHourAsync(int dayOfWeek, UpdateBusinessHourDto dto, CancellationToken cancellationToken = default)
    {
        if (dto.HorarioAbertura >= dto.HorarioFechamento)
        {
            throw new ValidationAppException("O horário de abertura deve ser anterior ao horário de fechamento.");
        }

        var hour = await _context.HorariosFuncionamento.FirstOrDefaultAsync(h => h.DiaSemana == dayOfWeek, cancellationToken);
        if (hour == null)
            throw new NotFoundException($"Horário de funcionamento não encontrado para o dia {dayOfWeek}.");

        hour.HorarioAbertura = dto.HorarioAbertura;
        hour.HorarioFechamento = dto.HorarioFechamento;
        hour.Ativo = dto.Ativo;

        await _context.SaveChangesAsync(cancellationToken);
        return MapToDto(hour);
    }

    private static BusinessHourDto MapToDto(BusinessHour h) =>
        new(h.Id, h.DiaSemana, h.NomeDia, h.HorarioAbertura, h.HorarioFechamento, h.Ativo, h.AtualizadoEm);
}
