using RagChat.Domain.ValueObjects;

namespace RagChat.Application.Common;

public sealed record ChatStreamEvent(
    ChatStreamEventType Type,
    string? Token = null,
    IReadOnlyList<SearchResult>? Citations = null);
