using System.Text;
using RagChat.Application.Abstractions;
using RagChat.Application.Common;

namespace RagChat.Infrastructure.Parsing;

public sealed class TextDocumentParser : IDocumentParser
{
    public bool CanParse(string contentType) =>
        string.Equals(contentType, "text/plain", StringComparison.OrdinalIgnoreCase);

    public async Task<IReadOnlyList<ParsedPage>> ParseAsync(Stream stream, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(stream);
        using var reader = new StreamReader(stream, Encoding.UTF8, detectEncodingFromByteOrderMarks: true, leaveOpen: true);
        var content = await reader.ReadToEndAsync(cancellationToken);
        return [new ParsedPage(1, content)];
    }
}
