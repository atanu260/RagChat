import { inject, Injectable, signal } from '@angular/core';
import { Observable, Subject, Subscription, catchError, of, switchMap, tap } from 'rxjs';
import { ChatMessageDto, ChatSessionDto, CreateSessionRequest } from '../../../core/models/chat.models';
import { CitationDto } from '../../../core/models/citation.models';
import { ChatService } from '../../../core/services/chat.service';
import { ChatStreamService } from '../services/chat-stream.service';

export type ChatMessageState = 'complete' | 'streaming' | 'failed' | 'stopped';

export interface ChatMessageView extends ChatMessageDto {
  readonly citations: readonly CitationDto[];
  readonly state: ChatMessageState;
  readonly errorMessage: string | null;
}

interface PendingQuestion {
  readonly question: string;
  readonly documentIds: readonly string[];
}

@Injectable({ providedIn: 'root' })
export class ChatStore {
  private readonly chat = inject(ChatService);
  private readonly stream = inject(ChatStreamService);
  private readonly sessionSelection = new Subject<string | null>();
  private readonly sessionsState = signal<readonly ChatSessionDto[]>([]);
  private readonly activeSessionIdState = signal<string | null>(null);
  private readonly messagesState = signal<readonly ChatMessageView[]>([]);
  private readonly isStreamingState = signal(false);
  private readonly loadingSessionsState = signal(true);
  private readonly loadingMessagesState = signal(false);
  private readonly sessionsErrorState = signal(false);
  private readonly messagesErrorState = signal(false);
  private activeStream: Subscription | null = null;
  private pendingSessionCreation: Subscription | null = null;
  private abortController: AbortController | null = null;
  private lastQuestion: PendingQuestion | null = null;

  readonly sessions = this.sessionsState.asReadonly();
  readonly activeSessionId = this.activeSessionIdState.asReadonly();
  readonly messages = this.messagesState.asReadonly();
  readonly isStreaming = this.isStreamingState.asReadonly();
  readonly loadingSessions = this.loadingSessionsState.asReadonly();
  readonly loadingMessages = this.loadingMessagesState.asReadonly();
  readonly sessionsError = this.sessionsErrorState.asReadonly();
  readonly messagesError = this.messagesErrorState.asReadonly();

  constructor() {
    this.sessionSelection.pipe(
      switchMap((sessionId) => {
        if (!sessionId) {
          this.loadingMessagesState.set(false);
          this.messagesErrorState.set(false);
          return of([] as readonly ChatMessageDto[]);
        }
        this.loadingMessagesState.set(true);
        this.messagesErrorState.set(false);
        return this.chat.getMessages(sessionId).pipe(
          tap((messages) => {
            this.messagesState.set(messages.map((message) => ({
              ...message,
              citations: [],
              state: 'complete',
              errorMessage: null,
            })));
          }),
          catchError(() => {
            this.messagesErrorState.set(true);
            return of([] as readonly ChatMessageDto[]);
          }),
        );
      }),
    ).subscribe((messages) => {
      if (messages.length === 0) {
        this.messagesState.set([]);
      }
      this.loadingMessagesState.set(false);
    });
  }

  loadSessions(): void {
    this.loadingSessionsState.set(true);
    this.sessionsErrorState.set(false);
    this.chat.listSessions().subscribe({
      next: (sessions) => {
        this.sessionsState.set([...sessions].sort(byRecentActivity));
        this.loadingSessionsState.set(false);
      },
      error: () => {
        this.sessionsErrorState.set(true);
        this.loadingSessionsState.set(false);
      },
    });
  }

  selectSession(sessionId: string | null): void {
    if (this.activeSessionIdState() === sessionId) {
      return;
    }
    this.stopGeneration();
    this.activeSessionIdState.set(sessionId);
    this.messagesState.set([]);
    this.lastQuestion = null;
    this.sessionSelection.next(sessionId);
  }

  reloadMessages(): void {
    const sessionId = this.activeSessionIdState();
    if (sessionId) {
      this.messagesState.set([]);
      this.sessionSelection.next(sessionId);
    }
  }

  newSession(request: CreateSessionRequest = { title: 'New conversation' }): Observable<ChatSessionDto> {
    return this.chat.createSession(request).pipe(
      tap((session) => {
        this.sessionsState.update((sessions) => [session, ...sessions.filter((item) => item.id !== session.id)]);
        this.activeSessionIdState.set(session.id);
        this.messagesState.set([]);
        this.lastQuestion = null;
      }),
    );
  }

  sendMessage(question: string, documentIds: readonly string[] = []): void {
    const normalizedQuestion = question.trim();
    if (!normalizedQuestion || this.isStreamingState()) {
      return;
    }
    const pending: PendingQuestion = { question: normalizedQuestion, documentIds };
    this.lastQuestion = pending;

    const userMessage = createMessage('User', normalizedQuestion);
    const assistantMessage = createMessage('Assistant', '');
    this.messagesState.update((messages) => [...messages, userMessage, assistantMessage]);
    this.isStreamingState.set(true);

    const sessionId = this.activeSessionIdState();
    if (sessionId) {
      this.startStream(sessionId, pending, assistantMessage.id);
      return;
    }

    this.pendingSessionCreation = this.newSession({ title: makeSessionTitle(normalizedQuestion) }).subscribe({
      next: (session) => this.startStream(session.id, pending, assistantMessage.id),
      error: (error: unknown) => {
        this.pendingSessionCreation = null;
        this.failAssistant(assistantMessage.id, friendlyError(error));
      },
    });
  }

  stopGeneration(): void {
    if (!this.isStreamingState()) {
      return;
    }
    this.abortController?.abort();
    this.activeStream?.unsubscribe();
    this.pendingSessionCreation?.unsubscribe();
    this.activeStream = null;
    this.pendingSessionCreation = null;
    this.abortController = null;
    this.isStreamingState.set(false);
    this.messagesState.update((messages) => messages.map((message) =>
      message.state === 'streaming' ? { ...message, state: 'stopped' } : message,
    ));
  }

  retryLast(): void {
    if (this.isStreamingState() || !this.lastQuestion) {
      return;
    }
    const messages = this.messagesState();
    let lastUserIndex = -1;
    for (let index = messages.length - 1; index >= 0; index -= 1) {
      if (messages[index].role === 'User') {
        lastUserIndex = index;
        break;
      }
    }
    if (lastUserIndex < 0) {
      return;
    }
    const pending = this.lastQuestion;
    const assistantMessage = createMessage('Assistant', '');
    this.messagesState.set([
      ...messages.slice(0, lastUserIndex + 1),
      assistantMessage,
    ]);
    this.isStreamingState.set(true);
    const sessionId = this.activeSessionIdState();
    if (sessionId) {
      this.startStream(sessionId, pending, assistantMessage.id);
    } else {
      this.pendingSessionCreation = this.newSession({ title: makeSessionTitle(pending.question) }).subscribe({
        next: (session) => this.startStream(session.id, pending, assistantMessage.id),
        error: (error: unknown) => {
          this.pendingSessionCreation = null;
          this.failAssistant(assistantMessage.id, friendlyError(error));
        },
      });
    }
  }

  private startStream(sessionId: string, pending: PendingQuestion, assistantMessageId: string): void {
    this.pendingSessionCreation = null;
    this.abortController = new AbortController();
    const controller = this.abortController;
    this.activeStream = this.stream.stream(
      sessionId,
      {
        question: pending.question,
        documentIds: pending.documentIds.length > 0 ? pending.documentIds : null,
      },
      controller.signal,
    ).subscribe({
      next: (event) => {
        if (event.event === 'token') {
          this.updateAssistant(assistantMessageId, (message) => ({
            ...message,
            content: message.content + event.data,
          }));
        } else if (event.event === 'citations') {
          this.updateAssistant(assistantMessageId, (message) => ({
            ...message,
            citations: event.data,
          }));
        } else {
          this.updateAssistant(assistantMessageId, (message) => ({
            ...message,
            state: 'complete',
          }));
          this.isStreamingState.set(false);
          this.activeStream = null;
          this.abortController = null;
          this.loadSessions();
        }
      },
      error: (error: unknown) => {
        this.failAssistant(assistantMessageId, friendlyError(error));
      },
      complete: () => {
        if (this.isStreamingState() && !controller.signal.aborted) {
          this.failAssistant(assistantMessageId, 'The chat stream ended unexpectedly. Please retry.');
        }
      },
    });
  }

  private failAssistant(messageId: string, errorMessage: string): void {
    this.updateAssistant(messageId, (message) => ({
      ...message,
      state: 'failed',
      errorMessage,
    }));
    this.isStreamingState.set(false);
    this.activeStream = null;
    this.abortController = null;
  }

  private updateAssistant(
    messageId: string,
    update: (message: ChatMessageView) => ChatMessageView,
  ): void {
    this.messagesState.update((messages) => messages.map((message) =>
      message.id === messageId ? update(message) : message,
    ));
  }
}

function createMessage(role: 'User' | 'Assistant', content: string): ChatMessageView {
  return {
    id: globalThis.crypto.randomUUID(),
    role,
    content,
    createdAt: new Date().toISOString(),
    citations: [],
    state: role === 'User' ? 'complete' : 'streaming',
    errorMessage: null,
  };
}

function makeSessionTitle(question: string): string {
  const title = question.replace(/\s+/g, ' ').trim();
  return title.length > 60 ? `${title.slice(0, 57).trimEnd()}…` : title;
}

function friendlyError(error: unknown): string {
  return error instanceof Error && error.message.trim()
    ? error.message
    : 'Your message could not be sent. Please try again.';
}

function byRecentActivity(left: ChatSessionDto, right: ChatSessionDto): number {
  return Date.parse(right.updatedAt ?? right.createdAt) - Date.parse(left.updatedAt ?? left.createdAt);
}
