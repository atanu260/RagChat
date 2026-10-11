using MediatR;
using RagChat.Application.Abstractions;
using RagChat.Application.Common;

namespace RagChat.Application.Chat.Queries;

public sealed class GetMessagesQueryHandler(
    ICurrentUser currentUser,
    IChatRepository chatRepository)
    : IRequestHandler<GetMessagesQuery, IReadOnlyList<ChatMessageDto>>
{
    public async Task<IReadOnlyList<ChatMessageDto>> Handle(
        GetMessagesQuery request,
        CancellationToken cancellationToken)
    {
        var session = await chatRepository.GetSessionByIdForUserAsync(
            request.SessionId,
            currentUser.UserId,
            cancellationToken);

        if (session is null)
        {
            throw new NotFoundException($"Chat session '{request.SessionId}' was not found.");
        }

        var messages = await chatRepository.GetMessagesAsync(session.Id, cancellationToken);
        return messages
            .Select(message => new ChatMessageDto(message.Id, message.Role, message.Content, message.CreatedAt))
            .ToArray();
    }
}
