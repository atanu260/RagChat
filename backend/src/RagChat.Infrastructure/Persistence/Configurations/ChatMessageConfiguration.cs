using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using RagChat.Domain.Entities;

namespace RagChat.Infrastructure.Persistence.Configurations;

public sealed class ChatMessageConfiguration : IEntityTypeConfiguration<ChatMessage>
{
    public void Configure(EntityTypeBuilder<ChatMessage> builder)
    {
        builder.HasKey(message => message.Id);
        builder.Property(message => message.Role).IsRequired();
        builder.Property(message => message.Content).IsRequired();
        builder.Property(message => message.CreatedAt).IsRequired();
        builder.HasIndex(message => new { message.SessionId, message.CreatedAt });

        builder.HasMany(message => message.MessageCitations)
            .WithOne()
            .HasForeignKey(citation => citation.MessageId)
            .OnDelete(DeleteBehavior.Cascade);
        builder.Navigation(message => message.MessageCitations)
            .HasField("_messageCitations")
            .UsePropertyAccessMode(PropertyAccessMode.Field);
    }
}
