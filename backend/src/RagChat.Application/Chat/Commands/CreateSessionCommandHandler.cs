using MediatR;
using RagChat.Application.Abstractions;
using RagChat.Application.Common;
using RagChat.Domain.Entities;

namespace RagChat.Application.Chat.Commands;

public sealed class CreateSessionCommandHandler(
    ICurrentUser currentUser,
    IChatRepository chatRepository,
    IUnitOfWork unitOfWork)
    : IRequestHandler<CreateSessionCommand, ChatSessionDto>
{
    public async Task<ChatSessionDto> Handle(CreateSessionCommand request, CancellationToken cancellationToken)
    {
        if (currentUser.UserId == Guid.Empty)
        {
            throw new ForbiddenException("An authenticated user is required.");
        }

        var session = new ChatSession(currentUser.UserId, request.Title);
        await chatRepository.AddSessionAsync(session, cancellationToken);
        await unitOfWork.SaveChangesAsync(cancellationToken);

        return new ChatSessionDto(session.Id, session.Title, session.CreatedAt, session.UpdatedAt);
    }
}
