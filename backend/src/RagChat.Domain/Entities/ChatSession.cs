using RagChat.Domain.Common;

namespace RagChat.Domain.Entities;

public sealed class ChatSession : BaseEntity
{
    private readonly List<ChatMessage> _chatMessages = [];

    public ChatSession(Guid userId, string title)
    {
        if (userId == Guid.Empty)
        {
            throw new ArgumentException("A user ID is required.", nameof(userId));
        }

        ArgumentException.ThrowIfNullOrWhiteSpace(title);

        UserId = userId;
        Title = title.Trim();
    }

    public Guid UserId { get; private set; }

    public string Title { get; private set; }

    public IReadOnlyCollection<ChatMessage> ChatMessages => _chatMessages.AsReadOnly();

    public void Rename(string title)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(title);

        Title = title.Trim();
        MarkUpdated();
    }

    public void AddChatMessage(ChatMessage chatMessage)
    {
        ArgumentNullException.ThrowIfNull(chatMessage);

        if (chatMessage.SessionId != Id)
        {
            throw new ArgumentException("The message belongs to a different chat session.", nameof(chatMessage));
        }

        if (_chatMessages.Any(existing => existing.Id == chatMessage.Id))
        {
            throw new InvalidOperationException("The message is already associated with this chat session.");
        }

        _chatMessages.Add(chatMessage);
        MarkUpdated();
    }
}
