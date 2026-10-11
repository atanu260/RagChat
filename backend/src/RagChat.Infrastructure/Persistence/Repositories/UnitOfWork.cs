using RagChat.Application.Abstractions;

namespace RagChat.Infrastructure.Persistence.Repositories;

public sealed class UnitOfWork(ApplicationDbContext dbContext) : IUnitOfWork
{
    public Task<int> SaveChangesAsync(CancellationToken cancellationToken) =>
        dbContext.SaveChangesAsync(cancellationToken);
}
