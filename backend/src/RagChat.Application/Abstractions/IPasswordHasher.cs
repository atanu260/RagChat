namespace RagChat.Application.Abstractions;

public interface IPasswordHasher
{
    Task<string> HashAsync(string password, CancellationToken cancellationToken);

    Task<bool> VerifyAsync(string password, string passwordHash, CancellationToken cancellationToken);
}
