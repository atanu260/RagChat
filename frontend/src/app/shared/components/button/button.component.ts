import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { SpinnerComponent } from '../spinner/spinner.component';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';
export type ButtonType = 'button' | 'submit' | 'reset';

@Component({
  selector: 'app-button',
  imports: [SpinnerComponent],
  template: `
    <button
      class="button"
      [class.button--primary]="variant() === 'primary'"
      [class.button--secondary]="variant() === 'secondary'"
      [class.button--ghost]="variant() === 'ghost'"
      [class.button--danger]="variant() === 'danger'"
      [class.button--sm]="size() === 'sm'"
      [class.button--md]="size() === 'md'"
      [class.button--lg]="size() === 'lg'"
      [type]="type()"
      [disabled]="disabled() || loading()"
      [attr.aria-busy]="loading()"
    >
      @if (loading()) {
        <app-spinner size="sm" label="Loading" />
      }
      <ng-content />
    </button>
  `,
  styleUrl: './button.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ButtonComponent {
  readonly variant = input<ButtonVariant>('primary');
  readonly size = input<ButtonSize>('md');
  readonly type = input<ButtonType>('button');
  readonly loading = input(false);
  readonly disabled = input(false);
}
