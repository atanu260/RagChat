using System.Text.RegularExpressions;
using Microsoft.Extensions.Options;
using RagChat.Application.Abstractions;
using RagChat.Application.Common;

namespace RagChat.Infrastructure.Chunking;

public sealed partial class SentenceAwareChunker : IChunkingStrategy
{
    private const double ApproximateTokensPerWord = 1.3;
    private readonly int _targetWords;
    private readonly int _overlapWords;

    public SentenceAwareChunker(IOptions<SentenceAwareChunkingOptions> options)
    {
        var settings = options.Value;
        if (settings.TargetTokens <= 0)
        {
            throw new ArgumentOutOfRangeException(nameof(settings.TargetTokens));
        }

        if (settings.OverlapTokens < 0 || settings.OverlapTokens >= settings.TargetTokens)
        {
            throw new ArgumentOutOfRangeException(nameof(settings.OverlapTokens));
        }

        _targetWords = Math.Max(1, (int)Math.Floor(settings.TargetTokens / ApproximateTokensPerWord));
        _overlapWords = Math.Min(
            _targetWords - 1,
            (int)Math.Floor(settings.OverlapTokens / ApproximateTokensPerWord));
    }

    public IReadOnlyList<TextChunk> Chunk(IReadOnlyList<ParsedPage> pages)
    {
        ArgumentNullException.ThrowIfNull(pages);
        var chunks = new List<TextChunk>();

        foreach (var page in pages)
        {
            if (string.IsNullOrWhiteSpace(page.Content))
            {
                continue;
            }

            var words = new List<string>();
            foreach (var sentence in SentenceBoundaryRegex().Split(page.Content))
            {
                var sentenceWords = WordRegex().Matches(sentence).Select(match => match.Value).ToArray();
                if (sentenceWords.Length == 0)
                {
                    continue;
                }

                var offset = 0;
                while (offset < sentenceWords.Length)
                {
                    var capacity = _targetWords - words.Count;
                    if (capacity == 0)
                    {
                        AddChunk(chunks, words, page.PageNumber);
                        words = GetOverlap(words);
                        capacity = _targetWords - words.Count;
                    }

                    var take = Math.Min(capacity, sentenceWords.Length - offset);
                    words.AddRange(sentenceWords.Skip(offset).Take(take));
                    offset += take;
                }

                if (words.Count >= _targetWords)
                {
                    AddChunk(chunks, words, page.PageNumber);
                    words = GetOverlap(words);
                }
            }

            if (words.Count > 0)
            {
                AddChunk(chunks, words, page.PageNumber);
            }
        }

        return chunks;
    }

    private List<string> GetOverlap(List<string> words) =>
        _overlapWords == 0
            ? []
            : words.TakeLast(_overlapWords).ToList();

    private static void AddChunk(List<TextChunk> chunks, List<string> words, int pageNumber)
    {
        var content = string.Join(' ', words);
        var tokenCount = Math.Max(1, (int)Math.Ceiling(words.Count * ApproximateTokensPerWord));
        chunks.Add(new TextChunk(content, pageNumber, tokenCount));
    }

    [GeneratedRegex(@"(?<=[.!?])\s+", RegexOptions.CultureInvariant)]
    private static partial Regex SentenceBoundaryRegex();

    [GeneratedRegex(@"\S+", RegexOptions.CultureInvariant)]
    private static partial Regex WordRegex();
}
