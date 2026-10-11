using DocumentFormat.OpenXml.Packaging;
using DocumentFormat.OpenXml.Wordprocessing;
using RagChat.Application.Abstractions;
using RagChat.Application.Common;

namespace RagChat.Infrastructure.Parsing;

public sealed class DocxDocumentParser : IDocumentParser
{
    public bool CanParse(string contentType) =>
        string.Equals(
            contentType,
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            StringComparison.OrdinalIgnoreCase);

    public Task<IReadOnlyList<ParsedPage>> ParseAsync(Stream stream, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(stream);
        cancellationToken.ThrowIfCancellationRequested();

        using var document = WordprocessingDocument.Open(stream, false);
        var body = document.MainDocumentPart?.Document?.Body;
        var content = string.Join(
            Environment.NewLine,
            body?.Descendants<Paragraph>()
                .Select(paragraph => paragraph.InnerText)
                .Where(text => !string.IsNullOrWhiteSpace(text))
            ?? []);

        IReadOnlyList<ParsedPage> pages = [new ParsedPage(1, content)];
        return Task.FromResult(pages);
    }
}
