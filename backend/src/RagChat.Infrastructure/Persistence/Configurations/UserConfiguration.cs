using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using RagChat.Domain.Entities;

namespace RagChat.Infrastructure.Persistence.Configurations;

public sealed class UserConfiguration : IEntityTypeConfiguration<User>
{
    public void Configure(EntityTypeBuilder<User> builder)
    {
        builder.HasKey(user => user.Id);
        builder.Property(user => user.Email).HasMaxLength(320).IsRequired();
        builder.Property(user => user.PasswordHash).HasMaxLength(200).IsRequired();
        builder.Property(user => user.DisplayName).HasMaxLength(100).IsRequired();
        builder.Property(user => user.CreatedAt).IsRequired();
        builder.HasIndex(user => user.Email).IsUnique();

        builder.HasMany(user => user.Documents)
            .WithOne()
            .HasForeignKey(document => document.UserId)
            .OnDelete(DeleteBehavior.Cascade);
        builder.Navigation(user => user.Documents).HasField("_documents").UsePropertyAccessMode(PropertyAccessMode.Field);

        builder.HasMany(user => user.ChatSessions)
            .WithOne()
            .HasForeignKey(session => session.UserId)
            .OnDelete(DeleteBehavior.Cascade);
        builder.Navigation(user => user.ChatSessions).HasField("_chatSessions").UsePropertyAccessMode(PropertyAccessMode.Field);
    }
}
