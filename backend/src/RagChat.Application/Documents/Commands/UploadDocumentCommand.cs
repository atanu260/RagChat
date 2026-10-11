using MediatR;
using RagChat.Application.Common;

namespace RagChat.Application.Documents.Commands;

public sealed record UploadDocumentCommand(
    Stream Content,
    string FileName,
    string ContentType,
    long SizeBytes) : IRequest<DocumentDto>;
