using Microsoft.EntityFrameworkCore;
using RagChat.Application.Abstractions;
using RagChat.Domain.Entities;
using RagChat.Domain.Enums;
using RagChat.Domain.ValueObjects;
using RagChat.Infrastructure.Persistence;

namespace RagChat.Infrastructure.VectorStore;

public sealed class SqlServerVectorStore(ApplicationDbContext dbContext) : IVectorStore
{
    public async Task UpsertChunksAsync(IEnumerable<DocumentChunk> chunks, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(chunks);
        var chunkArray = chunks.ToArray();
        if (chunkArray.Length == 0)
        {
            return;
        }

        var ids = chunkArray.Select(chunk => chunk.Id).ToArray();
        var existing = await dbContext.DocumentChunks
            .Where(chunk => ids.Contains(chunk.Id))
            .ToDictionaryAsync(chunk => chunk.Id, cancellationToken);

        foreach (var chunk in chunkArray)
        {
            if (existing.TryGetValue(chunk.Id, out var stored))
            {
                dbContext.Entry(stored).CurrentValues.SetValues(chunk);
            }
            else
            {
                await dbContext.DocumentChunks.AddAsync(chunk, cancellationToken);
            }
        }

        await dbContext.SaveChangesAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<SearchResult>> SearchAsync(
        float[] queryEmbedding,
        Guid userId,
        int topK,
        Guid[]? documentIds,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(queryEmbedding);
        if (queryEmbedding.Length == 0 || queryEmbedding.Any(value => !float.IsFinite(value)))
        {
            throw new ArgumentException("The query embedding must contain finite values.", nameof(queryEmbedding));
        }

        if (userId == Guid.Empty)
        {
            throw new ArgumentException("A user ID is required.", nameof(userId));
        }

        if (topK <= 0)
        {
            throw new ArgumentOutOfRangeException(nameof(topK), "The result count must be greater than zero.");
        }

        // This implementation can be swapped for SQL Server's native VECTOR type or Azure AI Search behind this interface.
        var candidatesQuery =
            from chunk in dbContext.DocumentChunks.AsNoTracking()
            join document in dbContext.Documents.AsNoTracking() on chunk.DocumentId equals document.Id
            where document.UserId == userId && document.Status == DocumentStatus.Ready
            select new
            {
                chunk.Id,
                chunk.DocumentId,
                DocumentName = document.FileName,
                chunk.Content,
                chunk.PageNumber,
                chunk.Embedding
            };

        if (documentIds is not null)
        {
            candidatesQuery = candidatesQuery.Where(candidate => documentIds.Contains(candidate.DocumentId));
        }

        var candidates = await candidatesQuery
            .ToArrayAsync(cancellationToken);

        return candidates
            .Select(candidate =>
            {
                var candidateEmbedding = FromBytes(candidate.Embedding);
                return new SearchResult(
                    candidate.Id,
                    candidate.DocumentId,
                    candidate.DocumentName,
                    candidate.Content,
                    candidate.PageNumber,
                    CosineSimilarity(queryEmbedding, candidateEmbedding));
            })
            .Where(result => double.IsFinite(result.Score))
            .OrderByDescending(result => result.Score)
            .Take(topK)
            .ToArray();
    }

    private static float[] FromBytes(byte[] bytes)
    {
        if (bytes.Length == 0 || bytes.Length % sizeof(float) != 0)
        {
            return [];
        }

        var floats = new float[bytes.Length / sizeof(float)];
        Buffer.BlockCopy(bytes, 0, floats, 0, bytes.Length);
        return floats;
    }

    private static double CosineSimilarity(float[] left, float[] right)
    {
        if (left.Length == 0 || left.Length != right.Length)
        {
            return double.NaN;
        }

        double dotProduct = 0;
        double leftMagnitude = 0;
        double rightMagnitude = 0;
        for (var index = 0; index < left.Length; index++)
        {
            if (!float.IsFinite(right[index]))
            {
                return double.NaN;
            }

            dotProduct += left[index] * right[index];
            leftMagnitude += left[index] * left[index];
            rightMagnitude += right[index] * right[index];
        }

        if (leftMagnitude == 0 || rightMagnitude == 0)
        {
            return double.NaN;
        }

        return dotProduct / (Math.Sqrt(leftMagnitude) * Math.Sqrt(rightMagnitude));
    }
}
