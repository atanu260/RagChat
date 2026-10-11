using System.ComponentModel.DataAnnotations;

namespace RagChat.Api.Contracts;

/// <summary>Credentials for signing in to an account.</summary>
public sealed record LoginRequest
{
    [Required, EmailAddress, MaxLength(320)]
    public required string Email { get; init; }

    [Required, MaxLength(72)]
    public required string Password { get; init; }
}
