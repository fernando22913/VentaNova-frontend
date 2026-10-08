import { Injectable, signal } from '@angular/core';

export type ToastType = 'error' | 'success' | 'info';

export interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

/**
 * Tiny signals-based toast queue. The error interceptor pushes HTTP failures;
 * forms can push success messages. Auto-dismissed after a few seconds.
 */
@Injectable({ providedIn: 'root' })
export class ToastService {
  private readonly toastsSignal = signal<Toast[]>([]);
  private sequence = 0;

  readonly toasts = this.toastsSignal.asReadonly();

  show(message: string, type: ToastType = 'info'): void {
    const toast: Toast = { id: ++this.sequence, message, type };
    this.toastsSignal.update((list) => [...list, toast]);
    setTimeout(() => {
      this.toastsSignal.update((list) => list.filter((item) => item.id !== toast.id));
    }, 4500);
  }

  dismiss(id: number): void {
    this.toastsSignal.update((list) => list.filter((item) => item.id !== id));
  }
}
