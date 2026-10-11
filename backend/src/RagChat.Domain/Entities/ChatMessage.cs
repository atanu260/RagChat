using RagChat.Domain.Common;
using RagChat.Domain.Enums;

namespace RagChat.Domain.Entities;

public sealed class ChatMessage : BaseEntity
{
    private readonly List<MessageCitation> _messageCitations = [];

    public ChatMessage(Guid sessionId, MessageRole role, string content)
    {
        if (sessionId == Guid.Empty)
        {
            throw new ArgumentException("A session ID is required.", nameof(sessionId));
        }

        if (!Enum.IsDefined(role))
        {
            throw new ArgumentOutOfRangeException(nameof(role), "The message role is not valid.");
        }

        ArgumentException.ThrowIfNullOrWhiteSpace(content);

        SessionId = sessionId;
        Role = role;
        Content = content.Trim();
    }

    public Guid SessionId { get; private set; }

    public MessageRole Role { get; private set; }

    public string Content { get; private set; }

    public IReadOnlyCollection<MessageCitation> MessageCitations => _messageCitations.AsReadOnly();

    public void AddMessageCitation(MessageCitation messageCitation)
    {
        ArgumentNullException.ThrowIfNull(messageCitation);

        if (messageCitation.MessageId != Id)
        {
            throw new ArgumentException("The citation belongs to a different message.", nameof(messageCitation));
        }

        if (_messageCitations.Any(existing => existing.Id == messageCitation.Id))
        {
            throw new InvalidOperationException("The citation is already associated with this message.");
        }

        _messageCitations.Add(messageCitation);
        MarkUpdated();
    }
}
