import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export type BadgeStatus = 'success' | 'warning' | 'error' | 'info' | 'neutral';

@Component({
  selector: 'app-badge',
  template: `
    <span
      class="badge"
      [class.badge--success]="status() === 'success'"
      [class.badge--warning]="status() === 'warning'"
      [class.badge--error]="status() === 'error'"
      [class.badge--info]="status() === 'info'"
      [class.badge--neutral]="status() === 'neutral'"
    >
      <ng-content />
    </span>
  `,
  styleUrl: './badge.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BadgeComponent {
  readonly status = input<BadgeStatus>('neutral');
}
