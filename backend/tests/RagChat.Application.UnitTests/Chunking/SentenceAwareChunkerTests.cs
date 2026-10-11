using FluentAssertions;
using Microsoft.Extensions.Options;
using RagChat.Application.Common;
using RagChat.Infrastructure.Chunking;

namespace RagChat.Application.UnitTests.Chunking;

public sealed class SentenceAwareChunkerTests
{
    [Fact]
    public void Chunk_ShouldOverlapAdjacentChunks()
    {
        var chunker = CreateChunker(targetTokens: 13, overlapTokens: 3);
        var words = Enumerable.Range(1, 25).Select(index => $"word{index}").ToArray();

        var chunks = chunker.Chunk([new ParsedPage(1, string.Join(' ', words))]);

        chunks.Should().HaveCount(3);
        var firstWords = chunks[0].Content.Split(' ');
        var secondWords = chunks[1].Content.Split(' ');
        firstWords.TakeLast(2).Should().Equal(secondWords.Take(2));
        chunks[0].TokenCount.Should().Be(13);
        chunks[1].TokenCount.Should().Be(13);
    }

    [Fact]
    public void Chunk_ShouldPreservePageNumberOnChunks()
    {
        var chunker = CreateChunker(targetTokens: 13, overlapTokens: 3);

        var chunks = chunker.Chunk(
        [
            new ParsedPage(2, "first page content."),
            new ParsedPage(7, "second page content.")
        ]);

        chunks.Select(chunk => chunk.PageNumber).Should().Equal(2, 7);
    }

    [Fact]
    public void Chunk_ShouldReturnEmptyForEmptyInputAndBlankPages()
    {
        var chunker = CreateChunker(targetTokens: 13, overlapTokens: 3);

        chunker.Chunk([]).Should().BeEmpty();
        chunker.Chunk([new ParsedPage(1, " "), new ParsedPage(2, string.Empty)]).Should().BeEmpty();
    }

    private static SentenceAwareChunker CreateChunker(int targetTokens, int overlapTokens) =>
        new(Options.Create(new SentenceAwareChunkingOptions
        {
            TargetTokens = targetTokens,
            OverlapTokens = overlapTokens
        }));
}
