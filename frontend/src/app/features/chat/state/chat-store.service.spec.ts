import { TestBed } from '@angular/core/testing';
import { Observable, of, Subject } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ChatSseEvent } from '../../../core/models/chat.models';
import { ChatService } from '../../../core/services/chat.service';
import { ChatStreamService } from '../services/chat-stream.service';
import { ChatStore } from './chat-store.service';

describe('ChatStore', () => {
  let store: ChatStore;
  let events: Subject<ChatSseEvent>;
  let createStream: (signal: AbortSignal) => Observable<ChatSseEvent>;
  let lastSignal: AbortSignal | undefined;
  let streamUnsubscribed: boolean;

  beforeEach(() => {
    events = new Subject<ChatSseEvent>();
    createStream = () => events.asObservable();
    lastSignal = undefined;
    streamUnsubscribed = false;

    const chat: Pick<ChatService, 'createSession' | 'getMessages' | 'listSessions'> = {
      createSession: vi.fn(() => of({
        id: 'session-1',
        title: 'Question',
        createdAt: '2026-10-11T00:00:00Z',
        updatedAt: null,
      })),
      getMessages: vi.fn(() => of([])),
      listSessions: vi.fn(() => of([])),
    };
    const stream: Pick<ChatStreamService, 'stream'> = {
      stream: vi.fn((_sessionId, _request, signal) => {
        lastSignal = signal;
        return createStream(signal);
      }),
    };

    TestBed.configureTestingModule({
      providers: [
        ChatStore,
        { provide: ChatService, useValue: chat },
        { provide: ChatStreamService, useValue: stream },
      ],
    });
    store = TestBed.inject(ChatStore);
    store.selectSession('session-1');
  });

  it('appends tokens to the assistant message and attaches citations', () => {
    store.sendMessage('  What matters?  ');
    events.next({ event: 'token', data: 'The ' });
    events.next({ event: 'token', data: 'answer.' });
    events.next({
      event: 'citations',
      data: [{
        chunkId: 'chunk-1',
        documentId: 'doc-1',
        documentName: 'Guide.pdf',
        content: 'Supporting excerpt',
        pageNumber: 3,
        score: 0.8,
      }],
    });

    expect(store.messages()).toHaveLength(2);
    expect(store.messages()[0].content).toBe('What matters?');
    expect(store.messages()[1].content).toBe('The answer.');
    expect(store.messages()[1].citations[0].documentName).toBe('Guide.pdf');

    events.next({ event: 'done', data: {} });

    expect(store.messages()[1].state).toBe('complete');
    expect(store.isStreaming()).toBe(false);
  });

  it('aborts and unsubscribes the active stream when generation is stopped', () => {
    createStream = () => new Observable<ChatSseEvent>(() => () => {
      streamUnsubscribed = true;
    });

    store.sendMessage('Stop this answer');
    expect(lastSignal).toBeDefined();
    expect(store.isStreaming()).toBe(true);

    store.stopGeneration();

    expect(lastSignal?.aborted).toBe(true);
    expect(streamUnsubscribed).toBe(true);
    expect(store.isStreaming()).toBe(false);
    expect(store.messages()[1].state).toBe('stopped');
  });
});
