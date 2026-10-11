using RagChat.Domain.Enums;

namespace RagChat.Application.Common;

public sealed record ChatMessageDto(Guid Id, MessageRole Role, string Content, DateTime CreatedAt);
