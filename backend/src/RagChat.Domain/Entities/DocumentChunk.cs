using RagChat.Domain.Common;

namespace RagChat.Domain.Entities;

public sealed class DocumentChunk : BaseEntity
{
    private byte[] _embedding = [];

    public DocumentChunk(
        Guid documentId,
        int chunkIndex,
        string content,
        int? pageNumber,
        int tokenCount,
        byte[] embedding)
    {
        if (documentId == Guid.Empty)
        {
            throw new ArgumentException("A document ID is required.", nameof(documentId));
        }

        if (chunkIndex < 0)
        {
            throw new ArgumentOutOfRangeException(nameof(chunkIndex), "The chunk index cannot be negative.");
        }

        ArgumentException.ThrowIfNullOrWhiteSpace(content);

        if (pageNumber <= 0)
        {
            throw new ArgumentOutOfRangeException(nameof(pageNumber), "The page number must be greater than zero.");
        }

        if (tokenCount <= 0)
        {
            throw new ArgumentOutOfRangeException(nameof(tokenCount), "The token count must be greater than zero.");
        }

        ArgumentNullException.ThrowIfNull(embedding);

        if (embedding.Length == 0)
        {
            throw new ArgumentException("An embedding cannot be empty.", nameof(embedding));
        }

        DocumentId = documentId;
        ChunkIndex = chunkIndex;
        Content = content.Trim();
        PageNumber = pageNumber;
        TokenCount = tokenCount;
        _embedding = (byte[])embedding.Clone();
    }

    public Guid DocumentId { get; private set; }

    public int ChunkIndex { get; private set; }

    public string Content { get; private set; }

    public int? PageNumber { get; private set; }

    public int TokenCount { get; private set; }

    public byte[] Embedding
    {
        get => (byte[])_embedding.Clone();
        private set => _embedding = (byte[])value.Clone();
    }
}
