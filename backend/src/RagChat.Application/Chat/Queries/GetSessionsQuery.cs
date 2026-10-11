using MediatR;
using RagChat.Application.Common;

namespace RagChat.Application.Chat.Queries;

public sealed record GetSessionsQuery : IRequest<IReadOnlyList<ChatSessionDto>>;
