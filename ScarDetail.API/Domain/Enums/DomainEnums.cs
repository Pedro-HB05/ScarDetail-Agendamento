namespace ScarDetail.API.Domain.Enums;

public enum UserRole
{
    Admin,
    Client
}

public enum VehicleCategory
{
    Hatch,
    Sedan,
    Wagon,
    SUV,
    Camionete
}

public enum AppointmentStatus
{
    Pendente,
    Confirmado,
    ACaminho,
    EmExecucao,
    Finalizado,
    Cancelado
}

public enum PaymentMethod
{
    PIX,
    Cartao,
    Dinheiro
}
