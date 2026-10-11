using RagChat.Domain.Entities;
using RagChat.Domain.ValueObjects;

namespace RagChat.Application.Abstractions;

public interface IVectorStore
{
    Task UpsertChunksAsync(IEnumerable<DocumentChunk> chunks, CancellationToken cancellationToken);

    Task<IReadOnlyList<SearchResult>> SearchAsync(
        float[] queryEmbedding,
        Guid userId,
        int topK,
        Guid[]? documentIds,
        CancellationToken cancellationToken);
}
