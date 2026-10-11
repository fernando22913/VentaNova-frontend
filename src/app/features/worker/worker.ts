import { Component, signal } from '@angular/core';

import { CatalogManagerComponent } from '../admin/catalog-manager/catalog-manager';
import { OrdersTableComponent } from '../admin/orders-table/orders-table';
import { ContactsInboxComponent } from './contacts-inbox/contacts-inbox';

type WorkerTab = 'contacts' | 'catalog' | 'orders';

@Component({
  selector: 'app-worker-panel',
  templateUrl: './worker.html',
  imports: [ContactsInboxComponent, CatalogManagerComponent, OrdersTableComponent],
})
export class WorkerPanelComponent {
  protected readonly tab = signal<WorkerTab>('contacts');

  protected select(tab: WorkerTab): void {
    this.tab.set(tab);
  }
}
