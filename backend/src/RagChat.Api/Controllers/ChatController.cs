using System.Text.Json;
using System.Text.Json.Serialization;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using RagChat.Api.Contracts;
using RagChat.Application.Chat.Commands;
using RagChat.Application.Chat.Queries;
using RagChat.Application.Common;

namespace RagChat.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/chat")]
public sealed class ChatController(ISender sender) : ControllerBase
{
    private static readonly JsonSerializerOptions SseJsonOptions = new(JsonSerializerDefaults.Web)
    {
        Converters = { new JsonStringEnumConverter() }
    };

    [HttpPost("sessions")]
    [ProducesResponseType<ChatSessionDto>(StatusCodes.Status201Created)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<ChatSessionDto>> CreateSession(
        CreateSessionRequest request,
        CancellationToken cancellationToken)
    {
        var session = await sender.Send(new CreateSessionCommand(request.Title), cancellationToken);
        return Created($"/api/chat/sessions/{session.Id}", session);
    }

    [HttpGet("sessions")]
    [ProducesResponseType<IReadOnlyList<ChatSessionDto>>(StatusCodes.Status200OK)]
    public Task<IReadOnlyList<ChatSessionDto>> GetSessions(CancellationToken cancellationToken) =>
        sender.Send(new GetSessionsQuery(), cancellationToken);

    [HttpGet("sessions/{id:guid}/messages")]
    [ProducesResponseType<IReadOnlyList<ChatMessageDto>>(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
    public Task<IReadOnlyList<ChatMessageDto>> GetMessages(Guid id, CancellationToken cancellationToken) =>
        sender.Send(new GetMessagesQuery(id), cancellationToken);

    [HttpPost("sessions/{id:guid}/ask")]
    [EnableRateLimiting("chat")]
    [Consumes("application/json")]
    [Produces("text/event-stream")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
    public async Task Ask(
        Guid id,
        AskQuestionRequest request,
        CancellationToken cancellationToken)
    {
        Response.StatusCode = StatusCodes.Status200OK;
        Response.ContentType = "text/event-stream";
        Response.Headers.CacheControl = "no-cache";

        var events = await sender.Send(
            new AskQuestionCommand(id, request.Question, request.DocumentIds),
            cancellationToken);

        await foreach (var streamEvent in events.WithCancellation(HttpContext.RequestAborted))
        {
            cancellationToken.ThrowIfCancellationRequested();
            var (name, data) = streamEvent.Type switch
            {
                ChatStreamEventType.Token => ("token", JsonSerializer.Serialize(streamEvent.Token, SseJsonOptions)),
                ChatStreamEventType.Citations => ("citations", JsonSerializer.Serialize(streamEvent.Citations, SseJsonOptions)),
                ChatStreamEventType.Done => ("done", "{}"),
                _ => throw new InvalidOperationException($"Unsupported chat stream event: {streamEvent.Type}.")
            };

            await Response.WriteAsync($"event: {name}\ndata: {data}\n\n", cancellationToken);
            await Response.Body.FlushAsync(cancellationToken);
        }
    }
}
