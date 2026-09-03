namespace ScarDetail.API.Application.DTOs;

public record AddressDto(
    Guid Id,
    Guid UsuarioId,
    string Apelido,
    string Cep,
    string Logradouro,
    string Numero,
    string? Complemento,
    string Bairro,
    string Cidade,
    string Uf,
    string? PontoReferencia,
    bool Ativo,
    DateTime CriadoEm
);

public record CreateAddressDto(
    string Apelido,
    string Cep,
    string Logradouro,
    string Numero,
    string? Complemento,
    string Bairro,
    string Cidade,
    string Uf,
    string? PontoReferencia
);

public record UpdateAddressDto(
    string Apelido,
    string Cep,
    string Logradouro,
    string Numero,
    string? Complemento,
    string Bairro,
    string Cidade,
    string Uf,
    string? PontoReferencia,
    bool Ativo
);

public record CheckCepResponseDto(
    string Cep,
    string Logradouro,
    string Complemento,
    string Bairro,
    string Cidade,
    string Uf,
    bool Atendido,
    string? Mensagem
);
