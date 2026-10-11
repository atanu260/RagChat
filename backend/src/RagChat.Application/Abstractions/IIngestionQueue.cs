namespace RagChat.Application.Abstractions;

public interface IIngestionQueue
{
    ValueTask EnqueueAsync(Guid documentId, CancellationToken cancellationToken);

    ValueTask<Guid> DequeueAsync(CancellationToken cancellationToken);
}
