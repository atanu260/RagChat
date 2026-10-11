using RagChat.Domain.Entities;

namespace RagChat.Application.Abstractions;

public interface IJwtTokenService
{
    Task<string> GenerateTokenAsync(User user, CancellationToken cancellationToken);
}
