using RagChat.Application.Common;

namespace RagChat.Application.Abstractions;

public interface IDocumentParser
{
    bool CanParse(string contentType);

    Task<IReadOnlyList<ParsedPage>> ParseAsync(Stream stream, CancellationToken cancellationToken);
}
