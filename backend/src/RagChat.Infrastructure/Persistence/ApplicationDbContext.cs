using Microsoft.EntityFrameworkCore;
using RagChat.Domain.Entities;

namespace RagChat.Infrastructure.Persistence;

public sealed class ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : DbContext(options)
{
    public DbSet<User> Users => Set<User>();

    public DbSet<Document> Documents => Set<Document>();

    public DbSet<DocumentChunk> DocumentChunks => Set<DocumentChunk>();

    public DbSet<ChatSession> ChatSessions => Set<ChatSession>();

    public DbSet<ChatMessage> ChatMessages => Set<ChatMessage>();

    public DbSet<MessageCitation> MessageCitations => Set<MessageCitation>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(ApplicationDbContext).Assembly);
    }
}
