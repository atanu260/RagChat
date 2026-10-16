import { NgComponentOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { LucideFileSearchCorner, type LucideIcon } from '@lucide/angular';

@Component({
  selector: 'app-empty-state',
  imports: [NgComponentOutlet],
  template: `
    <div class="empty-state">
      <div class="empty-state__icon" aria-hidden="true">
        <ng-container
          [ngComponentOutlet]="icon()"
          [ngComponentOutletInputs]="iconInputs"
        />
      </div>
      <h2 class="empty-state__title">{{ title() }}</h2>
      @if (description()) {
        <p class="empty-state__description">{{ description() }}</p>
      }
      <div class="empty-state__action">
        <ng-content select="[empty-state-action]" />
      </div>
    </div>
  `,
  styleUrl: './empty-state.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmptyStateComponent {
  readonly icon = input<LucideIcon>(LucideFileSearchCorner);
  readonly title = input.required<string>();
  readonly description = input('');
  readonly iconInputs: Record<string, unknown> = { size: 28 };
}
