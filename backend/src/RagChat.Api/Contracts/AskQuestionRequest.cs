using System.ComponentModel.DataAnnotations;

namespace RagChat.Api.Contracts;

/// <summary>Question and optional document filters for a chat session.</summary>
public sealed record AskQuestionRequest
{
    [Required, MaxLength(10000)]
    public required string Question { get; init; }

    public Guid[]? DocumentIds { get; init; }
}
