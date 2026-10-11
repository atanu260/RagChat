using System.ComponentModel.DataAnnotations;

namespace RagChat.Api.Contracts;

/// <summary>Title for a new chat session.</summary>
public sealed record CreateSessionRequest
{
    [Required, MaxLength(200)]
    public required string Title { get; init; }
}
