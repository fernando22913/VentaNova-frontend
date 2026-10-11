import { DatePipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';

import { AdminService } from '../../../core/services/admin.service';
import type { AdminOrder } from '../../../core/models/order.model';
import { ORDER_STATUS_LABELS, orderStatusClass } from '../../../core/models/order.model';
import { MoneyPipe } from '../../../shared/money.pipe';

/** Read-only sales table shared by the ADMIN and WORKER panels. */
@Component({
  selector: 'app-orders-table',
  templateUrl: './orders-table.html',
  imports: [DatePipe, MoneyPipe],
})
export class OrdersTableComponent {
  private readonly admin = inject(AdminService);

  protected readonly orders = signal<AdminOrder[]>([]);
  protected readonly loading = signal(true);

  protected readonly statusLabels = ORDER_STATUS_LABELS;
  protected readonly statusClass = orderStatusClass;

  constructor() {
    this.load();
  }

  protected load(): void {
    this.loading.set(true);
    this.admin.listAllOrders().subscribe({
      next: (orders) => {
        this.orders.set(orders);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }
}
