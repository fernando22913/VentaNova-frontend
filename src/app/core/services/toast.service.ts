import { Injectable, signal } from '@angular/core';

export type ToastType = 'error' | 'success' | 'info';

export interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

// Cola de toasts pequeña basada en signals; el interceptor de errores añade fallos HTTP y los formularios mensajes de éxito; se cierran solos.
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
