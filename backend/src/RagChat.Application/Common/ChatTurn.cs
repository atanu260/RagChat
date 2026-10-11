using RagChat.Domain.Enums;

namespace RagChat.Application.Common;

public sealed record ChatTurn(MessageRole Role, string Content);
