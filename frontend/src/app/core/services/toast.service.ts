import { Injectable, signal } from '@angular/core';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastMessage {
  readonly id: number;
  readonly message: string;
  readonly type: ToastType;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private nextId = 0;
  private readonly timers = new Map<number, ReturnType<typeof setTimeout>>();

  readonly toasts = signal<readonly ToastMessage[]>([]);

  show(message: string, type: ToastType = 'info'): number {
    const id = ++this.nextId;
    this.toasts.update((toasts) => [...toasts, { id, message, type }]);
    this.timers.set(id, setTimeout(() => this.dismiss(id), 5000));
    return id;
  }

  dismiss(id: number): void {
    const timer = this.timers.get(id);
    if (timer !== undefined) {
      clearTimeout(timer);
      this.timers.delete(id);
    }
    this.toasts.update((toasts) => toasts.filter((toast) => toast.id !== id));
  }
}
