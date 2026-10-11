using MediatR;
using RagChat.Application.Common;

namespace RagChat.Application.Chat.Commands;

public sealed record AskQuestionCommand(
    Guid SessionId,
    string Question,
    Guid[]? DocumentIds = null) : IRequest<IAsyncEnumerable<ChatStreamEvent>>;
