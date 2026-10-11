using System.Net.Mail;
using RagChat.Domain.Common;

namespace RagChat.Domain.Entities;

public sealed class User : BaseEntity
{
    private readonly List<Document> _documents = [];
    private readonly List<ChatSession> _chatSessions = [];

    public User(string email, string passwordHash, string displayName)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(email);
        ArgumentException.ThrowIfNullOrWhiteSpace(passwordHash);
        ArgumentException.ThrowIfNullOrWhiteSpace(displayName);

        if (!MailAddress.TryCreate(email, out var parsedEmail)
            || !string.Equals(parsedEmail.Address, email, StringComparison.OrdinalIgnoreCase))
        {
            throw new ArgumentException("A valid email address is required.", nameof(email));
        }

        Email = parsedEmail.Address;
        PasswordHash = passwordHash.Trim();
        DisplayName = displayName.Trim();
    }

    public string Email { get; private set; }

    public string PasswordHash { get; private set; }

    public string DisplayName { get; private set; }

    public IReadOnlyCollection<Document> Documents => _documents.AsReadOnly();

    public IReadOnlyCollection<ChatSession> ChatSessions => _chatSessions.AsReadOnly();

    public void AddDocument(Document document)
    {
        ArgumentNullException.ThrowIfNull(document);

        if (document.UserId != Id)
        {
            throw new ArgumentException("The document belongs to a different user.", nameof(document));
        }

        if (_documents.Any(existing => existing.Id == document.Id))
        {
            throw new InvalidOperationException("The document is already associated with this user.");
        }

        _documents.Add(document);
        MarkUpdated();
    }

    public void AddChatSession(ChatSession chatSession)
    {
        ArgumentNullException.ThrowIfNull(chatSession);

        if (chatSession.UserId != Id)
        {
            throw new ArgumentException("The chat session belongs to a different user.", nameof(chatSession));
        }

        if (_chatSessions.Any(existing => existing.Id == chatSession.Id))
        {
            throw new InvalidOperationException("The chat session is already associated with this user.");
        }

        _chatSessions.Add(chatSession);
        MarkUpdated();
    }
}
