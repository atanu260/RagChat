using MediatR;
using RagChat.Application.Abstractions;
using RagChat.Application.Common;
using RagChat.Domain.Entities;

namespace RagChat.Application.Auth.Commands;

public sealed class RegisterCommandHandler(
    IUserRepository userRepository,
    IPasswordHasher passwordHasher,
    IJwtTokenService jwtTokenService,
    IUnitOfWork unitOfWork)
    : IRequestHandler<RegisterCommand, AuthTokenDto>
{
    public async Task<AuthTokenDto> Handle(RegisterCommand request, CancellationToken cancellationToken)
    {
        var email = request.Email.Trim().ToLowerInvariant();
        if (await userRepository.GetByEmailAsync(email, cancellationToken) is not null)
        {
            throw new ConflictException("An account with this email already exists.");
        }

        var passwordHash = await passwordHasher.HashAsync(request.Password, cancellationToken);
        var user = new User(email, passwordHash, request.DisplayName);
        await userRepository.AddAsync(user, cancellationToken);
        await unitOfWork.SaveChangesAsync(cancellationToken);

        var token = await jwtTokenService.GenerateTokenAsync(user, cancellationToken);
        return new AuthTokenDto(token);
    }
}
