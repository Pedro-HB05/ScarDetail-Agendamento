using System.Text;
using System.Threading.RateLimiting;
using FluentValidation;
using FluentValidation.AspNetCore;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi;
using Scalar.AspNetCore;
using ScarDetail.API.Application.Services;
using ScarDetail.API.Infrastructure.Data;
using ScarDetail.API.Infrastructure.ExternalServices;
using ScarDetail.API.Infrastructure.Security;
using Microsoft.AspNetCore.RateLimiting;
using ScarDetail.API.Application.Validators;
using ScarDetail.API.Middlewares;

var builder = WebApplication.CreateBuilder(args);

// 1. Configuração do Banco de Dados PostgreSQL (EF Core)
var rawConn = builder.Configuration.GetConnectionString("DefaultConnection");
if (string.IsNullOrWhiteSpace(rawConn))
    throw new InvalidOperationException(
        "A conexão não foi configurada. Defina ConnectionStrings__DefaultConnection por variável de ambiente ou User Secrets.");

var connectionString = rawConn;
if (connectionString.StartsWith("postgresql://", StringComparison.OrdinalIgnoreCase) ||
    connectionString.StartsWith("postgres://", StringComparison.OrdinalIgnoreCase))
{
    var uri = new Uri(connectionString);
    var userInfo = uri.UserInfo.Split(':');
    var username = userInfo.Length > 0 ? Uri.UnescapeDataString(userInfo[0]) : "neondb_owner";
    var password = userInfo.Length > 1 ? Uri.UnescapeDataString(userInfo[1]) : "";
    var port = uri.Port > 0 ? uri.Port : 5432;
    var database = uri.AbsolutePath.TrimStart('/');
    connectionString = $"Host={uri.Host};Port={port};Database={database};Username={username};Password={password};SslMode=Require;Trust Server Certificate=true;";
}

builder.Services.AddDbContext<AppDbContext>(options =>
{
    options.UseNpgsql(connectionString, npgsqlOptions =>
    {
        npgsqlOptions.EnableRetryOnFailure(3);
    });
});

// 2. Injeção de Dependências de Segurança e Serviços de Domínio
builder.Services.AddScoped<IPasswordHasher, PasswordHasher>();
builder.Services.AddScoped<ITokenService, TokenService>();
builder.Services.AddHttpClient<IViaCepService, ViaCepService>(client =>
{
    client.Timeout = TimeSpan.FromSeconds(8);
});

builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IVehicleService, VehicleService>();
builder.Services.AddScoped<IAddressService, AddressService>();
builder.Services.AddScoped<IServicePlanService, ServicePlanService>();
builder.Services.AddScoped<INeighborhoodService, NeighborhoodService>();
builder.Services.AddScoped<IBusinessHourService, BusinessHourService>();
builder.Services.AddScoped<IAgendaBlockService, AgendaBlockService>();
builder.Services.AddScoped<ISchedulingEngine, SchedulingEngine>();
builder.Services.AddScoped<IAppointmentService, AppointmentService>();
builder.Services.AddScoped<IPaymentService, PaymentService>();
builder.Services.AddScoped<IReportService, ReportService>();

// 3. FluentValidation
builder.Services.AddValidatorsFromAssemblyContaining<RegisterDtoValidator>();
builder.Services.AddFluentValidationAutoValidation();

// 4. Autenticação JWT Bearer
var jwtSecretKey = builder.Configuration["Jwt:SecretKey"];
if (string.IsNullOrWhiteSpace(jwtSecretKey) || Encoding.UTF8.GetByteCount(jwtSecretKey) < 32)
    throw new InvalidOperationException(
        "Jwt:SecretKey deve ser configurada fora do código e conter pelo menos 32 bytes.");
var jwtIssuer = builder.Configuration["Jwt:Issuer"] ?? "ScarDetail.API";
var jwtAudience = builder.Configuration["Jwt:Audience"] ?? "ScarDetail.App";

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.RequireHttpsMetadata = !builder.Environment.IsDevelopment();
    options.SaveToken = true;
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuerSigningKey = true,
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecretKey)),
        ValidateIssuer = true,
        ValidIssuer = jwtIssuer,
        ValidateAudience = true,
        ValidAudience = jwtAudience,
        ValidateLifetime = true,
        ClockSkew = TimeSpan.Zero
    };
});

builder.Services.AddAuthorization();

// 5. Rate Limiting no Login
builder.Services.AddRateLimiter(options =>
{
    options.AddPolicy("login-policy", httpContext =>
        RateLimitPartition.GetFixedWindowLimiter(
            httpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown",
            _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = 5,
                Window = TimeSpan.FromMinutes(1),
                QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
                QueueLimit = 0
            }));

    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
});

// 6. Configuração de CORS (Permite frontend Vite React)
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        var allowedOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>()
            ?? ["http://localhost:5173"];
        policy.WithOrigins(allowedOrigins)
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

// 7. Controllers e Serialização JSON
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.Converters.Add(new System.Text.Json.Serialization.JsonStringEnumConverter());
    });

// 8. Swagger / OpenAPI e Scalar UI
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "ScarDetail API",
        Version = "v1",
        Description = "API de Agendamento para Estética Automotiva a Domicílio"
    });

    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Description = "Autenticação JWT via cabeçalho Authorization. Exemplo: 'Bearer {seu_token}'",
        Name = "Authorization",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.ApiKey,
        Scheme = "Bearer",
        BearerFormat = "JWT"
    });

    c.AddSecurityRequirement(_ => new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecuritySchemeReference("Bearer"),
            new List<string>()
        }
    });
});

builder.Services.AddOpenApi();

var app = builder.Build();

// Manutenção local e explícita para substituir o acesso do proprietário sem apagar
// registros históricos vinculados ao usuário administrativo anterior.
if (args.Contains("--reset-owner-login", StringComparer.OrdinalIgnoreCase))
{
    using var maintenanceScope = app.Services.CreateScope();
    var maintenanceContext = maintenanceScope.ServiceProvider.GetRequiredService<AppDbContext>();
    var maintenanceLogger = maintenanceScope.ServiceProvider.GetRequiredService<ILogger<Program>>();
    var previousOwners = await maintenanceContext.Usuarios
        .Where(user => user.Role == ScarDetail.API.Domain.Enums.UserRole.Admin)
        .ToListAsync();

    foreach (var previousOwner in previousOwners)
    {
        previousOwner.Role = ScarDetail.API.Domain.Enums.UserRole.Client;
        previousOwner.Ativo = false;
        previousOwner.Email = $"archived-owner-{previousOwner.Id:N}@invalid.local";
        previousOwner.Nome = $"{previousOwner.Nome} (acesso anterior)";
    }

    var previousOwnerIds = previousOwners.Select(user => user.Id).ToList();
    if (previousOwnerIds.Count > 0)
    {
        var activeTokens = await maintenanceContext.RefreshTokens
            .Where(token => previousOwnerIds.Contains(token.UsuarioId) && !token.Revogado)
            .ToListAsync();
        foreach (var token in activeTokens)
        {
            token.Revogado = true;
        }

        await maintenanceContext.SaveChangesAsync();
    }

    maintenanceLogger.LogInformation(
        "Acesso administrativo anterior arquivado. A configuração do novo proprietário está liberada.");
    return;
}

// Pipeline de Middleware HTTP
app.UseMiddleware<GlobalExceptionMiddleware>();

// Habilitar Swagger e Swagger UI
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "ScarDetail API v1");
        c.RoutePrefix = "swagger";
    });
    app.MapOpenApi();
    app.MapScalarApiReference(options =>
    {
        options.WithTitle("ScarDetail API - Estética Automotiva a Domicílio");
        options.WithTheme(ScalarTheme.Moon);
        options.WithDefaultHttpClient(ScalarTarget.CSharp, ScalarClient.HttpClient);
    });
}

// Redirecionamento da raiz '/' para o Swagger UI
app.MapGet("/", (IHostEnvironment env) => env.IsDevelopment()
    ? Results.Redirect("/swagger")
    : Results.Ok(new { service = "ScarDetail API", status = "online" }));

app.UseCors("AllowFrontend");
app.UseRateLimiter();
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

// Seeds são opt-in. A aplicação nunca cria ou apaga schema automaticamente.
if (builder.Configuration.GetValue<bool>("Database:SeedOnStartup"))
{
    using var scope = app.Services.CreateScope();
    var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    var logger = scope.ServiceProvider.GetRequiredService<ILogger<Program>>();
    await DbInitializer.SeedReferenceDataAsync(dbContext, logger);
}

app.Run();

// Tornar a classe Program acessível para testes de integração
public partial class Program { }
