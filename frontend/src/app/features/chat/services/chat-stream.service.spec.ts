import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ChatSseEvent } from '../../../core/models/chat.models';
import { AuthService } from '../../../core/services/auth.service';
import { ChatStreamService } from './chat-stream.service';

describe('ChatStreamService SSE parser', () => {
  let service: ChatStreamService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        ChatStreamService,
        provideRouter([]),
        { provide: AuthService, useValue: { token: () => 'test-token', logout: vi.fn() } },
      ],
    });
    service = TestBed.inject(ChatStreamService);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('parses event frames split across chunks', async () => {
    const events = await parseChunks([
      'event: tok',
      'en\r\ndata: "Hel',
      'lo"\r\n\r\n',
      'event: done\ndata: {}\n\n',
    ]);

    expect(events).toEqual([
      { event: 'token', data: 'Hello' },
      { event: 'done', data: {} },
    ]);
  });

  it('parses multiple events in one chunk using blank-line delimiters', async () => {
    const events = await parseChunks([
      'event: token\ndata: "Answer"\n\n'
        + 'event: citations\ndata: [{"chunkId":"chunk-1","documentId":"doc-1",'
        + '"documentName":"Guide.pdf","content":"Relevant excerpt","pageNumber":2,"score":0.9}]\n\n'
        + 'event: done\ndata: {}\n\n',
    ]);

    expect(events).toEqual([
      { event: 'token', data: 'Answer' },
      {
        event: 'citations',
        data: [{
          chunkId: 'chunk-1',
          documentId: 'doc-1',
          documentName: 'Guide.pdf',
          content: 'Relevant excerpt',
          pageNumber: 2,
          score: 0.9,
        }],
      },
      { event: 'done', data: {} },
    ]);
  });

  it('ignores malformed fields and unknown events', async () => {
    const events = await parseChunks([
      'not a field\nretry: 5000\nevent: unknown\ndata: ignored\n\n'
        + 'event: token\ndata: "kept"\n\n'
        + 'event: done\ndata: {}\n\n',
    ]);

    expect(events).toEqual([
      { event: 'token', data: 'kept' },
      { event: 'done', data: {} },
    ]);
  });

  function parseChunks(chunks: readonly string[]): Promise<ChatSseEvent[]> {
    const encoder = new TextEncoder();
    const body = new ReadableStream<Uint8Array>({
      start(controller) {
        for (const chunk of chunks) {
          controller.enqueue(encoder.encode(chunk));
        }
        controller.close();
      },
    });
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(body, {
      status: 200,
      headers: { 'Content-Type': 'text/event-stream' },
    }));

    const events: ChatSseEvent[] = [];
    return new Promise((resolve, reject) => {
      service.stream('session-1', { question: 'Question' }, new AbortController().signal).subscribe({
        next: (event) => events.push(event),
        error: (error: unknown) => reject(error),
        complete: () => resolve(events),
      });
    });
  }
});
