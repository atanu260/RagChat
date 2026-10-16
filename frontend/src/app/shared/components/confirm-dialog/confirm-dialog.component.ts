import { DialogRef, DIALOG_DATA } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ButtonComponent } from '../button/button.component';

export interface ConfirmDialogData {
  readonly title: string;
  readonly description: string;
  readonly confirmLabel?: string;
  readonly cancelLabel?: string;
  readonly destructive?: boolean;
}

@Component({
  selector: 'app-confirm-dialog',
  imports: [ButtonComponent],
  template: `
    <section class="confirm-dialog">
      <header class="confirm-dialog__header">
        <h2 class="confirm-dialog__title">{{ data.title }}</h2>
      </header>
      <p class="confirm-dialog__description">{{ data.description }}</p>
      <footer class="confirm-dialog__actions">
        <app-button variant="secondary" (click)="close(false)">
          {{ data.cancelLabel ?? 'Cancel' }}
        </app-button>
        <app-button
          [variant]="data.destructive ? 'danger' : 'primary'"
          (click)="close(true)"
        >
          {{ data.confirmLabel ?? 'Confirm' }}
        </app-button>
      </footer>
    </section>
  `,
  styleUrl: './confirm-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfirmDialogComponent {
  protected readonly data = inject<ConfirmDialogData>(DIALOG_DATA);
  private readonly dialogRef = inject<DialogRef<boolean>>(DialogRef);

  protected close(confirmed: boolean): void {
    this.dialogRef.close(confirmed);
  }
}
