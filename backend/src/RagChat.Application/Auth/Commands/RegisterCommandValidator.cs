using FluentValidation;

namespace RagChat.Application.Auth.Commands;

public sealed class RegisterCommandValidator : AbstractValidator<RegisterCommand>
{
    public RegisterCommandValidator()
    {
        RuleFor(command => command.Email)
            .NotEmpty()
            .EmailAddress()
            .MaximumLength(320);
        RuleFor(command => command.Password)
            .NotEmpty()
            .MinimumLength(8)
            .MaximumLength(72);
        RuleFor(command => command.DisplayName)
            .NotEmpty()
            .MaximumLength(100);
    }
}
