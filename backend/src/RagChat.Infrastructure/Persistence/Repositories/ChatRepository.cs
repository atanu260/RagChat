using Microsoft.EntityFrameworkCore;
using RagChat.Application.Abstractions;
using RagChat.Domain.Entities;

namespace RagChat.Infrastructure.Persistence.Repositories;

public sealed class ChatRepository(ApplicationDbContext dbContext) : IChatRepository
{
    public Task<ChatSession?> GetSessionByIdForUserAsync(
        Guid sessionId,
        Guid userId,
        CancellationToken cancellationToken) =>
        dbContext.ChatSessions.AsNoTracking().SingleOrDefaultAsync(
            session => session.Id == sessionId && session.UserId == userId,
            cancellationToken);

    public async Task<IReadOnlyList<ChatSession>> GetSessionsByUserIdAsync(
        Guid userId,
        CancellationToken cancellationToken) =>
        await dbContext.ChatSessions.AsNoTracking()
            .Where(session => session.UserId == userId)
            .OrderByDescending(session => session.UpdatedAt ?? session.CreatedAt)
            .ToArrayAsync(cancellationToken);

    public async Task<IReadOnlyList<ChatMessage>> GetMessagesAsync(
        Guid sessionId,
        CancellationToken cancellationToken) =>
        await dbContext.ChatMessages.AsNoTracking()
            .Where(message => message.SessionId == sessionId)
            .OrderBy(message => message.CreatedAt)
            .ToArrayAsync(cancellationToken);

    public Task AddSessionAsync(ChatSession chatSession, CancellationToken cancellationToken) =>
        dbContext.ChatSessions.AddAsync(chatSession, cancellationToken).AsTask();

    public Task AddMessageAsync(ChatMessage chatMessage, CancellationToken cancellationToken) =>
        dbContext.ChatMessages.AddAsync(chatMessage, cancellationToken).AsTask();
}
