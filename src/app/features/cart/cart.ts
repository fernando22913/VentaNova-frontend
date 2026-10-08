import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

import { CartStore } from '../../core/stores/cart.store';
import { MoneyPipe } from '../../shared/money.pipe';
import { StatePanelComponent } from '../../shared/state-panel/state-panel';

@Component({
  selector: 'app-cart',
  templateUrl: './cart.html',
  imports: [MoneyPipe, RouterLink, StatePanelComponent],
})
export class CartComponent {
  private readonly cart = inject(CartStore);
  private readonly router = inject(Router);

  protected readonly items = this.cart.items;
  protected readonly subtotalCents = this.cart.subtotalCents;
  protected readonly isEmpty = this.cart.isEmpty;

  protected goToCatalog(): void {
    void this.router.navigateByUrl('/');
  }

  protected setQuantity(productId: string, event: Event): void {
    this.cart.setQuantity(productId, Number((event.target as HTMLInputElement).value));
  }

  protected increment(productId: string): void {
    const current = this.items().find((item) => item.productId === productId)?.quantity ?? 1;
    this.cart.setQuantity(productId, current + 1);
  }

  protected decrement(productId: string): void {
    const current = this.items().find((item) => item.productId === productId)?.quantity ?? 1;
    this.cart.setQuantity(productId, current - 1);
  }

  protected remove(productId: string): void {
    this.cart.remove(productId);
  }

  protected clear(): void {
    this.cart.clear();
  }
}
