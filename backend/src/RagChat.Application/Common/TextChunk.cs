namespace RagChat.Application.Common;

public sealed record TextChunk(string Content, int? PageNumber, int TokenCount);
