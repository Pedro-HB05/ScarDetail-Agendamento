namespace ScarDetail.API.Application.Common.Exceptions;

public class AppException : Exception
{
    public int StatusCode { get; }
    public object? Errors { get; }

    public AppException(string message, int statusCode = 400, object? errors = null)
        : base(message)
    {
        StatusCode = statusCode;
        Errors = errors;
    }
}

public class NotFoundException : AppException
{
    public NotFoundException(string message)
        : base(message, 404) { }
}

public class ConflictException : AppException
{
    public ConflictException(string message)
        : base(message, 409) { }
}

public class UnauthorizedAppException : AppException
{
    public UnauthorizedAppException(string message = "Não autorizado.")
        : base(message, 401) { }
}

public class ForbiddenAppException : AppException
{
    public ForbiddenAppException(string message = "Acesso negado.")
        : base(message, 403) { }
}

public class ValidationAppException : AppException
{
    public ValidationAppException(string message, object? errors = null)
        : base(message, 400, errors) { }
}
