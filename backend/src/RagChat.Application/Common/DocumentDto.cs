using RagChat.Domain.Enums;

namespace RagChat.Application.Common;

public sealed record DocumentDto(
    Guid Id,
    string FileName,
    string ContentType,
    long SizeBytes,
    DocumentStatus Status,
    string? ErrorMessage,
    int? PageCount,
    DateTime CreatedAt,
    DateTime? UpdatedAt);
