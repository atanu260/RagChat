using MediatR;
using Microsoft.Extensions.Logging;

namespace RagChat.Application.Behaviors;

public sealed class LoggingBehavior<TRequest, TResponse>(
    ILogger<LoggingBehavior<TRequest, TResponse>> logger)
    : IPipelineBehavior<TRequest, TResponse>
    where TRequest : notnull
{
    public async Task<TResponse> Handle(
        TRequest request,
        RequestHandlerDelegate<TResponse> next,
        CancellationToken cancellationToken)
    {
        logger.LogInformation("Handling request {RequestType}.", typeof(TRequest).Name);
        var response = await next();
        logger.LogInformation("Handled request {RequestType}.", typeof(TRequest).Name);
        return response;
    }
}
