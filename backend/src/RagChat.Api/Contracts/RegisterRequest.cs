using System.ComponentModel.DataAnnotations;

namespace RagChat.Api.Contracts;

/// <summary>Credentials and profile data for creating an account.</summary>
public sealed record RegisterRequest
{
    [Required, EmailAddress, MaxLength(320)]
    public required string Email { get; init; }

    [Required, MinLength(8), MaxLength(72)]
    public required string Password { get; init; }

    [Required, MaxLength(100)]
    public required string DisplayName { get; init; }
}
