using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using RagChat.Application.Abstractions;
using RagChat.Infrastructure.AI;
using RagChat.Infrastructure.BackgroundJobs;
using RagChat.Infrastructure.Chunking;
using RagChat.Infrastructure.Identity;
using RagChat.Infrastructure.Parsing;
using RagChat.Infrastructure.Persistence;
using RagChat.Infrastructure.Persistence.Repositories;
using RagChat.Infrastructure.Storage;
using RagChat.Infrastructure.VectorStore;

namespace RagChat.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        ArgumentNullException.ThrowIfNull(services);
        ArgumentNullException.ThrowIfNull(configuration);

        var connectionString = configuration.GetConnectionString("Default");
        if (string.IsNullOrWhiteSpace(connectionString))
        {
            throw new InvalidOperationException("The 'Default' database connection string is not configured.");
        }

        services.AddDbContext<ApplicationDbContext>(options => options.UseSqlServer(connectionString));

        services.Configure<AzureOpenAiOptions>(configuration.GetSection(AzureOpenAiOptions.SectionName));
        services.Configure<JwtOptions>(configuration.GetSection(JwtOptions.SectionName));
        services.Configure<LocalFileStorageOptions>(configuration.GetSection(LocalFileStorageOptions.SectionName));
        services.Configure<SentenceAwareChunkingOptions>(
            configuration.GetSection(SentenceAwareChunkingOptions.SectionName));
        services.Configure<ChannelIngestionQueueOptions>(
            configuration.GetSection(ChannelIngestionQueueOptions.SectionName));

        services.AddScoped<IDocumentRepository, DocumentRepository>();
        services.AddScoped<IChunkRepository, ChunkRepository>();
        services.AddScoped<IChatRepository, ChatRepository>();
        services.AddScoped<IUserRepository, UserRepository>();
        services.AddScoped<IUnitOfWork, UnitOfWork>();

        services.AddScoped<IEmbeddingService, AzureOpenAiEmbeddingService>();
        services.AddScoped<IChatCompletionService, AzureOpenAiChatService>();
        services.AddScoped<IVectorStore, SqlServerVectorStore>();
        services.AddScoped<IDocumentParser, PdfDocumentParser>();
        services.AddScoped<IDocumentParser, DocxDocumentParser>();
        services.AddScoped<IDocumentParser, TextDocumentParser>();
        services.AddScoped<IChunkingStrategy, SentenceAwareChunker>();
        services.AddScoped<IFileStorage, LocalFileStorage>();
        services.AddSingleton<IIngestionQueue, ChannelIngestionQueue>();
        services.AddScoped<IJwtTokenService, JwtTokenService>();
        services.AddScoped<IPasswordHasher, BcryptPasswordHasher>();
        services.AddHostedService<IngestionWorker>();

        return services;
    }
}
