using MediatR;
using RagChat.Application.Common;

namespace RagChat.Application.Auth.Commands;

public sealed record RegisterCommand(string Email, string Password, string DisplayName) : IRequest<AuthTokenDto>;
