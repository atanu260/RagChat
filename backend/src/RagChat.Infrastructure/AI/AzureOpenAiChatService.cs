using Azure;
using Azure.AI.OpenAI;
using Microsoft.Extensions.Options;
using OpenAI.Chat;
using RagChat.Application.Abstractions;
using RagChat.Application.Common;
using RagChat.Domain.Enums;

namespace RagChat.Infrastructure.AI;

public sealed class AzureOpenAiChatService : IChatCompletionService
{
    private readonly ChatClient _client;

    public AzureOpenAiChatService(IOptions<AzureOpenAiOptions> options)
    {
        var settings = options.Value;
        _client = new AzureOpenAIClient(
            new Uri(settings.Endpoint),
            new AzureKeyCredential(settings.ApiKey))
            .GetChatClient(settings.ChatDeployment);
    }

    public async IAsyncEnumerable<string> StreamAnswerAsync(
        string systemPrompt,
        IReadOnlyList<ChatTurn> history,
        string userQuestion,
        [System.Runtime.CompilerServices.EnumeratorCancellation] CancellationToken cancellationToken)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(systemPrompt);
        ArgumentNullException.ThrowIfNull(history);
        ArgumentException.ThrowIfNullOrWhiteSpace(userQuestion);

        var messages = new List<OpenAI.Chat.ChatMessage>(history.Count + 2)
        {
            new SystemChatMessage(systemPrompt)
        };

        foreach (var turn in history)
        {
            messages.Add(turn.Role switch
            {
                MessageRole.User => new UserChatMessage(turn.Content),
                MessageRole.Assistant => new AssistantChatMessage(turn.Content),
                MessageRole.System => new SystemChatMessage(turn.Content),
                _ => throw new ArgumentOutOfRangeException(nameof(history), "A chat turn has an unsupported role.")
            });
        }

        messages.Add(new UserChatMessage(userQuestion));
        var stream = _client.CompleteChatStreamingAsync(messages, cancellationToken: cancellationToken);

        await foreach (var update in stream.WithCancellation(cancellationToken))
        {
            foreach (var content in update.ContentUpdate)
            {
                if (!string.IsNullOrEmpty(content.Text))
                {
                    yield return content.Text;
                }
            }
        }
    }
}
