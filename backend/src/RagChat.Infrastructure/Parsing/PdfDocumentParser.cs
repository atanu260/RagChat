using RagChat.Application.Abstractions;
using RagChat.Application.Common;
using UglyToad.PdfPig;

namespace RagChat.Infrastructure.Parsing;

public sealed class PdfDocumentParser : IDocumentParser
{
    public bool CanParse(string contentType) =>
        string.Equals(contentType, "application/pdf", StringComparison.OrdinalIgnoreCase);

    public Task<IReadOnlyList<ParsedPage>> ParseAsync(Stream stream, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(stream);
        cancellationToken.ThrowIfCancellationRequested();

        using var document = PdfDocument.Open(stream);
        IReadOnlyList<ParsedPage> pages = document.GetPages()
            .Select(page => new ParsedPage(page.Number, page.Text))
            .ToArray();

        return Task.FromResult(pages);
    }
}
