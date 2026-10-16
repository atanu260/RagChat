import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-toast-container',
  template: `
    <div class="toast-stack" aria-label="Notifications" aria-live="polite" aria-relevant="additions removals">
      @for (toast of toastService.toasts(); track toast.id) {
        <div
          class="toast"
          [class.toast--success]="toast.type === 'success'"
          [class.toast--error]="toast.type === 'error'"
          [class.toast--info]="toast.type === 'info'"
          role="status"
        >
          <span class="toast__message">{{ toast.message }}</span>
          <button
            class="toast__dismiss"
            type="button"
            aria-label="Dismiss notification"
            (click)="dismiss(toast.id)"
          >
            <span aria-hidden="true">&times;</span>
          </button>
        </div>
      }
    </div>
  `,
  styleUrl: './toast-container.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ToastContainerComponent {
  protected readonly toastService = inject(ToastService);

  protected dismiss(id: number): void {
    this.toastService.dismiss(id);
  }
}
