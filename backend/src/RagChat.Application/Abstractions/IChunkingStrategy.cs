using RagChat.Application.Common;

namespace RagChat.Application.Abstractions;

public interface IChunkingStrategy
{
    IReadOnlyList<TextChunk> Chunk(IReadOnlyList<ParsedPage> pages);
}
