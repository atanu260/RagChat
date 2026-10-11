using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using RagChat.Application.Abstractions;
using RagChat.Application.Ingestion;

namespace RagChat.Infrastructure.BackgroundJobs;

public sealed class IngestionWorker(
    IIngestionQueue ingestionQueue,
    IServiceScopeFactory scopeFactory,
    ILogger<IngestionWorker> logger) : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            Guid documentId;
            try
            {
                documentId = await ingestionQueue.DequeueAsync(stoppingToken);
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                break;
            }

            try
            {
                await using var scope = scopeFactory.CreateAsyncScope();
                var ingestionService = scope.ServiceProvider.GetRequiredService<IngestDocumentService>();
                await ingestionService.IngestAsync(documentId, stoppingToken);
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                break;
            }
            catch (Exception exception)
            {
                logger.LogError(exception, "Background ingestion failed for document {DocumentId}.", documentId);
            }
        }
    }
}
