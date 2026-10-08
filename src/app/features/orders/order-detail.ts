import { Component, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { OrdersService } from '../../core/services/orders.service';
import type { PublicOrder } from '../../core/models/order.model';
import { ORDER_STATUS_LABELS, orderStatusClass } from '../../core/models/order.model';
import { MoneyPipe } from '../../shared/money.pipe';
import { StatePanelComponent } from '../../shared/state-panel/state-panel';

@Component({
  selector: 'app-order-detail',
  templateUrl: './order-detail.html',
  imports: [DatePipe, MoneyPipe, RouterLink, StatePanelComponent],
})
export class OrderDetailComponent {
  private readonly orders = inject(OrdersService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  protected readonly order = signal<PublicOrder | null>(null);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);

  protected readonly statusLabels = ORDER_STATUS_LABELS;
  protected readonly statusClass = orderStatusClass;

  protected goToList(): void {
    void this.router.navigateByUrl('/orders');
  }

  constructor() {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.error.set('Pedido no encontrado.');
      this.loading.set(false);
      return;
    }
    this.orders.getOrder(id).subscribe({
      next: (order) => {
        this.order.set(order);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('No se encontró el pedido.');
        this.loading.set(false);
      },
    });
  }

  protected unitTotal(unitPriceCents: number, quantity: number): number {
    return unitPriceCents * quantity;
  }
}
