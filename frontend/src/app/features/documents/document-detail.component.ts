import { ChangeDetectionStrategy, Component, DestroyRef, inject, input, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';
import { LucideArrowLeft, LucideFileText } from '@lucide/angular';
import { EMPTY, Subject, catchError, startWith, switchMap, tap } from 'rxjs';
import { DocumentDto } from '../../core/models/document.models';
import { ChatService } from '../../core/services/chat.service';
import { DocumentsService } from '../../core/services/documents.service';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { FileSizePipe } from '../../shared/pipes/file-size.pipe';
import { RelativeTimePipe } from '../../shared/pipes/relative-time.pipe';
import { StatusBadgeComponent } from './status-badge.component';

@Component({
  selector: 'app-document-detail',
  imports: [
    ButtonComponent,
    FileSizePipe,
    LucideArrowLeft,
    LucideFileText,
    RelativeTimePipe,
    RouterLink,
    StatusBadgeComponent,
  ],
  template: `
    <section class="detail-page">
      <a class="back-link" routerLink="/documents">
        <svg lucideArrowLeft [size]="17"></svg>
        All documents
      </a>

      @if (loading()) {
        <div class="detail-loading" role="status">Loading document details…</div>
      } @else if (loadError()) {
        <section class="detail-error" role="alert">
          <h1>Document details unavailable</h1>
          <p>We couldn’t load this document. It may have been deleted or you may not have access.</p>
          <app-button variant="secondary" (click)="load()">Try again</app-button>
        </section>
      } @else if (document(); as currentDocument) {
        <header class="detail-header">
          <div class="detail-header__file">
            <span class="detail-header__icon"><svg lucideFileText [size]="22"></svg></span>
            <div>
              <p class="detail-eyebrow">Document details</p>
              <h1>{{ currentDocument.fileName }}</h1>
              <p class="detail-header__size">{{ currentDocument.sizeBytes | fileSize }}</p>
            </div>
          </div>
          <app-button [loading]="creatingChat()" [disabled]="creatingChat()" (click)="chatWithDocument(currentDocument)">
            Chat with this document
          </app-button>
        </header>

        <section class="metadata-card" aria-labelledby="metadata-heading">
          <h2 id="metadata-heading">Information</h2>
          <dl class="metadata-list">
            <div class="metadata-row">
              <dt>Status</dt>
              <dd><app-document-status [status]="currentDocument.status" [errorMessage]="currentDocument.errorMessage" /></dd>
            </div>
            <div class="metadata-row">
              <dt>File name</dt>
              <dd>{{ currentDocument.fileName }}</dd>
            </div>
            <div class="metadata-row">
              <dt>File type</dt>
              <dd>{{ currentDocument.contentType || 'Unknown' }}</dd>
            </div>
            <div class="metadata-row">
              <dt>File size</dt>
              <dd>{{ currentDocument.sizeBytes | fileSize }}</dd>
            </div>
            @if (currentDocument.pageCount !== null) {
              <div class="metadata-row">
                <dt>Pages</dt>
                <dd>{{ currentDocument.pageCount }}</dd>
              </div>
            }
            <div class="metadata-row">
              <dt>Uploaded</dt>
              <dd><time [attr.datetime]="currentDocument.createdAt">{{ currentDocument.createdAt | relativeTime }}</time></dd>
            </div>
            @if (currentDocument.updatedAt) {
              <div class="metadata-row">
                <dt>Last updated</dt>
                <dd><time [attr.datetime]="currentDocument.updatedAt">{{ currentDocument.updatedAt | relativeTime }}</time></dd>
              </div>
            }
            @if (currentDocument.errorMessage) {
              <div class="metadata-row metadata-row--error">
                <dt>Processing error</dt>
                <dd>{{ currentDocument.errorMessage }}</dd>
              </div>
            }
          </dl>
        </section>
      }
    </section>
  `,
  styleUrl: './document-detail.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DocumentDetailComponent {
  private readonly documentsService = inject(DocumentsService);
  private readonly chat = inject(ChatService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly reloadRequested = new Subject<void>();

  readonly id = input.required<string>();
  protected readonly document = signal<DocumentDto | null>(null);
  protected readonly loading = signal(true);
  protected readonly loadError = signal(false);
  protected readonly creatingChat = signal(false);

  constructor() {
    toObservable(this.id).pipe(
      switchMap((id) => this.reloadRequested.pipe(
        startWith(void 0),
        switchMap(() => {
          this.loading.set(true);
          this.loadError.set(false);
          return this.documentsService.getById(id).pipe(
            tap((document) => {
              this.document.set(document);
              this.loading.set(false);
            }),
            catchError(() => {
              this.document.set(null);
              this.loading.set(false);
              this.loadError.set(true);
              return EMPTY;
            }),
          );
        }),
      )),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe();
  }

  protected load(): void {
    this.reloadRequested.next();
  }

  protected chatWithDocument(document: DocumentDto): void {
    if (this.creatingChat()) {
      return;
    }

    this.creatingChat.set(true);
    this.chat.createSession({ title: `Chat: ${document.fileName}` })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (session) => void this.router.navigate(['/chat', session.id]),
        error: () => this.creatingChat.set(false),
      });
  }
}
