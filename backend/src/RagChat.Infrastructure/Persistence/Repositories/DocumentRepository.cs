using Microsoft.EntityFrameworkCore;
using RagChat.Application.Abstractions;
using RagChat.Domain.Entities;

namespace RagChat.Infrastructure.Persistence.Repositories;

public sealed class DocumentRepository(ApplicationDbContext dbContext) : IDocumentRepository
{
    public Task<Document?> GetByIdAsync(Guid documentId, CancellationToken cancellationToken) =>
        dbContext.Documents.AsNoTracking().SingleOrDefaultAsync(
            document => document.Id == documentId,
            cancellationToken);

    public Task<Document?> GetByIdForUserAsync(
        Guid documentId,
        Guid userId,
        CancellationToken cancellationToken) =>
        dbContext.Documents.AsNoTracking().SingleOrDefaultAsync(
            document => document.Id == documentId && document.UserId == userId,
            cancellationToken);

    public async Task<IReadOnlyList<Document>> GetByUserIdAsync(Guid userId, CancellationToken cancellationToken) =>
        await dbContext.Documents.AsNoTracking()
            .Where(document => document.UserId == userId)
            .OrderByDescending(document => document.CreatedAt)
            .ToArrayAsync(cancellationToken);

    public Task AddAsync(Document document, CancellationToken cancellationToken) =>
        dbContext.Documents.AddAsync(document, cancellationToken).AsTask();

    public void Update(Document document)
    {
        ArgumentNullException.ThrowIfNull(document);
        dbContext.Documents.Update(document);
    }

    public void Remove(Document document)
    {
        ArgumentNullException.ThrowIfNull(document);
        dbContext.Documents.Remove(document);
    }
}
