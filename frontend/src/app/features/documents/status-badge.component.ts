import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { DocumentStatus } from '../../core/models/document.models';

@Component({
  selector: 'app-document-status',
  template: `
    <span
      class="status"
      [class.status--uploaded]="status() === 'Uploaded'"
      [class.status--processing]="status() === 'Processing'"
      [class.status--ready]="status() === 'Ready'"
      [class.status--failed]="status() === 'Failed'"
      [attr.title]="status() === 'Failed' ? errorMessage() : null"
      [attr.aria-label]="status() === 'Failed' && errorMessage() ? status() + ': ' + errorMessage() : status()"
    >
      @if (status() === 'Processing') {
        <span class="status__dot" aria-hidden="true"></span>
      }
      {{ status() }}
    </span>
  `,
  styleUrl: './status-badge.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StatusBadgeComponent {
  readonly status = input.required<DocumentStatus>();
  readonly errorMessage = input<string | null>(null);
}
