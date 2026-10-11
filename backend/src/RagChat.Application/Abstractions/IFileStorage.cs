namespace RagChat.Application.Abstractions;

public interface IFileStorage
{
    Task<string> SaveAsync(
        Stream content,
        string fileName,
        string contentType,
        CancellationToken cancellationToken);

    Task<Stream> OpenReadAsync(string storagePath, CancellationToken cancellationToken);

    Task DeleteAsync(string storagePath, CancellationToken cancellationToken);
}
