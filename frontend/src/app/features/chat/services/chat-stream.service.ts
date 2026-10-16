import { inject, Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { AskQuestionRequest, ChatSseEvent } from '../../../core/models/chat.models';
import { CitationDto } from '../../../core/models/citation.models';
import { AuthService } from '../../../core/services/auth.service';

@Injectable({ providedIn: 'root' })
export class ChatStreamService {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly baseUrl = environment.apiUrl.replace(/\/+$/, '');

  stream(
    sessionId: string,
    request: AskQuestionRequest,
    signal: AbortSignal,
  ): Observable<ChatSseEvent> {
    return new Observable<ChatSseEvent>((observer) => {
      const controller = new AbortController();
      const abortFromCaller = (): void => controller.abort();
      signal.addEventListener('abort', abortFromCaller, { once: true });
      if (signal.aborted) {
        controller.abort();
      }

      void this.readStream(sessionId, request, controller.signal, observer);

      return () => {
        signal.removeEventListener('abort', abortFromCaller);
        controller.abort();
      };
    });
  }

  private async readStream(
    sessionId: string,
    request: AskQuestionRequest,
    signal: AbortSignal,
    observer: {
      next: (event: ChatSseEvent) => void;
      error: (error: unknown) => void;
      complete: () => void;
    },
  ): Promise<void> {
    try {
      const token = this.auth.token();
      if (!token) {
        throw new Error('Your session has expired. Please sign in again.');
      }

      const response = await fetch(
        `${this.baseUrl}/api/chat/sessions/${encodeURIComponent(sessionId)}/ask`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
            Accept: 'text/event-stream',
          },
          body: JSON.stringify(request),
          signal,
        },
      );

      if (response.status === 401) {
        this.auth.logout();
        void this.router.navigateByUrl('/login');
        throw new Error('Your session has expired. Please sign in again.');
      }
      if (!response.ok) {
        throw new Error(await this.readError(response));
      }
      if (!response.body) {
        throw new Error('The response did not include a readable chat stream.');
      }
      if (!response.headers.get('content-type')?.includes('text/event-stream')) {
        throw new Error('The server returned an unexpected response instead of a chat stream.');
      }

      await this.consumeEvents(response.body, signal, observer);
    } catch (error) {
      if (!signal.aborted) {
        observer.error(error);
      }
      return;
    }
    observer.complete();
  }

  private async consumeEvents(
    body: ReadableStream<Uint8Array>,
    signal: AbortSignal,
    observer: {
      next: (event: ChatSseEvent) => void;
      error: (error: unknown) => void;
      complete: () => void;
    },
  ): Promise<void> {
    const reader = body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let eventName = '';
    let dataLines: string[] = [];
    let receivedDone = false;

    const dispatch = (): void => {
      if (dataLines.length === 0) {
        eventName = '';
        return;
      }

      const data = dataLines.join('\n');
      switch (eventName) {
        case 'token': {
          const token: unknown = JSON.parse(data);
          if (typeof token !== 'string') {
            throw new Error('The chat stream returned a malformed token event.');
          }
          observer.next({ event: 'token', data: token });
          break;
        }
        case 'citations': {
          const citations: unknown = JSON.parse(data);
          if (!isCitationArray(citations)) {
            throw new Error('The chat stream returned malformed citations.');
          }
          observer.next({ event: 'citations', data: citations });
          break;
        }
        case 'done': {
          const done: unknown = JSON.parse(data);
          if (!isRecord(done)) {
            throw new Error('The chat stream returned a malformed completion event.');
          }
          observer.next({ event: 'done', data: {} });
          receivedDone = true;
          break;
        }
      }

      eventName = '';
      dataLines = [];
    };

    const readLine = (line: string): void => {
      if (line === '') {
        dispatch();
      } else if (!line.startsWith(':')) {
        const separator = line.indexOf(':');
        const field = separator < 0 ? line : line.slice(0, separator);
        let value = separator < 0 ? '' : line.slice(separator + 1);
        if (value.startsWith(' ')) {
          value = value.slice(1);
        }
        if (field === 'event') {
          eventName = value;
        } else if (field === 'data') {
          dataLines.push(value);
        }
      }
    };

    try {
      while (!signal.aborted) {
        const { value, done } = await reader.read();
        if (done) {
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        let newline = buffer.indexOf('\n');
        while (newline >= 0) {
          let line = buffer.slice(0, newline);
          if (line.endsWith('\r')) {
            line = line.slice(0, -1);
          }
          readLine(line);
          buffer = buffer.slice(newline + 1);
          newline = buffer.indexOf('\n');
        }
      }

      buffer += decoder.decode();
      if (buffer.length > 0) {
        readLine(buffer.endsWith('\r') ? buffer.slice(0, -1) : buffer);
      }
      dispatch();
      if (!signal.aborted && !receivedDone) {
        throw new Error('The chat stream ended before the answer was complete.');
      }
    } finally {
      if (signal.aborted) {
        await reader.cancel().catch(() => undefined);
      }
      reader.releaseLock();
    }
  }

  private async readError(response: Response): Promise<string> {
    const fallback = response.status === 429
      ? 'You have reached the chat request limit. Please wait and try again.'
      : response.status >= 500
        ? 'The server could not complete your request. Please try again.'
        : 'Your question could not be sent. Please try again.';

    try {
      const body: unknown = await response.json();
      if (!isRecord(body)) {
        return fallback;
      }
      for (const key of ['title', 'detail']) {
        const message = body[key];
        if (typeof message === 'string' && message.trim()) {
          return message;
        }
      }
      const errors = body['errors'];
      if (isRecord(errors)) {
        const firstError = Object.values(errors)
          .flatMap((value) => typeof value === 'string' ? [value] : Array.isArray(value) ? value : [])
          .find((value): value is string => typeof value === 'string' && value.trim().length > 0);
        if (firstError) {
          return firstError;
        }
      }
    } catch {
      return fallback;
    }
    return fallback;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isCitationArray(value: unknown): value is readonly CitationDto[] {
  return Array.isArray(value) && value.every((citation: unknown) => {
    if (!isRecord(citation)) {
      return false;
    }
    return typeof citation['chunkId'] === 'string'
      && typeof citation['documentId'] === 'string'
      && typeof citation['documentName'] === 'string'
      && typeof citation['content'] === 'string'
      && (citation['pageNumber'] === null || typeof citation['pageNumber'] === 'number')
      && typeof citation['score'] === 'number'
      && Number.isFinite(citation['score']);
  });
}
