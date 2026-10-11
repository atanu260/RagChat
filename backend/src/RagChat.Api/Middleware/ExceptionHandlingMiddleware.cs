using Microsoft.AspNetCore.Mvc;
using RagChat.Application.Common;

namespace RagChat.Api.Middleware;

public sealed class ExceptionHandlingMiddleware(
    RequestDelegate next,
    ILogger<ExceptionHandlingMiddleware> logger)
{
    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await next(context);
        }
        catch (OperationCanceledException) when (context.RequestAborted.IsCancellationRequested)
        {
            logger.LogDebug("Request {TraceIdentifier} was cancelled by the client.", context.TraceIdentifier);
        }
        catch (Exception exception)
        {
            if (context.Response.HasStarted)
            {
                logger.LogError(exception, "An error occurred after the response started.");
                throw;
            }

            var problem = exception switch
            {
                NotFoundException => new ProblemDetails
                {
                    Status = StatusCodes.Status404NotFound,
                    Title = "Not Found",
                    Detail = exception.Message
                },
                ConflictException => new ProblemDetails
                {
                    Status = StatusCodes.Status409Conflict,
                    Title = "Conflict",
                    Detail = exception.Message
                },
                ForbiddenException => new ProblemDetails
                {
                    Status = StatusCodes.Status403Forbidden,
                    Title = "Forbidden",
                    Detail = exception.Message
                },
                UnauthorizedAccessException => new ProblemDetails
                {
                    Status = StatusCodes.Status401Unauthorized,
                    Title = "Unauthorized",
                    Detail = exception.Message
                },
                ValidationException validationException => CreateValidationProblem(validationException),
                _ => new ProblemDetails
                {
                    Status = StatusCodes.Status500InternalServerError,
                    Title = "An unexpected error occurred.",
                    Detail = "The server could not complete the request."
                }
            };

            if (problem.Status >= 500)
            {
                logger.LogError(exception, "Unhandled exception while processing {Method} {Path}.",
                    context.Request.Method,
                    context.Request.Path);
            }
            else
            {
                logger.LogInformation(exception, "Handled API exception with status {StatusCode}.", problem.Status);
            }

            problem.Instance = context.Request.Path;
            context.Response.StatusCode = problem.Status ?? StatusCodes.Status500InternalServerError;
            context.Response.ContentType = "application/problem+json";
            await context.Response.WriteAsJsonAsync(
                problem,
                problem.GetType(),
                options: null,
                contentType: "application/problem+json",
                cancellationToken: context.RequestAborted);
        }
    }

    private static ProblemDetails CreateValidationProblem(ValidationException exception) =>
        new ValidationProblemDetails(exception.Errors.ToDictionary(
            pair => pair.Key,
            pair => pair.Value))
        {
            Status = StatusCodes.Status400BadRequest,
            Title = "One or more validation errors occurred."
        };
}
