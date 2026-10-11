using MediatR;
using RagChat.Application.Abstractions;
using RagChat.Application.Common;

namespace RagChat.Application.Documents.Commands;

public sealed class ReindexDocumentCommandHandler(
    ICurrentUser currentUser,
    IDocumentRepository documentRepository,
    IIngestionQueue ingestionQueue)
    : IRequestHandler<ReindexDocumentCommand>
{
    public async Task Handle(ReindexDocumentCommand request, CancellationToken cancellationToken)
    {
        var document = await documentRepository.GetByIdForUserAsync(
            request.DocumentId,
            currentUser.UserId,
            cancellationToken);

        if (document is null)
        {
            throw new NotFoundException($"Document '{request.DocumentId}' was not found.");
        }

        await ingestionQueue.EnqueueAsync(document.Id, cancellationToken);
    }
}
