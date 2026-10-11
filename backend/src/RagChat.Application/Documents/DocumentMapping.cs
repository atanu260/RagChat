using RagChat.Application.Common;
using RagChat.Domain.Entities;

namespace RagChat.Application.Documents;

internal static class DocumentMapping
{
    public static DocumentDto ToDto(Document document)
    {
        ArgumentNullException.ThrowIfNull(document);

        return new DocumentDto(
            document.Id,
            document.FileName,
            document.ContentType,
            document.SizeBytes,
            document.Status,
            document.ErrorMessage,
            document.PageCount,
            document.CreatedAt,
            document.UpdatedAt);
    }
}
