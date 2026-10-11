using System.Text;
using RagChat.Domain.ValueObjects;

namespace RagChat.Application.Retrieval;

public sealed class PromptBuilder
{
    public string BuildSystemPrompt(IReadOnlyList<SearchResult> results)
    {
        ArgumentNullException.ThrowIfNull(results);

        var prompt = new StringBuilder(
            "Answer ONLY from the provided context. Cite sources using their numbered labels, such as [1] and [2]. "
            + "If the context is insufficient to answer, say \"I don't know\". Do not use outside knowledge.");

        prompt.AppendLine();
        prompt.AppendLine();
        prompt.AppendLine("Context:");

        for (var index = 0; index < results.Count; index++)
        {
            var result = results[index]
                ?? throw new ArgumentException("Context results cannot contain null entries.", nameof(results));
            prompt.Append('[').Append(index + 1).Append("] ")
                .Append(result.DocumentName);

            if (result.PageNumber is not null)
            {
                prompt.Append(", page ").Append(result.PageNumber.Value);
            }

            prompt.AppendLine();
            prompt.AppendLine(result.Content);
        }

        return prompt.ToString();
    }
}
