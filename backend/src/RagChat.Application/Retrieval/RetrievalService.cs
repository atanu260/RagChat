using RagChat.Application.Abstractions;
using RagChat.Domain.ValueObjects;

namespace RagChat.Application.Retrieval;

public sealed class RetrievalService(IEmbeddingService embeddingService, IVectorStore vectorStore)
{
    public async Task<IReadOnlyList<SearchResult>> SearchAsync(
        string question,
        Guid userId,
        Guid[]? documentIds,
        CancellationToken cancellationToken)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(question);
        if (userId == Guid.Empty)
        {
            throw new ArgumentException("A user ID is required.", nameof(userId));
        }

        var embedding = await embeddingService.EmbedAsync(question, cancellationToken);
        if (embedding.Length == 0 || embedding.Any(value => !float.IsFinite(value)))
        {
            throw new InvalidOperationException("The embedding service returned an invalid query embedding.");
        }

        return await vectorStore.SearchAsync(embedding, userId, 5, documentIds, cancellationToken);
    }
}
