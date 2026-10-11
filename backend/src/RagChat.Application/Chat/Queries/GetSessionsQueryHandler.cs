using MediatR;
using RagChat.Application.Abstractions;
using RagChat.Application.Common;

namespace RagChat.Application.Chat.Queries;

public sealed class GetSessionsQueryHandler(
    ICurrentUser currentUser,
    IChatRepository chatRepository)
    : IRequestHandler<GetSessionsQuery, IReadOnlyList<ChatSessionDto>>
{
    public async Task<IReadOnlyList<ChatSessionDto>> Handle(
        GetSessionsQuery request,
        CancellationToken cancellationToken)
    {
        var sessions = await chatRepository.GetSessionsByUserIdAsync(currentUser.UserId, cancellationToken);
        return sessions
            .Select(session => new ChatSessionDto(session.Id, session.Title, session.CreatedAt, session.UpdatedAt))
            .ToArray();
    }
}
