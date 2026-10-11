using MediatR;
using RagChat.Application.Abstractions;
using RagChat.Application.Common;
using RagChat.Domain.Entities;

namespace RagChat.Application.Documents.Commands;

public sealed class UploadDocumentCommandHandler(
    ICurrentUser currentUser,
    IDocumentRepository documentRepository,
    IFileStorage fileStorage,
    IIngestionQueue ingestionQueue,
    IUnitOfWork unitOfWork)
    : IRequestHandler<UploadDocumentCommand, DocumentDto>
{
    public async Task<DocumentDto> Handle(UploadDocumentCommand request, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(request.Content);
        if (currentUser.UserId == Guid.Empty)
        {
            throw new ForbiddenException("An authenticated user is required.");
        }

        var storagePath = await fileStorage.SaveAsync(
            request.Content,
            request.FileName,
            request.ContentType,
            cancellationToken);
        Document document;

        try
        {
            document = new Document(
                currentUser.UserId,
                Path.GetFileName(request.FileName.Trim()),
                request.ContentType.Trim(),
                request.SizeBytes,
                storagePath);

            await documentRepository.AddAsync(document, cancellationToken);
            await unitOfWork.SaveChangesAsync(cancellationToken);
        }
        catch (Exception persistenceException)
        {
            try
            {
                await fileStorage.DeleteAsync(storagePath, CancellationToken.None);
            }
            catch (Exception cleanupException)
            {
                throw new AggregateException(
                    "The document could not be persisted and its stored file could not be removed.",
                    persistenceException,
                    cleanupException);
            }

            throw;
        }

        await ingestionQueue.EnqueueAsync(document.Id, cancellationToken);
        return DocumentMapping.ToDto(document);
    }
}
