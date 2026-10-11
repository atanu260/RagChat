using System.Runtime.CompilerServices;
using System.Text;
using MediatR;
using RagChat.Application.Abstractions;
using RagChat.Application.Common;
using RagChat.Application.Retrieval;
using RagChat.Domain.Entities;
using RagChat.Domain.Enums;
using RagChat.Domain.ValueObjects;

namespace RagChat.Application.Chat.Commands;

public sealed class AskQuestionStreamHandler(
    ICurrentUser currentUser,
    IChatRepository chatRepository,
    IUnitOfWork unitOfWork,
    RetrievalService retrievalService,
    PromptBuilder promptBuilder,
    IChatCompletionService chatCompletionService)
    : IRequestHandler<AskQuestionCommand, IAsyncEnumerable<ChatStreamEvent>>
{
    public Task<IAsyncEnumerable<ChatStreamEvent>> Handle(
        AskQuestionCommand request,
        CancellationToken cancellationToken)
    {
        if (currentUser.UserId == Guid.Empty)
        {
            throw new ForbiddenException("An authenticated user is required.");
        }

        ArgumentException.ThrowIfNullOrWhiteSpace(request.Question);
        return Task.FromResult(StreamAnswerAsync(request, cancellationToken));
    }

    private async IAsyncEnumerable<ChatStreamEvent> StreamAnswerAsync(
        AskQuestionCommand request,
        [EnumeratorCancellation] CancellationToken cancellationToken)
    {
        var session = await chatRepository.GetSessionByIdForUserAsync(
            request.SessionId,
            currentUser.UserId,
            cancellationToken);

        if (session is null)
        {
            throw new NotFoundException($"Chat session '{request.SessionId}' was not found.");
        }

        var priorMessages = await chatRepository.GetMessagesAsync(session.Id, cancellationToken);
        var history = priorMessages
            .Select(message => new ChatTurn(message.Role, message.Content))
            .ToArray();

        var userMessage = new ChatMessage(session.Id, MessageRole.User, request.Question);
        await chatRepository.AddMessageAsync(userMessage, cancellationToken);
        await unitOfWork.SaveChangesAsync(cancellationToken);

        var results = await retrievalService.SearchAsync(
            request.Question,
            currentUser.UserId,
            request.DocumentIds,
            cancellationToken);
        var systemPrompt = promptBuilder.BuildSystemPrompt(results);
        var answer = new StringBuilder();

        await foreach (var token in chatCompletionService.StreamAnswerAsync(
                           systemPrompt,
                           history,
                           request.Question,
                           cancellationToken).WithCancellation(cancellationToken))
        {
            if (token is null)
            {
                throw new InvalidOperationException("The chat completion service returned a null token.");
            }

            answer.Append(token);
            yield return new ChatStreamEvent(ChatStreamEventType.Token, Token: token);
        }

        if (answer.Length == 0)
        {
            throw new InvalidOperationException("The chat completion service returned an empty answer.");
        }

        var assistantMessage = new ChatMessage(session.Id, MessageRole.Assistant, answer.ToString());
        foreach (var result in results)
        {
            assistantMessage.AddMessageCitation(new MessageCitation(
                assistantMessage.Id,
                result.ChunkId,
                result.Score));
        }

        await chatRepository.AddMessageAsync(assistantMessage, cancellationToken);
        await unitOfWork.SaveChangesAsync(cancellationToken);

        yield return new ChatStreamEvent(ChatStreamEventType.Citations, Citations: results);
        yield return new ChatStreamEvent(ChatStreamEventType.Done);
    }
}
