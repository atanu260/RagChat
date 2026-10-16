import { ChangeDetectionStrategy, Component, ElementRef, afterRenderEffect, computed, inject, input, output, signal, viewChild } from '@angular/core';
import { MarkdownComponent } from 'ngx-markdown';
import { LucideBot, LucideCheck, LucideCopy, LucideRefreshCw } from '@lucide/angular';
import { ChatMessageView } from './state/chat-store.service';
import { CitationSelection } from './chat-page.models';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-message-list',
  imports: [LucideBot, LucideCheck, LucideCopy, LucideRefreshCw, MarkdownComponent],
  template: `
    <div
      #scrollRegion
      class="message-scroll"
      aria-label="Conversation messages"
      role="log"
      aria-live="polite"
      aria-atomic="false"
      aria-relevant="additions text"
      (scroll)="onScroll()"
    >
      <div class="message-column">
        @for (message of messages(); track message.id; let index = $index) {
          @if (message.role === 'User') {
            <article class="message-row message-row--user">
              <div class="user-bubble">{{ message.content }}</div>
            </article>
          } @else if (message.role === 'Assistant') {
            <article class="message-row message-row--assistant">
              <span class="assistant-avatar" aria-label="RagChat">
                <svg lucideBot [size]="17"></svg>
              </span>
              <div class="assistant-message">
                @if (message.state === 'streaming' && !message.content) {
                  <div class="typing-indicator" aria-label="RagChat is thinking" role="status">
                    <span></span><span></span><span></span>
                  </div>
                } @else {
                  <div
                    class="markdown-body"
                    (click)="handleMarkdownClick($event, message)"
                  >
                    <markdown [data]="markdownContent(message.content)" [clipboard]="true"></markdown>
                  </div>
                }
                @if (message.state === 'streaming' && message.content) {
                  <span class="streaming-caret" aria-label="Generating answer"></span>
                }
                @if (message.state === 'failed') {
                  <div class="message-error" role="alert">
                    <p>{{ message.errorMessage }}</p>
                    <button type="button" (click)="retry.emit()">
                      <svg lucideRefreshCw [size]="14"></svg>
                      Retry
                    </button>
                  </div>
                }
                @if (message.state === 'stopped') {
                  <p class="stopped-label">Generation stopped</p>
                }
                @if (message.content || message.state === 'complete') {
                  <div class="message-actions">
                    <button type="button" aria-label="Copy answer" (click)="copy(message)">
                      @if (copiedMessageId() === message.id) {
                        <svg lucideCheck [size]="14"></svg>
                        <span>Copied</span>
                      } @else {
                        <svg lucideCopy [size]="14"></svg>
                        <span>Copy</span>
                      }
                    </button>
                    @if (message.id === latestAssistantId()) {
                      <button type="button" aria-label="Regenerate answer" (click)="retry.emit()">
                        <svg lucideRefreshCw [size]="14"></svg>
                        <span>Regenerate</span>
                      </button>
                    }
                    @if (message.citations.length > 0) {
                      <button
                        type="button"
                        class="source-action"
                        [attr.aria-label]="message.citations.length + ' answer sources'"
                        (click)="citationSelected.emit({ messageId: message.id, index: 0 })"
                      >
                        {{ message.citations.length }} {{ message.citations.length === 1 ? 'source' : 'sources' }}
                      </button>
                    }
                  </div>
                }
              </div>
            </article>
          }
        }
      </div>
    </div>
    @if (!followingLatest() && isStreaming()) {
      <button type="button" class="jump-latest" (click)="jumpToLatest()">Jump to latest</button>
    }
  `,
  styleUrl: './message-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MessageListComponent {
  private readonly toast = inject(ToastService);
  readonly messages = input<readonly ChatMessageView[]>([]);
  readonly isStreaming = input(false);
  readonly citationSelected = output<CitationSelection>();
  readonly retry = output<void>();
  protected readonly followingLatest = signal(true);
  protected readonly copiedMessageId = signal<string | null>(null);
  protected readonly latestAssistantId = computed(() =>
    [...this.messages()].reverse().find((message) => message.role === 'Assistant')?.id ?? null,
  );

  private readonly scrollRegion = viewChild<ElementRef<HTMLDivElement>>('scrollRegion');

  constructor() {
    afterRenderEffect(() => {
      this.messages();
      this.isStreaming();
      if (this.followingLatest()) {
        this.scrollToLatest();
      }
    });
  }

  protected onScroll(): void {
    const element = this.scrollRegion()?.nativeElement;
    if (element) {
      this.followingLatest.set(element.scrollHeight - element.scrollTop - element.clientHeight < 100);
    }
  }

  protected jumpToLatest(): void {
    this.followingLatest.set(true);
    this.scrollToLatest();
  }

  protected markdownContent(content: string): string {
    return content.replace(/(?<!\!)\[(\d+)\](?!\()/g, '[$1](#citation-$1)');
  }

  protected handleMarkdownClick(event: MouseEvent, message: ChatMessageView): void {
    const target = event.target;
    if (!(target instanceof Element)) {
      return;
    }
    const link = target.closest('a[href^="#citation-"]');
    const match = link?.getAttribute('href')?.match(/^#citation-(\d+)$/);
    if (match) {
      event.preventDefault();
      this.citationSelected.emit({ messageId: message.id, index: Number(match[1]) - 1 });
    }
  }

  protected async copy(message: ChatMessageView): Promise<void> {
    try {
      await navigator.clipboard.writeText(message.content);
      this.copiedMessageId.set(message.id);
      window.setTimeout(() => this.copiedMessageId.set(null), 1600);
    } catch (error: unknown) {
      this.copiedMessageId.set(null);
      this.toast.show(
        error instanceof Error ? error.message : 'Could not copy the answer to your clipboard.',
        'error',
      );
    }
  }

  private scrollToLatest(): void {
    const element = this.scrollRegion()?.nativeElement;
    if (element) {
      element.scrollTop = element.scrollHeight;
    }
  }
}
