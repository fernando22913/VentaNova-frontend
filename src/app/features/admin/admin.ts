import { Component, signal } from '@angular/core';

import { CatalogManagerComponent } from './catalog-manager/catalog-manager';
import { OrdersTableComponent } from './orders-table/orders-table';
import { WorkersManagerComponent } from './workers-manager/workers-manager';

type AdminTab = 'catalog' | 'orders' | 'team';

@Component({
  selector: 'app-admin-panel',
  templateUrl: './admin.html',
  imports: [CatalogManagerComponent, OrdersTableComponent, WorkersManagerComponent],
})
export class AdminPanelComponent {
  protected readonly tab = signal<AdminTab>('catalog');

  protected select(tab: AdminTab): void {
    this.tab.set(tab);
  }
}
