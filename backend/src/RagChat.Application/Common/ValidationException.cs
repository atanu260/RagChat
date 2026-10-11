namespace RagChat.Application.Common;

public sealed class ValidationException : Exception
{
    public ValidationException(IReadOnlyDictionary<string, string[]> errors)
        : base("One or more validation errors occurred.")
    {
        ArgumentNullException.ThrowIfNull(errors);
        Errors = errors;
    }

    public IReadOnlyDictionary<string, string[]> Errors { get; }
}
