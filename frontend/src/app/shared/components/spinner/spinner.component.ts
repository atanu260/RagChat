import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export type SpinnerSize = 'sm' | 'md' | 'lg';

@Component({
  selector: 'app-spinner',
  template: `
    <span
      class="spinner"
      [class.spinner--sm]="size() === 'sm'"
      [class.spinner--md]="size() === 'md'"
      [class.spinner--lg]="size() === 'lg'"
      role="status"
      [attr.aria-label]="label()"
    ></span>
  `,
  styleUrl: './spinner.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SpinnerComponent {
  readonly size = input<SpinnerSize>('md');
  readonly label = input('Loading');
}
