using System.Threading.Channels;
using Microsoft.Extensions.Options;
using RagChat.Application.Abstractions;

namespace RagChat.Infrastructure.BackgroundJobs;

public sealed class ChannelIngestionQueue : IIngestionQueue
{
    private readonly Channel<Guid> _channel;

    public ChannelIngestionQueue(IOptions<ChannelIngestionQueueOptions> options)
    {
        if (options.Value.Capacity <= 0)
        {
            throw new ArgumentOutOfRangeException(nameof(options.Value.Capacity));
        }

        _channel = Channel.CreateBounded<Guid>(new BoundedChannelOptions(options.Value.Capacity)
        {
            FullMode = BoundedChannelFullMode.Wait,
            SingleReader = true,
            SingleWriter = false
        });
    }

    public ValueTask EnqueueAsync(Guid documentId, CancellationToken cancellationToken)
    {
        if (documentId == Guid.Empty)
        {
            throw new ArgumentException("A document ID is required.", nameof(documentId));
        }

        return _channel.Writer.WriteAsync(documentId, cancellationToken);
    }

    public ValueTask<Guid> DequeueAsync(CancellationToken cancellationToken) =>
        _channel.Reader.ReadAsync(cancellationToken);
}
