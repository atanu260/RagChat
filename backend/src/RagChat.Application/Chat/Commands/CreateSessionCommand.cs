using MediatR;
using RagChat.Application.Common;

namespace RagChat.Application.Chat.Commands;

public sealed record CreateSessionCommand(string Title) : IRequest<ChatSessionDto>;
