using FluentValidation;
using ScarDetail.API.Application.Common.Utilities;
using ScarDetail.API.Application.DTOs;
using ScarDetail.API.Domain.Enums;

namespace ScarDetail.API.Application.Validators;

public class RegisterDtoValidator : AbstractValidator<RegisterDto>
{
    public RegisterDtoValidator()
    {
        RuleFor(x => x.Nome)
            .NotEmpty().WithMessage("O nome é obrigatório.")
            .MaximumLength(150).WithMessage("O nome deve ter no máximo 150 caracteres.");

        RuleFor(x => x.Email)
            .NotEmpty().WithMessage("O e-mail é obrigatório.")
            .EmailAddress().WithMessage("Formato de e-mail inválido.")
            .MaximumLength(255).WithMessage("O e-mail deve ter no máximo 255 caracteres.");

        RuleFor(x => x.Senha)
            .NotEmpty().WithMessage("A senha é obrigatória.")
            .MinimumLength(8).WithMessage("A senha deve ter no mínimo 8 caracteres.");

        RuleFor(x => x.Telefone)
            .NotEmpty().WithMessage("O telefone é obrigatório.")
            .MaximumLength(20).WithMessage("O telefone deve ter no máximo 20 caracteres.");
    }
}

public class OwnerSetupDtoValidator : AbstractValidator<OwnerSetupDto>
{
    public OwnerSetupDtoValidator()
    {
        RuleFor(x => x.Nome)
            .NotEmpty().WithMessage("O nome é obrigatório.")
            .MaximumLength(150).WithMessage("O nome deve ter no máximo 150 caracteres.");

        RuleFor(x => x.Email)
            .NotEmpty().WithMessage("O e-mail é obrigatório.")
            .EmailAddress().WithMessage("Formato de e-mail inválido.")
            .MaximumLength(255).WithMessage("O e-mail deve ter no máximo 255 caracteres.");

        RuleFor(x => x.Senha)
            .NotEmpty().WithMessage("A senha é obrigatória.")
            .MinimumLength(10).WithMessage("A senha do proprietário deve ter no mínimo 10 caracteres.");

        RuleFor(x => x.Telefone)
            .NotEmpty().WithMessage("O telefone é obrigatório.")
            .MaximumLength(20).WithMessage("O telefone deve ter no máximo 20 caracteres.");
    }
}

public class LoginDtoValidator : AbstractValidator<LoginDto>
{
    public LoginDtoValidator()
    {
        RuleFor(x => x.Email)
            .NotEmpty().WithMessage("O e-mail é obrigatório.")
            .EmailAddress().WithMessage("Formato de e-mail inválido.");

        RuleFor(x => x.Senha)
            .NotEmpty().WithMessage("A senha é obrigatória.");
    }
}

public class CreateVehicleDtoValidator : AbstractValidator<CreateVehicleDto>
{
    public CreateVehicleDtoValidator()
    {
        RuleFor(x => x.Categoria)
            .IsInEnum().WithMessage("Categoria de veículo inválida. Categorias permitidas: Hatch, Sedan, SUV, Camionete, Wagon.");

        RuleFor(x => x.Marca)
            .NotEmpty().WithMessage("A marca do veículo é obrigatória.")
            .MaximumLength(50).WithMessage("A marca deve ter no máximo 50 caracteres.");

        RuleFor(x => x.Modelo)
            .NotEmpty().WithMessage("O modelo do veículo é obrigatório.")
            .MaximumLength(50).WithMessage("O modelo deve ter no máximo 50 caracteres.");

        RuleFor(x => x.Ano)
            .InclusiveBetween(1900, DateTime.UtcNow.Year + 1)
            .WithMessage($"O ano deve estar entre 1900 e {DateTime.UtcNow.Year + 1}.");

        RuleFor(x => x.Placa)
            .MaximumLength(10).WithMessage("A placa deve ter no máximo 10 caracteres.");
    }
}

public class CreateAddressDtoValidator : AbstractValidator<CreateAddressDto>
{
    public CreateAddressDtoValidator()
    {
        RuleFor(x => x.Apelido)
            .NotEmpty().WithMessage("O apelido do endereço é obrigatório (Ex: Casa, Trabalho).")
            .MaximumLength(50).WithMessage("O apelido deve ter no máximo 50 caracteres.");

        RuleFor(x => x.Cep)
            .NotEmpty().WithMessage("O CEP é obrigatório.")
            .Must(cep => StringNormalizer.CleanCep(cep).Length == 8)
            .WithMessage("O CEP deve conter exatamente 8 dígitos.");

        RuleFor(x => x.Logradouro)
            .NotEmpty().WithMessage("O logradouro é obrigatório.")
            .MaximumLength(150);

        RuleFor(x => x.Numero)
            .NotEmpty().WithMessage("O número é obrigatório.")
            .MaximumLength(20);

        RuleFor(x => x.Bairro)
            .NotEmpty().WithMessage("O bairro é obrigatório.")
            .MaximumLength(100);

        RuleFor(x => x.Cidade)
            .NotEmpty().WithMessage("A cidade é obrigatória.")
            .MaximumLength(100);

        RuleFor(x => x.Uf)
            .NotEmpty().WithMessage("O estado (UF) é obrigatório.")
            .Length(2).WithMessage("A UF deve ter exatamente 2 caracteres.");
    }
}

public class CreateServicePlanDtoValidator : AbstractValidator<CreateServicePlanDto>
{
    public CreateServicePlanDtoValidator()
    {
        RuleFor(x => x.Nome)
            .NotEmpty().WithMessage("O nome do serviço é obrigatório.")
            .MaximumLength(100);

        RuleFor(x => x.DuracaoMinutos)
            .GreaterThan(0).WithMessage("A duração deve ser maior que zero minutos.");

        RuleFor(x => x.PrecoHatch)
            .GreaterThanOrEqualTo(0).WithMessage("O preço para Hatch não pode ser negativo.");

        RuleFor(x => x.PrecoSedan)
            .GreaterThanOrEqualTo(0).WithMessage("O preço para Sedan não pode ser negativo.");

        RuleFor(x => x.PrecoSuv)
            .GreaterThanOrEqualTo(0).WithMessage("O preço para SUV não pode ser negativo.");

        RuleFor(x => x.PrecoCamionete)
            .GreaterThanOrEqualTo(0).WithMessage("O preço para Camionete não pode ser negativo.");

        RuleFor(x => x.PrecoWagon)
            .GreaterThanOrEqualTo(0).WithMessage("O preço para Wagon não pode ser negativo.");
    }
}

public class CreateNeighborhoodDtoValidator : AbstractValidator<CreateNeighborhoodDto>
{
    public CreateNeighborhoodDtoValidator()
    {
        RuleFor(x => x.Nome)
            .NotEmpty().WithMessage("O nome do bairro é obrigatório.")
            .MaximumLength(100);

        RuleFor(x => x.Cidade)
            .NotEmpty().WithMessage("A cidade é obrigatória.")
            .MaximumLength(100);

        RuleFor(x => x.Uf)
            .NotEmpty().WithMessage("A UF é obrigatória.")
            .Length(2).WithMessage("A UF deve ter 2 caracteres.");
    }
}

public class UpdateBusinessHourDtoValidator : AbstractValidator<UpdateBusinessHourDto>
{
    public UpdateBusinessHourDtoValidator()
    {
        RuleFor(x => x)
            .Must(x => x.HorarioAbertura < x.HorarioFechamento)
            .WithMessage("O horário de abertura deve ser anterior ao horário de fechamento.");
    }
}

public class CreateAgendaBlockDtoValidator : AbstractValidator<CreateAgendaBlockDto>
{
    public CreateAgendaBlockDtoValidator()
    {
        RuleFor(x => x.Motivo)
            .NotEmpty().WithMessage("O motivo do bloqueio é obrigatório.")
            .MaximumLength(255);

        RuleFor(x => x)
            .Must(x => x.DataHoraInicio < x.DataHoraFim)
            .WithMessage("A data/hora de início deve ser anterior à data/hora de término.");

        RuleFor(x => x.DataHoraInicio)
            .NotEmpty().WithMessage("A data/hora inicial é obrigatória.");
    }
}

public class CreateAppointmentDtoValidator : AbstractValidator<CreateAppointmentDto>
{
    public CreateAppointmentDtoValidator()
    {
        RuleFor(x => x.VeiculoId)
            .NotEmpty().WithMessage("O veículo é obrigatório.");

        RuleFor(x => x.EnderecoId)
            .NotEmpty().WithMessage("O endereço é obrigatório.");

        RuleFor(x => x.PlanoId)
            .NotEmpty().WithMessage("O serviço/plano é obrigatório.");

        RuleFor(x => x.DataHoraInicio)
            .NotEmpty().WithMessage("A data/hora do agendamento é obrigatória.");
    }
}

public class CreatePaymentDtoValidator : AbstractValidator<CreatePaymentDto>
{
    public CreatePaymentDtoValidator()
    {
        RuleFor(x => x.Metodo)
            .IsInEnum().WithMessage("Método de pagamento inválido. Métodos válidos: PIX, Cartao, Dinheiro.");

        RuleFor(x => x.Desconto)
            .GreaterThanOrEqualTo(0).WithMessage("O valor do desconto não pode ser negativo.");

        RuleFor(x => x.Acrescimo)
            .GreaterThanOrEqualTo(0).WithMessage("O valor do acréscimo não pode ser negativo.");

        RuleFor(x => x.ValorRecebido)
            .GreaterThanOrEqualTo(0).WithMessage("O valor recebido não pode ser negativo.");
    }
}
