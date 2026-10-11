namespace RagChat.Application.Abstractions;

public interface ICurrentUser
{
    Guid UserId { get; }
}
