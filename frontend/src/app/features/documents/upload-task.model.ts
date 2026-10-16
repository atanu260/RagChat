export type UploadTaskState = 'uploading' | 'success' | 'failed';

export interface UploadTask {
  readonly id: string;
  readonly fileName: string;
  readonly sizeBytes: number;
  readonly progress: number;
  readonly state: UploadTaskState;
  readonly errorMessage: string | null;
}
