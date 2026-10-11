using MediatR;
using RagChat.Application.Abstractions;
using RagChat.Application.Common;

namespace RagChat.Application.Documents.Commands;

public sealed class DeleteDocumentCommandHandler(
    ICurrentUser currentUser,
    IDocumentRepository documentRepository,
    IFileStorage fileStorage,
    IUnitOfWork unitOfWork)
    : IRequestHandler<DeleteDocumentCommand>
{
    public async Task Handle(DeleteDocumentCommand request, CancellationToken cancellationToken)
    {
        var document = await documentRepository.GetByIdForUserAsync(
            request.DocumentId,
            currentUser.UserId,
            cancellationToken);

        if (document is null)
        {
            throw new NotFoundException($"Document '{request.DocumentId}' was not found.");
        }

        await fileStorage.DeleteAsync(document.StoragePath, cancellationToken);
        documentRepository.Remove(document);
        await unitOfWork.SaveChangesAsync(cancellationToken);
    }
}
