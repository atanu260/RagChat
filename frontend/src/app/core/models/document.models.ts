export type DocumentStatus = 'Uploaded' | 'Processing' | 'Ready' | 'Failed';

export interface DocumentDto {
  readonly id: string;
  readonly fileName: string;
  readonly contentType: string;
  readonly sizeBytes: number;
  readonly status: DocumentStatus;
  readonly errorMessage: string | null;
  readonly pageCount: number | null;
  readonly createdAt: string;
  readonly updatedAt: string | null;
}
