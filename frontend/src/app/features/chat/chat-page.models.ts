export interface ChatSendRequest {
  readonly question: string;
  readonly documentIds: readonly string[];
}

export interface CitationSelection {
  readonly messageId: string;
  readonly index: number;
}
