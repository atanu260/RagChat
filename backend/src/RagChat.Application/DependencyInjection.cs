using FluentValidation;
using MediatR;
using Microsoft.Extensions.DependencyInjection;
using RagChat.Application.Behaviors;
using RagChat.Application.Ingestion;
using RagChat.Application.Retrieval;

namespace RagChat.Application;

public static class DependencyInjection
{
    public static IServiceCollection AddApplication(this IServiceCollection services)
    {
        ArgumentNullException.ThrowIfNull(services);

        var assembly = typeof(DependencyInjection).Assembly;
        services.AddMediatR(configuration => configuration.RegisterServicesFromAssembly(assembly));
        services.AddValidatorsFromAssembly(assembly);
        services.AddTransient(typeof(IPipelineBehavior<,>), typeof(LoggingBehavior<,>));
        services.AddTransient(typeof(IPipelineBehavior<,>), typeof(ValidationBehavior<,>));
        services.AddTransient<IngestDocumentService>();
        services.AddSingleton<PromptBuilder>();
        services.AddTransient<RetrievalService>();

        return services;
    }
}
