using MediatR;
using RagChat.Application.Common;

namespace RagChat.Application.Documents.Queries;

public sealed record GetDocumentsQuery : IRequest<IReadOnlyList<DocumentDto>>;
