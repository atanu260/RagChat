namespace RagChat.Infrastructure.Chunking;

public sealed class SentenceAwareChunkingOptions
{
    public const string SectionName = "Chunking";

    public int TargetTokens { get; set; } = 500;

    public int OverlapTokens { get; set; } = 50;
}
