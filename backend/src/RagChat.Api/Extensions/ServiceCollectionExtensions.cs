using System.Text;
using System.Threading.RateLimiting;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.OpenApi;
using Microsoft.OpenApi;
using Microsoft.IdentityModel.Tokens;
using RagChat.Application.Abstractions;
using RagChat.Api.Services;
using RagChat.Infrastructure.Identity;

namespace RagChat.Api.Extensions;

public static class ServiceCollectionExtensions
{
    public static IServiceCollection AddSwaggerWithJwt(this IServiceCollection services)
    {
        services.AddOpenApi(options =>
            options.AddDocumentTransformer((document, _, _) =>
            {
                var components = document.Components ??= new OpenApiComponents();
                var securitySchemes = components.SecuritySchemes
                    ??= new Dictionary<string, IOpenApiSecurityScheme>();
                securitySchemes["Bearer"] = new OpenApiSecurityScheme
                {
                    Type = SecuritySchemeType.Http,
                    Scheme = "bearer",
                    BearerFormat = "JWT",
                    Description = "Supply a JWT access token."
                };

                foreach (var path in document.Paths)
                {
                    if (path.Key.StartsWith("/api/auth/", StringComparison.OrdinalIgnoreCase)
                        || path.Value.Operations is not { } operations)
                    {
                        continue;
                    }

                    foreach (var operation in operations.Values)
                    {
                        var securityRequirements = operation.Security ??= [];
                        securityRequirements.Add(new OpenApiSecurityRequirement
                        {
                            [new OpenApiSecuritySchemeReference("Bearer", document)] = []
                        });
                    }
                }

                return Task.CompletedTask;
            }));

        return services;
    }

    public static IServiceCollection AddJwtAuth(this IServiceCollection services, IConfiguration configuration)
    {
        var jwtOptions = configuration.GetSection(JwtOptions.SectionName).Get<JwtOptions>()
            ?? throw new InvalidOperationException("JWT options are not configured.");

        if (string.IsNullOrWhiteSpace(jwtOptions.SecretKey)
            || Encoding.UTF8.GetByteCount(jwtOptions.SecretKey) < 32
            || string.IsNullOrWhiteSpace(jwtOptions.Issuer)
            || string.IsNullOrWhiteSpace(jwtOptions.Audience))
        {
            throw new InvalidOperationException("JWT issuer, audience, and a 32-byte signing key must be configured.");
        }

        var signingKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtOptions.SecretKey));
        services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
            .AddJwtBearer(options =>
            {
                options.TokenValidationParameters = new TokenValidationParameters
                {
                    ValidateIssuer = true,
                    ValidIssuer = jwtOptions.Issuer,
                    ValidateAudience = true,
                    ValidAudience = jwtOptions.Audience,
                    ValidateIssuerSigningKey = true,
                    IssuerSigningKey = signingKey,
                    ValidateLifetime = true,
                    ClockSkew = TimeSpan.FromSeconds(30),
                    NameClaimType = System.Security.Claims.ClaimTypes.Name
                };
            });
        services.AddAuthorization();
        services.AddHttpContextAccessor();
        services.AddScoped<ICurrentUser, CurrentUser>();

        return services;
    }

    public static IServiceCollection AddCorsForAngular(this IServiceCollection services)
    {
        services.AddCors(options => options.AddPolicy("Angular", policy =>
            policy.WithOrigins("http://localhost:4200")
                .AllowAnyHeader()
                .AllowAnyMethod()));

        return services;
    }

    public static IServiceCollection AddRateLimiting(this IServiceCollection services)
    {
        services.AddRateLimiter(options =>
        {
            options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
            options.GlobalLimiter = PartitionedRateLimiter.Create<HttpContext, string>(
                context => CreateFixedWindowLimiter(
                    context,
                    permitLimit: 120,
                    window: TimeSpan.FromMinutes(1)));
            options.AddPolicy("chat", context => CreateFixedWindowLimiter(
                context,
                permitLimit: 10,
                window: TimeSpan.FromMinutes(1)));
        });

        return services;
    }

    private static RateLimitPartition<string> CreateFixedWindowLimiter(
        HttpContext context,
        int permitLimit,
        TimeSpan window)
    {
        var partitionKey = context.User.Identity?.IsAuthenticated == true
            ? context.User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value
                ?? context.Connection.RemoteIpAddress?.ToString()
                ?? "unknown"
            : context.Connection.RemoteIpAddress?.ToString() ?? "unknown";

        return RateLimitPartition.GetFixedWindowLimiter(
            partitionKey,
            _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = permitLimit,
                Window = window,
                QueueLimit = 0,
                AutoReplenishment = true
            });
    }
}
