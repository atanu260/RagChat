using FluentAssertions;
using Microsoft.Extensions.Logging;
using Moq;
using RagChat.Application.Abstractions;
using RagChat.Application.Common;
using RagChat.Application.Ingestion;
using RagChat.Domain.Entities;
using RagChat.Domain.Enums;

namespace RagChat.Application.UnitTests.Ingestion;

public sealed class IngestDocumentServiceTests
{
    private readonly Mock<IDocumentRepository> _documentRepository = new();
    private readonly Mock<IChunkRepository> _chunkRepository = new();
    private readonly Mock<IFileStorage> _fileStorage = new();
    private readonly Mock<IDocumentParser> _documentParser = new();
    private readonly Mock<IChunkingStrategy> _chunkingStrategy = new();
    private readonly Mock<IEmbeddingService> _embeddingService = new();
    private readonly Mock<IVectorStore> _vectorStore = new();
    private readonly Mock<IUnitOfWork> _unitOfWork = new();
    private readonly Mock<ILogger<IngestDocumentService>> _logger = new();

    [Fact]
    public async Task IngestAsync_ShouldParseEmbedStoreAndMarkDocumentReady()
    {
        var document = CreateDocument();
        ConfigureDocument(document);
        ConfigureParser(new ParsedPage(1, "Document contents."));
        _chunkingStrategy.Setup(strategy => strategy.Chunk(It.IsAny<IReadOnlyList<ParsedPage>>()))
            .Returns([new TextChunk("Document contents.", 1, 3)]);
        _embeddingService.Setup(service => service.EmbedBatchAsync(
                It.IsAny<IEnumerable<string>>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync([[0.25f, 0.5f]]);
        _fileStorage.Setup(storage => storage.OpenReadAsync(
                document.StoragePath,
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new MemoryStream([1]));
        _unitOfWork.Setup(unit => unit.SaveChangesAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(1);
        _chunkRepository.Setup(repository => repository.AddRangeAsync(
                It.IsAny<IEnumerable<DocumentChunk>>(),
                It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);
        _vectorStore.Setup(store => store.UpsertChunksAsync(
                It.IsAny<IEnumerable<DocumentChunk>>(),
                It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        await CreateService().IngestAsync(document.Id, CancellationToken.None);

        document.Status.Should().Be(DocumentStatus.Ready);
        document.ErrorMessage.Should().BeNull();
        document.DocumentChunks.Should().ContainSingle()
            .Which.Embedding.Should().Equal(BitConverter.GetBytes(0.25f).Concat(BitConverter.GetBytes(0.5f)));
        _chunkRepository.Verify(repository => repository.AddRangeAsync(
            It.Is<IEnumerable<DocumentChunk>>(chunks => chunks.Count() == 1),
            It.IsAny<CancellationToken>()), Times.Once);
        _vectorStore.Verify(store => store.UpsertChunksAsync(
            It.IsAny<IEnumerable<DocumentChunk>>(),
            It.IsAny<CancellationToken>()), Times.Once);
        _unitOfWork.Verify(unit => unit.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Exactly(2));
    }

    [Fact]
    public async Task IngestAsync_ShouldMarkDocumentFailedWhenParsingFails()
    {
        var document = CreateDocument();
        ConfigureDocument(document);
        ConfigureParser();
        _fileStorage.Setup(storage => storage.OpenReadAsync(
                document.StoragePath,
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new MemoryStream([1]));
        _documentParser.Setup(parser => parser.ParseAsync(
                It.IsAny<Stream>(),
                It.IsAny<CancellationToken>()))
            .Returns(Task.FromException<IReadOnlyList<ParsedPage>>(new InvalidDataException("Unable to parse document.")));
        _unitOfWork.Setup(unit => unit.SaveChangesAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(1);

        var act = () => CreateService().IngestAsync(document.Id, CancellationToken.None);

        await act.Should().ThrowAsync<InvalidDataException>();
        document.Status.Should().Be(DocumentStatus.Failed);
        document.ErrorMessage.Should().Be("Unable to parse document.");
        _documentRepository.Verify(repository => repository.Update(document), Times.Exactly(2));
        _unitOfWork.Verify(unit => unit.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Exactly(2));
        _chunkRepository.Verify(repository => repository.AddRangeAsync(
            It.IsAny<IEnumerable<DocumentChunk>>(),
            It.IsAny<CancellationToken>()), Times.Never);
    }

    private IngestDocumentService CreateService() =>
        new(
            _documentRepository.Object,
            _chunkRepository.Object,
            _fileStorage.Object,
            [_documentParser.Object],
            _chunkingStrategy.Object,
            _embeddingService.Object,
            _vectorStore.Object,
            _unitOfWork.Object,
            _logger.Object);

    private void ConfigureDocument(Document document)
    {
        _documentRepository.Setup(repository => repository.GetByIdAsync(
                document.Id,
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(document);
    }

    private void ConfigureParser(params ParsedPage[] pages)
    {
        _documentParser.Setup(parser => parser.CanParse("text/plain")).Returns(true);
        _documentParser.Setup(parser => parser.ParseAsync(
                It.IsAny<Stream>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync((IReadOnlyList<ParsedPage>)pages);
    }

    private static Document CreateDocument() =>
        new(Guid.NewGuid(), "document.txt", "text/plain", 100, "stored/document.txt");
}
