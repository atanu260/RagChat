using FluentAssertions;
using RagChat.Application.Retrieval;
using RagChat.Domain.ValueObjects;

namespace RagChat.Application.UnitTests.Retrieval;

public sealed class PromptBuilderTests
{
    [Fact]
    public void BuildSystemPrompt_ShouldNumberRetrievedChunks()
    {
        var builder = new PromptBuilder();
        var results = new[]
        {
            new SearchResult(Guid.NewGuid(), Guid.NewGuid(), "guide.pdf", "First context", 1, 0.9),
            new SearchResult(Guid.NewGuid(), Guid.NewGuid(), "notes.txt", "Second context", null, 0.8)
        };

        var prompt = builder.BuildSystemPrompt(results);

        prompt.Should().Contain("[1] guide.pdf, page 1");
        prompt.Should().Contain("[2] notes.txt");
        prompt.Should().Contain("First context");
        prompt.Should().Contain("Second context");
    }

    [Fact]
    public void BuildSystemPrompt_ShouldInstructModelToSayIDontKnowWhenContextIsInsufficient()
    {
        var prompt = new PromptBuilder().BuildSystemPrompt([]);

        prompt.Should().Contain("Answer ONLY from the provided context.");
        prompt.Should().Contain("I don't know");
        prompt.Should().Contain("Do not use outside knowledge.");
    }
}
