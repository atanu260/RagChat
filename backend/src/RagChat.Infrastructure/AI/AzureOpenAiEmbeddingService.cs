using Azure;
using Azure.AI.OpenAI;
using Azure.Core;
using Microsoft.Extensions.Options;
using OpenAI.Embeddings;
using RagChat.Application.Abstractions;

namespace RagChat.Infrastructure.AI;

public sealed class AzureOpenAiEmbeddingService : IEmbeddingService
{
    private const int MaximumAttempts = 4;
    private readonly EmbeddingClient _client;

    public AzureOpenAiEmbeddingService(IOptions<AzureOpenAiOptions> options)
    {
        var settings = options.Value;
        _client = new AzureOpenAIClient(
            new Uri(settings.Endpoint),
            new AzureKeyCredential(settings.ApiKey))
            .GetEmbeddingClient(settings.EmbeddingDeployment);
    }

    public async Task<float[]> EmbedAsync(string text, CancellationToken cancellationToken)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(text);
        var embeddings = await GenerateWithRetryAsync([text], cancellationToken);
        return embeddings[0];
    }

    public async Task<IReadOnlyList<float[]>> EmbedBatchAsync(
        IEnumerable<string> texts,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(texts);
        var batch = texts.ToArray();
        if (batch.Length == 0)
        {
            return [];
        }

        if (batch.Any(string.IsNullOrWhiteSpace))
        {
            throw new ArgumentException("Embedding inputs cannot contain empty text.", nameof(texts));
        }

        return await GenerateWithRetryAsync(batch, cancellationToken);
    }

    private async Task<IReadOnlyList<float[]>> GenerateWithRetryAsync(
        string[] inputs,
        CancellationToken cancellationToken)
    {
        for (var attempt = 1; ; attempt++)
        {
            try
            {
                var response = await _client.GenerateEmbeddingsAsync(inputs, cancellationToken: cancellationToken);
                return response.Value.Select(embedding => embedding.ToFloats().ToArray()).ToArray();
            }
            catch (RequestFailedException exception) when (exception.Status == 429 && attempt < MaximumAttempts)
            {
                var delay = TimeSpan.FromMilliseconds(250 * Math.Pow(2, attempt - 1));
                await Task.Delay(delay, cancellationToken);
            }
        }
    }
}
