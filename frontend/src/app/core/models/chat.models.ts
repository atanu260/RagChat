import { CitationDto } from './citation.models';

export interface ChatSessionDto {
  readonly id: string;
  readonly title: string;
  readonly createdAt: string;
  readonly updatedAt: string | null;
}

export type ChatMessageRole = 'User' | 'Assistant' | 'System';

export interface ChatMessageDto {
  readonly id: string;
  readonly role: ChatMessageRole;
  readonly content: string;
  readonly createdAt: string;
}

export interface CreateSessionRequest {
  readonly title: string;
}

export interface AskQuestionRequest {
  readonly question: string;
  readonly documentIds?: readonly string[] | null;
}

export type ChatSseEvent =
  | { readonly event: 'token'; readonly data: string }
  | { readonly event: 'citations'; readonly data: readonly CitationDto[] }
  | { readonly event: 'done'; readonly data: Record<string, never> };

export type ChatSseEventName = ChatSseEvent['event'];
