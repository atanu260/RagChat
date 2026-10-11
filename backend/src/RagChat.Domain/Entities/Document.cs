using RagChat.Domain.Common;
using RagChat.Domain.Enums;

namespace RagChat.Domain.Entities;

public sealed class Document : BaseEntity
{
    private readonly List<DocumentChunk> _documentChunks = [];

    public Document(
        Guid userId,
        string fileName,
        string contentType,
        long sizeBytes,
        string storagePath,
        int? pageCount = null)
    {
        if (userId == Guid.Empty)
        {
            throw new ArgumentException("A user ID is required.", nameof(userId));
        }

        ArgumentException.ThrowIfNullOrWhiteSpace(fileName);
        ArgumentException.ThrowIfNullOrWhiteSpace(contentType);
        ArgumentException.ThrowIfNullOrWhiteSpace(storagePath);

        if (sizeBytes <= 0)
        {
            throw new ArgumentOutOfRangeException(nameof(sizeBytes), "The document size must be greater than zero.");
        }

        if (pageCount <= 0)
        {
            throw new ArgumentOutOfRangeException(nameof(pageCount), "The page count must be greater than zero.");
        }

        UserId = userId;
        FileName = fileName.Trim();
        ContentType = contentType.Trim();
        SizeBytes = sizeBytes;
        StoragePath = storagePath.Trim();
        Status = DocumentStatus.Uploaded;
        PageCount = pageCount;
    }

    public Guid UserId { get; private set; }

    public string FileName { get; private set; }

    public string ContentType { get; private set; }

    public long SizeBytes { get; private set; }

    public string StoragePath { get; private set; }

    public DocumentStatus Status { get; private set; }

    public string? ErrorMessage { get; private set; }

    public int? PageCount { get; private set; }

    public IReadOnlyCollection<DocumentChunk> DocumentChunks => _documentChunks.AsReadOnly();

    public void MarkProcessing()
    {
        if (Status is not (DocumentStatus.Uploaded or DocumentStatus.Failed))
        {
            throw new InvalidOperationException($"A document in the {Status} state cannot be processed.");
        }

        Status = DocumentStatus.Processing;
        ErrorMessage = null;
        MarkUpdated();
    }

    public void MarkReady(int chunkCount)
    {
        if (Status != DocumentStatus.Processing)
        {
            throw new InvalidOperationException("Only a processing document can be marked ready.");
        }

        if (chunkCount <= 0)
        {
            throw new ArgumentOutOfRangeException(nameof(chunkCount), "A ready document must contain at least one chunk.");
        }

        Status = DocumentStatus.Ready;
        ErrorMessage = null;
        MarkUpdated();
    }

    public void MarkFailed(string error)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(error);

        if (Status != DocumentStatus.Processing)
        {
            throw new InvalidOperationException("Only a processing document can be marked failed.");
        }

        Status = DocumentStatus.Failed;
        ErrorMessage = error.Trim();
        MarkUpdated();
    }

    public void AddDocumentChunk(DocumentChunk documentChunk)
    {
        ArgumentNullException.ThrowIfNull(documentChunk);

        if (documentChunk.DocumentId != Id)
        {
            throw new ArgumentException("The chunk belongs to a different document.", nameof(documentChunk));
        }

        if (_documentChunks.Any(existing => existing.ChunkIndex == documentChunk.ChunkIndex))
        {
            throw new InvalidOperationException("A chunk with this index already exists for the document.");
        }

        _documentChunks.Add(documentChunk);
        MarkUpdated();
    }
}
