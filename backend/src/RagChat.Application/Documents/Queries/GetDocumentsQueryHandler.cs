using MediatR;
using RagChat.Application.Abstractions;
using RagChat.Application.Common;

namespace RagChat.Application.Documents.Queries;

public sealed class GetDocumentsQueryHandler(
    ICurrentUser currentUser,
    IDocumentRepository documentRepository)
    : IRequestHandler<GetDocumentsQuery, IReadOnlyList<DocumentDto>>
{
    public async Task<IReadOnlyList<DocumentDto>> Handle(
        GetDocumentsQuery request,
        CancellationToken cancellationToken)
    {
        var documents = await documentRepository.GetByUserIdAsync(currentUser.UserId, cancellationToken);
        return documents.Select(DocumentMapping.ToDto).ToArray();
    }
}
