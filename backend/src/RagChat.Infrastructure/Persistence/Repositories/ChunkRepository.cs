using Microsoft.EntityFrameworkCore;
using RagChat.Application.Abstractions;
using RagChat.Domain.Entities;

namespace RagChat.Infrastructure.Persistence.Repositories;

public sealed class ChunkRepository(ApplicationDbContext dbContext) : IChunkRepository
{
    public async Task AddRangeAsync(IEnumerable<DocumentChunk> chunks, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(chunks);
        await dbContext.DocumentChunks.AddRangeAsync(chunks, cancellationToken);
    }
}
