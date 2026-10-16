import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal, viewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { HttpEventType, HttpResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { EMPTY, Observable, Subject, catchError, switchMap, tap, timer } from 'rxjs';
import { getFriendlyErrorMessage } from '../../core/interceptors/error.interceptor';
import { ChatService } from '../../core/services/chat.service';
import { ConfirmDialogService } from '../../core/services/confirm-dialog.service';
import { DocumentsService } from '../../core/services/documents.service';
import { ToastService } from '../../core/services/toast.service';
import { DocumentDto } from '../../core/models/document.models';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { DocumentListComponent } from './document-list.component';
import { DocumentUploadComponent } from './document-upload.component';
import { UploadTask } from './upload-task.model';

@Component({
  selector: 'app-documents-page',
  imports: [ButtonComponent, DocumentListComponent, DocumentUploadComponent],
  template: `
    <section class="page">
      <header class="page-header">
        <div>
          <p class="page-eyebrow">Your knowledge base</p>
          <h1>Documents</h1>
          <p class="page-description">Upload and manage the files you want to explore with RagChat.</p>
        </div>
        <app-button (click)="browseForFiles()">Upload</app-button>
      </header>

      <app-document-upload
        [tasks]="uploadTasks()"
        (filesSelected)="uploadFiles($event)"
        (cleared)="clearCompletedUploads($event)"
      />

      <section class="documents-section" aria-labelledby="documents-heading">
        <header class="documents-section__header">
          <div>
            <h2 id="documents-heading">Your documents</h2>
            <p>Files available in your workspace</p>
          </div>
          @if (!loading() && documents().length > 0) {
            <span class="document-count">{{ documents().length }}</span>
          }
        </header>

        @if (loadError()) {
          <div class="load-error" role="alert">
            <div>
              <h3>Documents couldn’t be loaded</h3>
              <p>Check your connection and try again.</p>
            </div>
            <app-button variant="secondary" size="sm" (click)="retry()">
              Try again
            </app-button>
          </div>
        } @else {
          <app-document-list
            [documents]="documents()"
            [loading]="loading()"
            (reindexRequested)="reindex($event)"
            (deleteRequested)="confirmDelete($event)"
          />
        }
      </section>
    </section>
  `,
  styleUrl: './documents-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DocumentsPageComponent {
  private readonly documentsService = inject(DocumentsService);
  private readonly chat = inject(ChatService);
  private readonly confirmDialog = inject(ConfirmDialogService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly refreshRequested = new Subject<void>();
  private nextUploadId = 0;

  private readonly uploader = viewChild.required(DocumentUploadComponent);

  protected readonly documents = signal<readonly DocumentDto[]>([]);
  protected readonly uploadTasks = signal<readonly UploadTask[]>([]);
  protected readonly loading = signal(true);
  protected readonly loadError = signal(false);

  constructor() {
    this.refreshRequested
      .pipe(
        switchMap(() => this.loadAndPoll()),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
    this.refreshRequested.next();
  }

  protected browseForFiles(): void {
    this.uploader().browse();
  }

  protected retry(): void {
    this.loading.set(true);
    this.loadError.set(false);
    this.refreshRequested.next();
  }

  protected uploadFiles(files: readonly File[]): void {
    for (const file of files) {
      const taskId = `${Date.now()}-${++this.nextUploadId}`;
      const task: UploadTask = {
        id: taskId,
        fileName: file.name,
        sizeBytes: file.size,
        progress: 0,
        state: 'uploading',
        errorMessage: null,
      };
      this.uploadTasks.update((tasks) => [...tasks, task]);
      this.documentsService.upload(file)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (event) => {
            if (event.type === HttpEventType.UploadProgress) {
              const progress = event.total
                ? Math.min(100, Math.round((event.loaded / event.total) * 100))
                : 0;
              this.updateUploadTask(taskId, { progress });
            } else if (event instanceof HttpResponse && event.body) {
              this.updateUploadTask(taskId, { progress: 100, state: 'success', errorMessage: null });
              this.refreshRequested.next();
              this.toast.show(`${file.name} uploaded successfully.`, 'success');
            }
          },
          error: (error: unknown) => {
            this.updateUploadTask(taskId, {
              state: 'failed',
              errorMessage: getFriendlyErrorMessage(error),
            });
          },
          complete: () => {
            const taskState = this.uploadTasks().find((item) => item.id === taskId)?.state;
            if (taskState === 'uploading') {
              this.updateUploadTask(taskId, {
                state: 'failed',
                errorMessage: 'The upload finished without a document response.',
              });
            }
          },
        });
    }
  }

  protected clearCompletedUploads(activeTaskIds: ReadonlySet<string>): void {
    this.uploadTasks.update((tasks) => tasks.filter((task) => activeTaskIds.has(task.id)));
  }

  protected reindex(document: DocumentDto): void {
    this.documentsService.reindex(document.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.toast.show(`Reindexing ${document.fileName} has started.`, 'success');
          this.refreshRequested.next();
        },
      });
  }

  protected confirmDelete(document: DocumentDto): void {
    this.confirmDialog.confirm({
      title: 'Delete document?',
      description: `“${document.fileName}” will be permanently deleted from your workspace.`,
      confirmLabel: 'Delete document',
      destructive: true,
    }).pipe(
      switchMap((confirmed) => confirmed ? this.documentsService.delete(document.id) : EMPTY),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: () => {
        this.toast.show(`${document.fileName} was deleted.`, 'success');
        this.refreshRequested.next();
      },
    });
  }

  private loadAndPoll(): Observable<never> {
    return this.documentsService.list().pipe(
      tap((documents) => {
        this.documents.set(documents);
        this.loading.set(false);
        this.loadError.set(false);
      }),
      switchMap((documents) => documents.some((document) =>
        document.status === 'Uploaded' || document.status === 'Processing',
      )
        ? timer(3000).pipe(switchMap(() => this.loadAndPoll()))
        : EMPTY),
      catchError(() => {
        this.loading.set(false);
        this.loadError.set(true);
        return EMPTY;
      }),
    );
  }

  private updateUploadTask(id: string, changes: Partial<UploadTask>): void {
    this.uploadTasks.update((tasks) => tasks.map((task) =>
      task.id === id ? { ...task, ...changes } : task,
    ));
  }
}
