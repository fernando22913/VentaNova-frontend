import { Component, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Router, RouterLink } from '@angular/router';

import { OrdersService } from '../../core/services/orders.service';
import type { PublicOrder } from '../../core/models/order.model';
import { ORDER_STATUS_LABELS, orderStatusClass } from '../../core/models/order.model';
import { MoneyPipe } from '../../shared/money.pipe';
import { StatePanelComponent } from '../../shared/state-panel/state-panel';

@Component({
  selector: 'app-orders',
  templateUrl: './orders.html',
  imports: [DatePipe, MoneyPipe, RouterLink, StatePanelComponent],
})
export class OrdersComponent {
  private readonly orders = inject(OrdersService);
  private readonly router = inject(Router);

  protected readonly orderList = signal<PublicOrder[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);

  protected readonly statusLabels = ORDER_STATUS_LABELS;
  protected readonly statusClass = orderStatusClass;

  protected goToCatalog(): void {
    void this.router.navigateByUrl('/');
  }

  constructor() {
    this.load();
  }

  protected load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.orders.listOrders().subscribe({
      next: (orders) => {
        this.orderList.set(orders);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('No se pudieron cargar tus pedidos.');
        this.loading.set(false);
      },
    });
  }
}
