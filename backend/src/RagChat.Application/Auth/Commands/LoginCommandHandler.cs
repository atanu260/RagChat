using MediatR;
using RagChat.Application.Abstractions;
using RagChat.Application.Common;

namespace RagChat.Application.Auth.Commands;

public sealed class LoginCommandHandler(
    IUserRepository userRepository,
    IPasswordHasher passwordHasher,
    IJwtTokenService jwtTokenService)
    : IRequestHandler<LoginCommand, AuthTokenDto>
{
    public async Task<AuthTokenDto> Handle(LoginCommand request, CancellationToken cancellationToken)
    {
        var user = await userRepository.GetByEmailAsync(request.Email.Trim().ToLowerInvariant(), cancellationToken);
        if (user is null
            || !await passwordHasher.VerifyAsync(request.Password, user.PasswordHash, cancellationToken))
        {
            throw new UnauthorizedAccessException("The email or password is incorrect.");
        }

        var token = await jwtTokenService.GenerateTokenAsync(user, cancellationToken);
        return new AuthTokenDto(token);
    }
}
