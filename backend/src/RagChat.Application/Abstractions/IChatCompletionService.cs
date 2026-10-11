using RagChat.Application.Common;

namespace RagChat.Application.Abstractions;

public interface IChatCompletionService
{
    IAsyncEnumerable<string> StreamAnswerAsync(
        string systemPrompt,
        IReadOnlyList<ChatTurn> history,
        string userQuestion,
        CancellationToken cancellationToken);
}
