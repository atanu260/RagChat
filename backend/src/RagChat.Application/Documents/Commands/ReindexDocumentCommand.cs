using MediatR;

namespace RagChat.Application.Documents.Commands;

public sealed record ReindexDocumentCommand(Guid DocumentId) : IRequest;
