using FluentValidation;
using MediatR;
using RagChat.Application.Common;

namespace RagChat.Application.Behaviors;

public sealed class ValidationBehavior<TRequest, TResponse>(
    IEnumerable<IValidator<TRequest>> validators)
    : IPipelineBehavior<TRequest, TResponse>
    where TRequest : notnull
{
    public async Task<TResponse> Handle(
        TRequest request,
        RequestHandlerDelegate<TResponse> next,
        CancellationToken cancellationToken)
    {
        var failures = new Dictionary<string, List<string>>(StringComparer.Ordinal);

        foreach (var validator in validators)
        {
            var result = await validator.ValidateAsync(
                new ValidationContext<TRequest>(request),
                cancellationToken);

            foreach (var failure in result.Errors)
            {
                if (!failures.TryGetValue(failure.PropertyName, out var messages))
                {
                    messages = [];
                    failures.Add(failure.PropertyName, messages);
                }

                messages.Add(failure.ErrorMessage);
            }
        }

        if (failures.Count > 0)
        {
            throw new RagChat.Application.Common.ValidationException(
                failures.ToDictionary(pair => pair.Key, pair => pair.Value.ToArray(), StringComparer.Ordinal));
        }

        return await next();
    }
}
