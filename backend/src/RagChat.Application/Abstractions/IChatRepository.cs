using RagChat.Domain.Entities;

namespace RagChat.Application.Abstractions;

public interface IChatRepository
{
    Task<ChatSession?> GetSessionByIdForUserAsync(Guid sessionId, Guid userId, CancellationToken cancellationToken);

    Task<IReadOnlyList<ChatSession>> GetSessionsByUserIdAsync(Guid userId, CancellationToken cancellationToken);

    Task<IReadOnlyList<ChatMessage>> GetMessagesAsync(Guid sessionId, CancellationToken cancellationToken);

    Task AddSessionAsync(ChatSession chatSession, CancellationToken cancellationToken);

    Task AddMessageAsync(ChatMessage chatMessage, CancellationToken cancellationToken);
}
