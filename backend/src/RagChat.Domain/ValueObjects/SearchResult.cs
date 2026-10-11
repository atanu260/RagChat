namespace RagChat.Domain.ValueObjects;

public sealed record SearchResult(
    Guid ChunkId,
    Guid DocumentId,
    string DocumentName,
    string Content,
    int? PageNumber,
    double Score);
