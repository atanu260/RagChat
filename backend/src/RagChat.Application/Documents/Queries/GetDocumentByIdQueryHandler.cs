using MediatR;
using RagChat.Application.Abstractions;
using RagChat.Application.Common;

namespace RagChat.Application.Documents.Queries;

public sealed class GetDocumentByIdQueryHandler(
    ICurrentUser currentUser,
    IDocumentRepository documentRepository)
    : IRequestHandler<GetDocumentByIdQuery, DocumentDto>
{
    public async Task<DocumentDto> Handle(
        GetDocumentByIdQuery request,
        CancellationToken cancellationToken)
    {
        var document = await documentRepository.GetByIdForUserAsync(
            request.DocumentId,
            currentUser.UserId,
            cancellationToken);

        return document is null
            ? throw new NotFoundException($"Document '{request.DocumentId}' was not found.")
            : DocumentMapping.ToDto(document);
    }
}
