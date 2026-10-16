import { DOCUMENT } from '@angular/common';
import { computed, DestroyRef, effect, inject, Injectable, signal } from '@angular/core';

export type ThemeMode = 'light' | 'dark' | 'system';

const THEME_STORAGE_KEY = 'ragchat-theme';
const DARK_MODE_QUERY = '(prefers-color-scheme: dark)';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly document = inject(DOCUMENT);
  private readonly destroyRef = inject(DestroyRef);
  private readonly systemPrefersDark = signal(this.getSystemPreference());

  readonly theme = signal<ThemeMode>(this.getStoredTheme());
  readonly isDark = computed(
    () => this.theme() === 'dark' || (this.theme() === 'system' && this.systemPrefersDark()),
  );

  constructor() {
    const colorScheme = this.document.defaultView?.matchMedia(DARK_MODE_QUERY);
    const onColorSchemeChange = (event: MediaQueryListEvent): void => this.systemPrefersDark.set(event.matches);
    colorScheme?.addEventListener('change', onColorSchemeChange);
    this.destroyRef.onDestroy(() => colorScheme?.removeEventListener('change', onColorSchemeChange));

    effect(() => {
      this.document.documentElement.classList.toggle('dark', this.isDark());
      this.document.querySelector('meta[name="theme-color"]')
        ?.setAttribute('content', this.isDark() ? '#0b0f19' : '#f8fafc');
      this.document.defaultView?.localStorage.setItem(THEME_STORAGE_KEY, this.theme());
    });
  }

  setTheme(theme: ThemeMode): void {
    this.theme.set(theme);
  }

  toggleTheme(): void {
    this.theme.set(this.isDark() ? 'light' : 'dark');
  }

  private getSystemPreference(): boolean {
    return this.document.defaultView?.matchMedia(DARK_MODE_QUERY).matches ?? false;
  }

  private getStoredTheme(): ThemeMode {
    const storedTheme = this.document.defaultView?.localStorage.getItem(THEME_STORAGE_KEY);
    return storedTheme === 'light' || storedTheme === 'dark' || storedTheme === 'system'
      ? storedTheme
      : 'system';
  }
}
