import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LucideArrowLeft, LucideSearchX } from '@lucide/angular';

@Component({
  selector: 'app-not-found-page',
  imports: [LucideArrowLeft, LucideSearchX, RouterLink],
  template: `
    <main class="not-found">
      <div class="not-found__icon" aria-hidden="true"><svg lucideSearchX [size]="28"></svg></div>
      <p class="not-found__code">404 · Page not found</p>
      <h1>We can’t find that page</h1>
      <p class="not-found__description">The link may be outdated, or the page may have moved.</p>
      <a class="not-found__link" routerLink="/">
        <svg lucideArrowLeft [size]="17"></svg>
        Back to RagChat
      </a>
    </main>
  `,
  styleUrl: './not-found-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotFoundPageComponent {}
