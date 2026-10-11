using RagChat.Application.Abstractions;

namespace RagChat.Infrastructure.Identity;

public sealed class BcryptPasswordHasher : IPasswordHasher
{
    public Task<string> HashAsync(string password, CancellationToken cancellationToken)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(password);
        cancellationToken.ThrowIfCancellationRequested();
        return Task.FromResult(BCrypt.Net.BCrypt.HashPassword(password));
    }

    public Task<bool> VerifyAsync(
        string password,
        string passwordHash,
        CancellationToken cancellationToken)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(password);
        ArgumentException.ThrowIfNullOrWhiteSpace(passwordHash);
        cancellationToken.ThrowIfCancellationRequested();
        return Task.FromResult(BCrypt.Net.BCrypt.Verify(password, passwordHash));
    }
}
