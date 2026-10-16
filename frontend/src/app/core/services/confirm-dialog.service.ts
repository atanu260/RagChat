import { Dialog } from '@angular/cdk/dialog';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ConfirmDialogComponent, ConfirmDialogData } from '../../shared/components/confirm-dialog/confirm-dialog.component';

@Injectable({ providedIn: 'root' })
export class ConfirmDialogService {
  private readonly dialog = inject(Dialog);

  confirm(data: ConfirmDialogData): Observable<boolean | undefined> {
    return this.dialog.open<boolean, ConfirmDialogData>(ConfirmDialogComponent, {
      data,
      role: 'alertdialog',
      ariaLabel: data.title,
      panelClass: 'confirm-dialog-pane',
      maxWidth: 'min(28rem, calc(100vw - 2rem))',
    }).closed;
  }
}
