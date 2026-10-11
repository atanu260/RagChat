using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using RagChat.Domain.Entities;

namespace RagChat.Infrastructure.Persistence.Configurations;

public sealed class DocumentChunkConfiguration : IEntityTypeConfiguration<DocumentChunk>
{
    public void Configure(EntityTypeBuilder<DocumentChunk> builder)
    {
        builder.HasKey(chunk => chunk.Id);
        builder.Property(chunk => chunk.Content).IsRequired();
        builder.Property(chunk => chunk.ChunkIndex).IsRequired();
        builder.Property(chunk => chunk.TokenCount).IsRequired();
        builder.Property(chunk => chunk.Embedding).HasColumnType("varbinary(max)").IsRequired();
        builder.Property(chunk => chunk.CreatedAt).IsRequired();
        builder.HasIndex(chunk => chunk.DocumentId);
    }
}
