import { ChangeDetectionStrategy, Component, computed, DestroyRef, effect, inject, signal, untracked } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { LucideBookOpen, LucideChevronLeft, LucideMessageSquare, LucidePanelLeft, LucideRefreshCw } from '@lucide/angular';
import { ChatStore } from './state/chat-store.service';
import { CitationPanelComponent } from './citation-panel.component';
import { CitationSelection, ChatSendRequest } from './chat-page.models';
import { MessageInputComponent } from './message-input.component';
import { MessageListComponent } from './message-list.component';
import { SessionSidebarComponent } from './session-sidebar.component';

@Component({
  selector: 'app-chat-page',
  imports: [
    CitationPanelComponent,
    LucideBookOpen,
    LucideChevronLeft,
    LucideMessageSquare,
    LucidePanelLeft,
    LucideRefreshCw,
    MessageInputComponent,
    MessageListComponent,
    RouterLink,
    SessionSidebarComponent,
  ],
  template: `
    <section class="chat-workspace" [class.chat-workspace--citations]="citationPanelOpen()">
      @if (mobileSidebarOpen() || (citationPanelOpen() && isMobile())) {
        <button class="drawer-backdrop" type="button" aria-label="Close side panel" (click)="closeDrawers()"></button>
      }

      <div class="sessions-drawer" [class.sessions-drawer--open]="mobileSidebarOpen()">
        <app-session-sidebar
          [sessions]="store.sessions()"
          [activeSessionId]="store.activeSessionId()"
          [loading]="store.loadingSessions()"
          [loadError]="store.sessionsError()"
          (newChat)="startNewChat()"
          (retry)="store.loadSessions()"
          (sessionSelected)="selectSession($event)"
        />
      </div>

      <section class="conversation" aria-label="Conversation">
        <header class="conversation-header">
          <div class="conversation-header__leading">
            <button
              class="header-icon"
              type="button"
              aria-label="Open chat history"
              (click)="mobileSidebarOpen.set(true)"
            >
              <svg lucidePanelLeft [size]="18"></svg>
            </button>
            <a class="all-chats" routerLink="/chat" (click)="startNewChat()">
              <svg lucideChevronLeft [size]="15"></svg>
              <span>Chats</span>
            </a>
            <span class="header-divider"></span>
            <h1>{{ currentTitle() }}</h1>
          </div>
          <button
            class="sources-toggle"
            type="button"
            [class.sources-toggle--active]="citationPanelOpen()"
            [disabled]="!hasCitations()"
            [attr.aria-expanded]="citationPanelOpen()"
            aria-controls="citation-panel"
            (click)="citationPanelOpen.update((open) => !open)"
          >
            <svg lucideBookOpen [size]="15"></svg>
            <span>Sources</span>
            @if (citationCount() > 0) {
              <span class="source-count">{{ citationCount() }}</span>
            }
          </button>
        </header>

        <div class="conversation-body">
          @if (store.messagesError()) {
            <section class="conversation-error" role="alert">
              <svg lucideRefreshCw [size]="19"></svg>
              <h2>Conversation unavailable</h2>
              <p>We couldn’t load these messages. Check your connection and try again.</p>
              <button type="button" (click)="store.reloadMessages()">Try again</button>
            </section>
          } @else if (store.messages().length === 0 && store.loadingMessages()) {
            <div class="conversation-loading" role="status">Loading conversation…</div>
          } @else if (store.messages().length === 0) {
            <section class="chat-welcome">
              <div class="welcome-icon"><svg lucideMessageSquare [size]="24"></svg></div>
              <p class="welcome-eyebrow">Your documents, in conversation</p>
              <h2>What would you like to know?</h2>
              <p class="welcome-copy">Ask a question and get a clear answer grounded in your documents.</p>
              <div class="prompt-grid">
                @for (prompt of suggestedPrompts; track prompt) {
                  <button type="button" class="suggested-prompt" (click)="sendPrompt(prompt)">
                    <span>{{ prompt }}</span>
                    <span aria-hidden="true">↗</span>
                  </button>
                }
              </div>
            </section>
          } @else {
            <app-message-list
              [messages]="store.messages()"
              [isStreaming]="store.isStreaming()"
              (citationSelected)="selectCitation($event)"
              (retry)="store.retryLast()"
            />
          }
        </div>

        <footer class="composer-area">
          <app-message-input
            [isStreaming]="store.isStreaming()"
            (send)="sendMessage($event)"
            (stop)="store.stopGeneration()"
          />
          <p class="disclaimer">RagChat can make mistakes. Check important details against the cited sources.</p>
        </footer>
      </section>

      @if (citationPanelOpen()) {
        <div id="citation-panel" class="citations-drawer" [class.citations-drawer--open]="isMobile()">
          <app-citation-panel
            [citations]="selectedCitations()"
            [highlightedIndex]="highlightedCitationIndex()"
            (close)="citationPanelOpen.set(false)"
            (citationSelected)="highlightedCitationIndex.set($event)"
          />
        </div>
      }
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChatPageComponent {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly store = inject(ChatStore);
  private readonly routeSessionId = toSignal(
    this.route.paramMap.pipe(map((params) => params.get('sessionId'))),
    { initialValue: this.route.snapshot.paramMap.get('sessionId') },
  );
  protected readonly citationPanelOpen = signal(false);
  protected readonly mobileSidebarOpen = signal(false);
  protected readonly selectedMessageId = signal<string | null>(null);
  protected readonly highlightedCitationIndex = signal<number | null>(null);
  protected readonly isMobile = signal(false);
  protected readonly suggestedPrompts = [
    'Summarize this document',
    'What are the key points?',
    'List important dates and numbers',
    'Explain this in simple terms',
  ];
  protected readonly currentTitle = computed(() =>
    this.store.sessions().find((session) => session.id === this.store.activeSessionId())?.title ?? 'New chat',
  );
  protected readonly selectedCitations = computed(() => {
    const messages = this.store.messages();
    const selected = messages.find((message) => message.id === this.selectedMessageId());
    if (selected?.citations.length) {
      return selected.citations;
    }
    return [...messages].reverse().find((message) => message.role === 'Assistant')?.citations ?? [];
  });
  protected readonly hasCitations = computed(() => this.selectedCitations().length > 0);
  protected readonly citationCount = computed(() => this.selectedCitations().length);

  constructor() {
    this.store.loadSessions();
    effect(() => {
      const sessionId = this.routeSessionId();
      untracked(() => this.store.selectSession(sessionId));
    });
    effect(() => {
      const activeSessionId = this.store.activeSessionId();
      if (activeSessionId && !this.routeSessionId()) {
        void this.router.navigate(['/chat', activeSessionId]);
      }
    });
    const media = globalThis.matchMedia?.('(max-width: 1023px)');
    if (media) {
      this.isMobile.set(media.matches);
      const onChange = (event: MediaQueryListEvent): void => this.isMobile.set(event.matches);
      media.addEventListener('change', onChange);
      this.destroyRef.onDestroy(() => media.removeEventListener('change', onChange));
    }
  }

  protected startNewChat(): void {
    this.store.selectSession(null);
    this.mobileSidebarOpen.set(false);
    this.citationPanelOpen.set(false);
    void this.router.navigateByUrl('/chat');
  }

  protected selectSession(sessionId: string): void {
    this.store.selectSession(sessionId);
    this.mobileSidebarOpen.set(false);
  }

  protected sendPrompt(prompt: string): void {
    this.store.sendMessage(prompt);
  }

  protected sendMessage(request: ChatSendRequest): void {
    this.store.sendMessage(request.question, request.documentIds);
  }

  protected selectCitation(selection: CitationSelection): void {
    this.selectedMessageId.set(selection.messageId);
    this.highlightedCitationIndex.set(selection.index);
    this.citationPanelOpen.set(true);
  }

  protected closeDrawers(): void {
    this.mobileSidebarOpen.set(false);
    this.citationPanelOpen.set(false);
  }
}
