using System.Net;
using System.Text.Json;
using Microsoft.AspNetCore.Mvc;
using ScarDetail.API.Application.Common.Exceptions;

namespace ScarDetail.API.Middlewares;

public class GlobalExceptionMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<GlobalExceptionMiddleware> _logger;
    private readonly IHostEnvironment _env;

    public GlobalExceptionMiddleware(RequestDelegate next, ILogger<GlobalExceptionMiddleware> logger, IHostEnvironment env)
    {
        _next = next;
        _logger = logger;
        _env = env;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (Exception ex)
        {
            await HandleExceptionAsync(context, ex);
        }
    }

    private async Task HandleExceptionAsync(HttpContext context, Exception exception)
    {
        var statusCode = HttpStatusCode.InternalServerError;
        var title = "Ocorreu um erro interno no servidor.";
        var detail = exception.Message;
        object? errors = null;

        switch (exception)
        {
            case AppException appEx:
                statusCode = (HttpStatusCode)appEx.StatusCode;
                title = appEx switch
                {
                    NotFoundException => "Recurso não encontrado.",
                    ConflictException => "Conflito de dados ou concorrência.",
                    UnauthorizedAppException => "Não autorizado.",
                    ForbiddenAppException => "Acesso proibido.",
                    ValidationAppException => "Erro de validação.",
                    _ => "Erro na requisição."
                };
                detail = appEx.Message;
                errors = appEx.Errors;
                break;

            case FluentValidation.ValidationException fluentEx:
                statusCode = HttpStatusCode.BadRequest;
                title = "Erro de validação de dados.";
                errors = fluentEx.Errors.GroupBy(e => e.PropertyName)
                    .ToDictionary(g => g.Key, g => g.Select(e => e.ErrorMessage).ToArray());
                detail = "Verifique os erros de validação nos campos preenchidos.";
                break;

            default:
                _logger.LogError(exception, "Exceção não tratada na requisição {Method} {Path}", context.Request.Method, context.Request.Path);
                detail = _env.IsDevelopment()
                    ? $"{exception.GetType().Name}: {exception.Message} {(exception.InnerException != null ? "-> Inner: " + exception.InnerException.Message : "")}"
                    : "Ocorreu um erro inesperado. Por favor, tente novamente mais tarde.";
                break;
        }

        context.Response.ContentType = "application/problem+json";
        context.Response.StatusCode = (int)statusCode;

        var problemDetails = new ProblemDetails
        {
            Status = (int)statusCode,
            Title = title,
            Detail = detail,
            Instance = context.Request.Path
        };

        if (errors != null)
        {
            problemDetails.Extensions["errors"] = errors;
        }

        var json = JsonSerializer.Serialize(problemDetails, new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
            WriteIndented = false
        });

        await context.Response.WriteAsync(json);
    }
}
