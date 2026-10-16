import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet, NavigationEnd } from '@angular/router';
import { CdkTrapFocus } from '@angular/cdk/a11y';
import { CdkMenu, CdkMenuItem, CdkMenuTrigger } from '@angular/cdk/menu';
import {
  LucideFiles,
  LucideLogOut,
  LucideMenu,
  LucideMessageSquareText,
  LucideMoon,
  LucidePanelLeftClose,
  LucidePanelLeftOpen,
  LucideSun,
  LucideX,
} from '@lucide/angular';
import { filter, map } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';
import { AvatarComponent } from '../../shared/components/avatar/avatar.component';
import { AuthService } from '../../core/services/auth.service';
import { ThemeService } from '../../core/services/theme.service';

@Component({
  selector: 'app-shell',
  imports: [
    AvatarComponent,
    CdkMenu,
    CdkMenuItem,
    CdkMenuTrigger,
    CdkTrapFocus,
    LucideFiles,
    LucideLogOut,
    LucideMenu,
    LucideMessageSquareText,
    LucideMoon,
    LucidePanelLeftClose,
    LucidePanelLeftOpen,
    LucideSun,
    LucideX,
    RouterLink,
    RouterLinkActive,
    RouterOutlet,
  ],
  templateUrl: './shell.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShellComponent {
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);
  protected readonly theme = inject(ThemeService);

  protected readonly collapsed = signal(false);
  protected readonly drawerOpen = signal(false);
  protected readonly user = this.auth.user;
  protected readonly userInitials = computed(() => {
    const name = this.user()?.displayName ?? '';
    const parts = name.trim().split(/\s+/).filter(Boolean);
    return parts.slice(0, 2).map((part) => part[0]?.toUpperCase() ?? '').join('');
  });
  protected readonly pageTitle = toSignal(
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      map((event) => this.titleForUrl(event.urlAfterRedirects)),
    ),
    { initialValue: this.titleForUrl(this.router.url) },
  );

  protected toggleSidebar(): void {
    this.collapsed.update((collapsed) => !collapsed);
  }

  protected openDrawer(): void {
    this.drawerOpen.set(true);
  }

  protected closeDrawer(): void {
    this.drawerOpen.set(false);
  }

  protected toggleTheme(): void {
    this.theme.toggleTheme();
  }

  protected logout(): void {
    this.auth.logout();
    void this.router.navigateByUrl('/login');
  }

  private titleForUrl(url: string): string {
    if (url.startsWith('/documents')) {
      return 'Documents';
    }
    if (url.startsWith('/chat')) {
      return 'Chat';
    }
    return 'RagChat';
  }
}
