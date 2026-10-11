using MediatR;

namespace RagChat.Application.Documents.Commands;

public sealed record DeleteDocumentCommand(Guid DocumentId) : IRequest;
