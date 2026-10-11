using RagChat.Domain.Entities;

namespace RagChat.Application.Abstractions;

public interface IChunkRepository
{
    Task AddRangeAsync(IEnumerable<DocumentChunk> chunks, CancellationToken cancellationToken);
}
