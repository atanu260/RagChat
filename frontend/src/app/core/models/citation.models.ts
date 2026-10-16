export interface CitationDto {
  readonly chunkId: string;
  readonly documentId: string;
  readonly documentName: string;
  readonly content: string;
  readonly pageNumber: number | null;
  readonly score: number;
}
