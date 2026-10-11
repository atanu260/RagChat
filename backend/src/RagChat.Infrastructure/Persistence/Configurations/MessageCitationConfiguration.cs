using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using RagChat.Domain.Entities;

namespace RagChat.Infrastructure.Persistence.Configurations;

public sealed class MessageCitationConfiguration : IEntityTypeConfiguration<MessageCitation>
{
    public void Configure(EntityTypeBuilder<MessageCitation> builder)
    {
        builder.HasKey(citation => citation.Id);
        builder.Property(citation => citation.Score).IsRequired();
        builder.Property(citation => citation.CreatedAt).IsRequired();
        builder.HasIndex(citation => citation.ChunkId);
    }
}
