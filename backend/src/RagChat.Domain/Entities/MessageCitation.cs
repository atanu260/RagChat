using RagChat.Domain.Common;

namespace RagChat.Domain.Entities;

public sealed class MessageCitation : BaseEntity
{
    public MessageCitation(Guid messageId, Guid chunkId, double score)
    {
        if (messageId == Guid.Empty)
        {
            throw new ArgumentException("A message ID is required.", nameof(messageId));
        }

        if (chunkId == Guid.Empty)
        {
            throw new ArgumentException("A chunk ID is required.", nameof(chunkId));
        }

        if (!double.IsFinite(score))
        {
            throw new ArgumentOutOfRangeException(nameof(score), "The score must be a finite number.");
        }

        MessageId = messageId;
        ChunkId = chunkId;
        Score = score;
    }

    public Guid MessageId { get; private set; }

    public Guid ChunkId { get; private set; }

    public double Score { get; private set; }
}
