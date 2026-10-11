using Microsoft.Extensions.Options;
using RagChat.Application.Abstractions;

namespace RagChat.Infrastructure.Storage;

public sealed class LocalFileStorage : IFileStorage
{
    private readonly string _rootFolder;

    public LocalFileStorage(IOptions<LocalFileStorageOptions> options)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(options.Value.RootPath);
        _rootFolder = Path.GetFullPath(options.Value.RootPath);
    }

    public async Task<string> SaveAsync(
        Stream content,
        string fileName,
        string contentType,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(content);
        ArgumentException.ThrowIfNullOrWhiteSpace(fileName);

        var extension = contentType.Trim().ToLowerInvariant() switch
        {
            "application/pdf" => ".pdf",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document" => ".docx",
            "text/plain" => ".txt",
            _ => throw new ArgumentException("The content type is not supported.", nameof(contentType))
        };

        Directory.CreateDirectory(_rootFolder);
        var storagePath = GetSafePath($"{Guid.NewGuid():N}{extension}");
        await using var destination = new FileStream(
            storagePath,
            FileMode.CreateNew,
            FileAccess.Write,
            FileShare.None,
            bufferSize: 81920,
            useAsync: true);
        await content.CopyToAsync(destination, cancellationToken);
        return storagePath;
    }

    public Task<Stream> OpenReadAsync(string storagePath, CancellationToken cancellationToken)
    {
        cancellationToken.ThrowIfCancellationRequested();
        return Task.FromResult<Stream>(new FileStream(
            GetSafePath(storagePath),
            FileMode.Open,
            FileAccess.Read,
            FileShare.Read,
            bufferSize: 81920,
            useAsync: true));
    }

    public Task DeleteAsync(string storagePath, CancellationToken cancellationToken)
    {
        cancellationToken.ThrowIfCancellationRequested();
        var safePath = GetSafePath(storagePath);
        if (File.Exists(safePath))
        {
            File.Delete(safePath);
        }

        return Task.CompletedTask;
    }

    private string GetSafePath(string path)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(path);
        var fullPath = Path.GetFullPath(Path.IsPathRooted(path) ? path : Path.Combine(_rootFolder, path));
        var rootWithSeparator = Path.EndsInDirectorySeparator(_rootFolder)
            ? _rootFolder
            : _rootFolder + Path.DirectorySeparatorChar;

        if (!fullPath.StartsWith(rootWithSeparator, StringComparison.OrdinalIgnoreCase))
        {
            throw new ArgumentException("The storage path is outside the configured root folder.", nameof(path));
        }

        return fullPath;
    }
}
