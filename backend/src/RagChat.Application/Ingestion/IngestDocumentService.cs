using Microsoft.Extensions.Logging;
using RagChat.Application.Abstractions;
using RagChat.Application.Common;
using RagChat.Domain.Entities;
using RagChat.Domain.Enums;

namespace RagChat.Application.Ingestion;

public sealed class IngestDocumentService(
    IDocumentRepository documentRepository,
    IChunkRepository chunkRepository,
    IFileStorage fileStorage,
    IEnumerable<IDocumentParser> documentParsers,
    IChunkingStrategy chunkingStrategy,
    IEmbeddingService embeddingService,
    IVectorStore vectorStore,
    IUnitOfWork unitOfWork,
    ILogger<IngestDocumentService> logger)
{
    public async Task IngestAsync(Guid documentId, CancellationToken cancellationToken)
    {
        var document = await documentRepository.GetByIdAsync(documentId, cancellationToken)
            ?? throw new NotFoundException($"Document '{documentId}' was not found.");

        document.MarkProcessing();
        documentRepository.Update(document);
        await unitOfWork.SaveChangesAsync(cancellationToken);

        try
        {
            var documentParser = documentParsers.FirstOrDefault(parser => parser.CanParse(document.ContentType))
                ?? throw new InvalidOperationException(
                    $"No parser supports content type '{document.ContentType}'.");

            await using var stream = await fileStorage.OpenReadAsync(document.StoragePath, cancellationToken);
            var pages = await documentParser.ParseAsync(stream, cancellationToken);
            if (pages.Count == 0)
            {
                throw new InvalidOperationException("The document parser returned no pages.");
            }

            var textChunks = chunkingStrategy.Chunk(pages);
            if (textChunks.Count == 0)
            {
                throw new InvalidOperationException("The document did not produce any text chunks.");
            }

            var documentChunks = new List<DocumentChunk>(textChunks.Count);
            for (var offset = 0; offset < textChunks.Count; offset += 16)
            {
                cancellationToken.ThrowIfCancellationRequested();

                var batch = textChunks.Skip(offset).Take(16).ToArray();
                var embeddings = await embeddingService.EmbedBatchAsync(
                    batch.Select(chunk => chunk.Content),
                    cancellationToken);

                if (embeddings.Count != batch.Length)
                {
                    throw new InvalidOperationException("The embedding service returned an unexpected batch size.");
                }

                for (var index = 0; index < batch.Length; index++)
                {
                    var embedding = embeddings[index];
                    if (embedding.Length == 0 || embedding.Any(value => !float.IsFinite(value)))
                    {
                        throw new InvalidOperationException("The embedding service returned an invalid embedding.");
                    }

                    var chunk = batch[index];
                    documentChunks.Add(new DocumentChunk(
                        document.Id,
                        offset + index,
                        chunk.Content,
                        chunk.PageNumber,
                        chunk.TokenCount,
                        ToBytes(embedding)));
                }
            }

            foreach (var chunk in documentChunks)
            {
                document.AddDocumentChunk(chunk);
            }

            await chunkRepository.AddRangeAsync(documentChunks, cancellationToken);
            await vectorStore.UpsertChunksAsync(documentChunks, cancellationToken);
            document.MarkReady(documentChunks.Count);
            documentRepository.Update(document);
            await unitOfWork.SaveChangesAsync(cancellationToken);
        }
        catch (Exception exception)
        {
            logger.LogError(exception, "Document ingestion failed for document {DocumentId}.", documentId);

            if (document.Status == DocumentStatus.Processing)
            {
                document.MarkFailed(exception.Message);
                documentRepository.Update(document);
                await unitOfWork.SaveChangesAsync(CancellationToken.None);
            }

            throw;
        }
    }

    private static byte[] ToBytes(float[] embedding)
    {
        var bytes = new byte[embedding.Length * sizeof(float)];
        Buffer.BlockCopy(embedding, 0, bytes, 0, bytes.Length);
        return bytes;
    }
}
