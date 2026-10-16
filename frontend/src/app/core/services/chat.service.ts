import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { ChatMessageDto, ChatSessionDto, CreateSessionRequest } from '../models/chat.models';

@Injectable({ providedIn: 'root' })
export class ChatService {
  private readonly api = inject(ApiService);

  createSession(request: CreateSessionRequest): Observable<ChatSessionDto> {
    return this.api.post<ChatSessionDto>('/api/chat/sessions', request);
  }

  listSessions(): Observable<readonly ChatSessionDto[]> {
    return this.api.get<readonly ChatSessionDto[]>('/api/chat/sessions');
  }

  getMessages(sessionId: string): Observable<readonly ChatMessageDto[]> {
    return this.api.get<readonly ChatMessageDto[]>(
      `/api/chat/sessions/${encodeURIComponent(sessionId)}/messages`,
    );
  }
}
