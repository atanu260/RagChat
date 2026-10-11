using RagChat.Domain.Entities;

namespace RagChat.Application.Abstractions;

public interface IDocumentRepository
{
    Task<Document?> GetByIdAsync(Guid documentId, CancellationToken cancellationToken);

    Task<Document?> GetByIdForUserAsync(Guid documentId, Guid userId, CancellationToken cancellationToken);

    Task<IReadOnlyList<Document>> GetByUserIdAsync(Guid userId, CancellationToken cancellationToken);

    Task AddAsync(Document document, CancellationToken cancellationToken);

    void Update(Document document);

    void Remove(Document document);
}
