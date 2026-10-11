using Microsoft.EntityFrameworkCore;
using RagChat.Application.Abstractions;
using RagChat.Domain.Entities;

namespace RagChat.Infrastructure.Persistence.Repositories;

public sealed class UserRepository(ApplicationDbContext dbContext) : IUserRepository
{
    public Task<User?> GetByIdAsync(Guid userId, CancellationToken cancellationToken) =>
        dbContext.Users.AsNoTracking().SingleOrDefaultAsync(user => user.Id == userId, cancellationToken);

    public Task<User?> GetByEmailAsync(string email, CancellationToken cancellationToken) =>
        dbContext.Users.AsNoTracking().SingleOrDefaultAsync(
            user => user.Email == email,
            cancellationToken);

    public Task AddAsync(User user, CancellationToken cancellationToken) =>
        dbContext.Users.AddAsync(user, cancellationToken).AsTask();
}
