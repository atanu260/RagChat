using MediatR;
using RagChat.Application.Common;

namespace RagChat.Application.Auth.Commands;

public sealed record LoginCommand(string Email, string Password) : IRequest<AuthTokenDto>;
