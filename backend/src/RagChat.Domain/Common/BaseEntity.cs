namespace RagChat.Domain.Common;

public abstract class BaseEntity
{
    protected BaseEntity()
    {
        Id = Guid.NewGuid();
        CreatedAt = DateTime.UtcNow;
    }

    public Guid Id { get; private set; }

    public DateTime CreatedAt { get; private set; }

    public DateTime? UpdatedAt { get; private set; }

    protected void MarkUpdated()
    {
        UpdatedAt = DateTime.UtcNow;
    }
}
