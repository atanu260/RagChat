namespace RagChat.Application.Common;

public sealed record ChatSessionDto(Guid Id, string Title, DateTime CreatedAt, DateTime? UpdatedAt);
