using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using RagChat.Domain.Entities;

namespace RagChat.Infrastructure.Persistence.Configurations;

public sealed class DocumentConfiguration : IEntityTypeConfiguration<Document>
{
    public void Configure(EntityTypeBuilder<Document> builder)
    {
        builder.HasKey(document => document.Id);
        builder.Property(document => document.FileName).HasMaxLength(255).IsRequired();
        builder.Property(document => document.ContentType).HasMaxLength(127).IsRequired();
        builder.Property(document => document.StoragePath).HasMaxLength(1024).IsRequired();
        builder.Property(document => document.Status).IsRequired();
        builder.Property(document => document.ErrorMessage).HasMaxLength(2000);
        builder.Property(document => document.SizeBytes).IsRequired();
        builder.Property(document => document.CreatedAt).IsRequired();
        builder.HasIndex(document => document.UserId);

        builder.HasMany(document => document.DocumentChunks)
            .WithOne()
            .HasForeignKey(chunk => chunk.DocumentId)
            .OnDelete(DeleteBehavior.Cascade);
        builder.Navigation(document => document.DocumentChunks)
            .HasField("_documentChunks")
            .UsePropertyAccessMode(PropertyAccessMode.Field);
    }
}
