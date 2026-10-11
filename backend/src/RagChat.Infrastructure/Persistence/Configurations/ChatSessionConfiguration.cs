using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using RagChat.Domain.Entities;

namespace RagChat.Infrastructure.Persistence.Configurations;

public sealed class ChatSessionConfiguration : IEntityTypeConfiguration<ChatSession>
{
    public void Configure(EntityTypeBuilder<ChatSession> builder)
    {
        builder.HasKey(session => session.Id);
        builder.Property(session => session.Title).HasMaxLength(200).IsRequired();
        builder.Property(session => session.CreatedAt).IsRequired();

        builder.HasMany(session => session.ChatMessages)
            .WithOne()
            .HasForeignKey(message => message.SessionId)
            .OnDelete(DeleteBehavior.Cascade);
        builder.Navigation(session => session.ChatMessages)
            .HasField("_chatMessages")
            .UsePropertyAccessMode(PropertyAccessMode.Field);
    }
}
