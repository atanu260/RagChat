import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LucideMessageSquareText, LucidePlus, LucideRefreshCw } from '@lucide/angular';
import { ChatSessionDto } from '../../core/models/chat.models';

interface SessionGroup {
  readonly label: string;
  readonly sessions: readonly ChatSessionDto[];
}

@Component({
  selector: 'app-session-sidebar',
  imports: [LucideMessageSquareText, LucidePlus, LucideRefreshCw, RouterLink],
  template: `
    <aside class="session-sidebar" aria-label="Chat history">
      <header class="session-sidebar__header">
        <h2>Chats</h2>
        <button type="button" class="new-chat" (click)="newChat.emit()">
          <svg lucidePlus [size]="16"></svg>
          <span>New chat</span>
        </button>
      </header>

      @if (loading()) {
        <div class="session-skeletons" aria-label="Loading chats" aria-busy="true">
          @for (item of skeletonItems; track item) {
            <div class="session-skeleton"><span></span><span></span></div>
          }
        </div>
      } @else if (loadError()) {
        <div class="sessions-error" role="alert">
          <p>Chat history couldn’t be loaded.</p>
          <button type="button" (click)="retry.emit()">
            <svg lucideRefreshCw [size]="13"></svg>
            Try again
          </button>
        </div>
      } @else if (groups().length === 0) {
        <div class="sessions-empty">
          <svg lucideMessageSquareText [size]="18"></svg>
          <p>Your conversations will appear here.</p>
        </div>
      } @else {
        <nav class="session-groups" aria-label="Recent conversations">
          @for (group of groups(); track group.label) {
            <section class="session-group" [attr.aria-label]="group.label">
              <h3>{{ group.label }}</h3>
              @for (session of group.sessions; track session.id) {
                <a
                  class="session-link"
                  [class.session-link--active]="session.id === activeSessionId()"
                  [routerLink]="['/chat', session.id]"
                  [attr.aria-current]="session.id === activeSessionId() ? 'page' : null"
                  (click)="sessionSelected.emit(session.id)"
                >
                  <svg lucideMessageSquareText [size]="15"></svg>
                  <span>{{ session.title }}</span>
                </a>
              }
            </section>
          }
        </nav>
      }
    </aside>
  `,
  styleUrl: './session-sidebar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SessionSidebarComponent {
  readonly sessions = input<readonly ChatSessionDto[]>([]);
  readonly activeSessionId = input<string | null>(null);
  readonly loading = input(false);
  readonly loadError = input(false);
  readonly newChat = output<void>();
  readonly retry = output<void>();
  readonly sessionSelected = output<string>();

  protected readonly skeletonItems = [1, 2, 3, 4, 5, 6];
  protected readonly groups = computed(() => groupSessions(this.sessions()));
}

function groupSessions(sessions: readonly ChatSessionDto[]): readonly SessionGroup[] {
  const grouped = new Map<string, ChatSessionDto[]>();
  for (const session of sessions) {
    const label = ageGroup(session.updatedAt ?? session.createdAt);
    const items = grouped.get(label) ?? [];
    items.push(session);
    grouped.set(label, items);
  }
  return ['Today', 'Yesterday', 'Previous 7 days', 'Older']
    .flatMap((label) => {
      const items = grouped.get(label);
      return items ? [{ label, sessions: items }] : [];
    });
}

function ageGroup(timestamp: string): string {
  const date = new Date(timestamp);
  const today = new Date();
  const dateDay = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  const todayDay = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
  const daysAgo = Math.floor((todayDay - dateDay) / 86_400_000);
  if (daysAgo <= 0) {
    return 'Today';
  }
  if (daysAgo === 1) {
    return 'Yesterday';
  }
  return daysAgo <= 7 ? 'Previous 7 days' : 'Older';
}
