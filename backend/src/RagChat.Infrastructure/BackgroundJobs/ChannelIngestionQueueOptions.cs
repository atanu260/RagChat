namespace RagChat.Infrastructure.BackgroundJobs;

public sealed class ChannelIngestionQueueOptions
{
    public const string SectionName = "IngestionQueue";

    public int Capacity { get; set; } = 100;
}
