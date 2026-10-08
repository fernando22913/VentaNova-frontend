import { Component, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Router } from '@angular/router';

import { OrdersService } from '../../core/services/orders.service';
import { ToastService } from '../../core/services/toast.service';
import type { LibraryItem } from '../../core/models/order.model';
import { PRODUCT_PLATFORM_LABELS, PRODUCT_TYPE_LABELS } from '../../core/models/catalog.model';
import { StatePanelComponent } from '../../shared/state-panel/state-panel';

@Component({
  selector: 'app-library',
  templateUrl: './library.html',
  imports: [DatePipe, StatePanelComponent],
})
export class LibraryComponent {
  private readonly orders = inject(OrdersService);
  private readonly toasts = inject(ToastService);
  private readonly router = inject(Router);

  protected readonly items = signal<LibraryItem[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  private readonly revealed = signal<Set<string>>(new Set());

  protected readonly platformLabels = PRODUCT_PLATFORM_LABELS;
  protected readonly typeLabels = PRODUCT_TYPE_LABELS;

  protected goToCatalog(): void {
    void this.router.navigateByUrl('/');
  }

  constructor() {
    this.load();
  }

  protected load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.orders.getLibrary().subscribe({
      next: (items) => {
        this.items.set(items);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('No se pudo cargar tu biblioteca.');
        this.loading.set(false);
      },
    });
  }

  protected isRevealed(entitlementId: string): boolean {
    return this.revealed().has(entitlementId);
  }

  protected toggleKey(entitlementId: string): void {
    this.revealed.update((current) => {
      const next = new Set(current);
      if (next.has(entitlementId)) next.delete(entitlementId);
      else next.add(entitlementId);
      return next;
    });
  }

  protected async copyKey(key: string): Promise<void> {
    try {
      await navigator.clipboard.writeText(key);
      this.toasts.show('Licencia copiada al portapapeles', 'success');
    } catch {
      this.toasts.show('No se pudo copiar la licencia', 'error');
    }
  }
}
