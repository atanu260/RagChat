using FluentValidation;

namespace RagChat.Application.Documents.Commands;

public sealed class UploadDocumentCommandValidator : AbstractValidator<UploadDocumentCommand>
{
    private const long MaximumFileSizeBytes = 20 * 1024 * 1024;
    private static readonly HashSet<string> AllowedContentTypes =
    [
        "application/pdf",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "text/plain"
    ];

    public UploadDocumentCommandValidator()
    {
        RuleFor(command => command.Content)
            .NotNull();

        RuleFor(command => command.FileName)
            .NotEmpty()
            .Must(fileName => !string.IsNullOrWhiteSpace(Path.GetFileName(fileName)))
            .WithMessage("A valid file name is required.");

        RuleFor(command => command.ContentType)
            .NotEmpty()
            .Must(contentType => AllowedContentTypes.Contains(contentType.Trim().ToLowerInvariant()))
            .WithMessage("Only PDF, DOCX, and TXT files are supported.");

        RuleFor(command => command.SizeBytes)
            .GreaterThan(0)
            .LessThanOrEqualTo(MaximumFileSizeBytes)
            .WithMessage("The file size must be between 1 byte and 20 MB.");
    }
}
