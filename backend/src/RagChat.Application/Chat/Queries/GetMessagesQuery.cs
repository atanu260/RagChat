using MediatR;
using RagChat.Application.Common;

namespace RagChat.Application.Chat.Queries;

public sealed record GetMessagesQuery(Guid SessionId) : IRequest<IReadOnlyList<ChatMessageDto>>;
