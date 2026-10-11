using FluentAssertions;
using RagChat.Domain.Entities;
using RagChat.Domain.Enums;

namespace RagChat.Domain.UnitTests;

public sealed class DocumentStatusTests
{
    [Fact]
    public void MarkProcessing_ShouldMoveUploadedDocumentToProcessing()
    {
        var document = CreateDocument();

        document.MarkProcessing();

        document.Status.Should().Be(DocumentStatus.Processing);
        document.UpdatedAt.Should().NotBeNull();
    }

    [Fact]
    public void MarkReady_ShouldRequireProcessingAndPositiveChunkCount()
    {
        var document = CreateDocument();

        var invalidState = () => document.MarkReady(1);
        invalidState.Should().Throw<InvalidOperationException>();

        document.MarkProcessing();
        var invalidChunkCount = () => document.MarkReady(0);
        invalidChunkCount.Should().Throw<ArgumentOutOfRangeException>();

        document.MarkReady(2);

        document.Status.Should().Be(DocumentStatus.Ready);
        document.ErrorMessage.Should().BeNull();
    }

    [Fact]
    public void MarkFailed_ShouldRequireProcessingAndStoreError()
    {
        var document = CreateDocument();

        var invalidState = () => document.MarkFailed("Failed to parse.");
        invalidState.Should().Throw<InvalidOperationException>();

        document.MarkProcessing();
        document.MarkFailed("  Failed to parse.  ");

        document.Status.Should().Be(DocumentStatus.Failed);
        document.ErrorMessage.Should().Be("Failed to parse.");
    }

    [Fact]
    public void MarkProcessing_ShouldAllowRetryAfterFailureAndClearError()
    {
        var document = CreateDocument();
        document.MarkProcessing();
        document.MarkFailed("Failure");

        document.MarkProcessing();

        document.Status.Should().Be(DocumentStatus.Processing);
        document.ErrorMessage.Should().BeNull();
    }

    private static Document CreateDocument() =>
        new(Guid.NewGuid(), "document.txt", "text/plain", 100, "stored/document.txt");
}
