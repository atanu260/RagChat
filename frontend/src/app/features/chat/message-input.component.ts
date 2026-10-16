import { ChangeDetectionStrategy, Component, DestroyRef, inject, input, output, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { LucideArrowUp, LucideFileText, LucideSquare } from '@lucide/angular';
import { DocumentDto } from '../../core/models/document.models';
import { DocumentsService } from '../../core/services/documents.service';
import { ChatSendRequest } from './chat-page.models';

@Component({
  selector: 'app-message-input',
  imports: [LucideArrowUp, LucideFileText, LucideSquare],
  template: `
    <div class="composer">
      <label class="sr-only" for="chat-question">Ask a question about your documents</label>
      <textarea
        #questionBox
        id="chat-question"
        rows="1"
        maxlength="10000"
        [value]="draft()"
        [disabled]="isStreaming()"
        placeholder="Message RagChat…"
        aria-describedby="composer-hint document-scope-error"
        (input)="updateDraft($event, questionBox)"
        (keydown)="handleKeydown($event)"
      ></textarea>
      <div class="composer__footer">
        <div class="composer__options">
          <details class="scope-picker">
            <summary class="scope-select" [class.scope-select--disabled]="isStreaming() || readyDocuments().length === 0">
              <svg lucideFileText [size]="15"></svg>
              <span>Scope</span>
              <span class="scope-hint">
                {{ selectedDocumentIds().length ? selectedDocumentIds().length + ' selected' : 'All documents' }}
              </span>
            </summary>
            @if (readyDocuments().length > 0) {
              <div class="scope-menu" aria-label="Choose documents for this question">
                @for (document of readyDocuments(); track document.id) {
                  <label class="scope-option">
                    <input
                      type="checkbox"
                      [checked]="selectedDocumentIds().includes(document.id)"
                      [disabled]="isStreaming()"
                      (change)="toggleDocument(document.id, $event)"
                    />
                    <span>{{ document.fileName }}</span>
                  </label>
                }
              </div>
            }
          </details>
        </div>
        @if (isStreaming()) {
          <button class="send-button send-button--stop" type="button" aria-label="Stop generating" (click)="stop.emit()">
            <svg lucideSquare [size]="14"></svg>
          </button>
        } @else {
          <button
            class="send-button"
            type="button"
            aria-label="Send message"
            [disabled]="!draft().trim()"
            (click)="submit()"
          >
            <svg lucideArrowUp [size]="18"></svg>
          </button>
        }
      </div>
      @if (documentLoadError()) {
        <p class="scope-error" id="document-scope-error" role="status">Ready documents could not be loaded. You can still ask across your workspace.</p>
      } @else {
        <span class="composer__hint" id="composer-hint">
          {{ draft().length > 0 ? draft().length + ' / 10,000 · ' : '' }}Enter to send · Shift + Enter for a new line
        </span>
      }
    </div>
  `,
  styleUrl: './message-input.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MessageInputComponent {
  private readonly documentsService = inject(DocumentsService);
  private readonly destroyRef = inject(DestroyRef);

  readonly isStreaming = input(false);
  readonly send = output<ChatSendRequest>();
  readonly stop = output<void>();
  protected readonly draft = signal('');
  protected readonly readyDocuments = signal<readonly DocumentDto[]>([]);
  protected readonly selectedDocumentIds = signal<readonly string[]>([]);
  protected readonly documentLoadError = signal(false);

  constructor() {
    this.documentsService.list().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (documents) => this.readyDocuments.set(documents.filter((document) => document.status === 'Ready')),
      error: () => this.documentLoadError.set(true),
    });
  }

  protected updateDraft(event: Event, textarea: HTMLTextAreaElement): void {
    const target = event.target;
    if (!(target instanceof HTMLTextAreaElement)) {
      return;
    }
    this.draft.set(target.value);
    textarea.style.height = 'auto';
    const lineHeight = Number.parseFloat(getComputedStyle(textarea).lineHeight) || 22;
    const maxHeight = lineHeight * 8;
    textarea.style.height = `${Math.min(textarea.scrollHeight, maxHeight)}px`;
  }

  protected handleKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey && !event.isComposing) {
      event.preventDefault();
      this.submit();
    }
  }

  protected toggleDocument(documentId: string, event: Event): void {
    const target = event.target;
    if (!(target instanceof HTMLInputElement)) {
      return;
    }
    this.selectedDocumentIds.update((selected) => target.checked
      ? [...selected, documentId]
      : selected.filter((id) => id !== documentId),
    );
  }

  protected submit(): void {
    const question = this.draft().trim();
    if (!question || this.isStreaming()) {
      return;
    }
    this.send.emit({ question, documentIds: this.selectedDocumentIds() });
    this.draft.set('');
  }
}
