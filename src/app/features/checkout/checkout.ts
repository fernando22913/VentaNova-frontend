import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { OrdersService } from '../../core/services/orders.service';
import { ToastService } from '../../core/services/toast.service';
import { CartStore } from '../../core/stores/cart.store';
import type { CardDetails, GrantedEntitlement } from '../../core/models/order.model';
import { MoneyPipe } from '../../shared/money.pipe';
import { StatePanelComponent } from '../../shared/state-panel/state-panel';

@Component({
  selector: 'app-checkout',
  templateUrl: './checkout.html',
  imports: [FormsModule, MoneyPipe, RouterLink, StatePanelComponent],
})
export class CheckoutComponent {
  private readonly orders = inject(OrdersService);
  private readonly cart = inject(CartStore);
  private readonly toasts = inject(ToastService);
  private readonly router = inject(Router);

  protected readonly items = this.cart.items;
  protected readonly subtotalCents = this.cart.subtotalCents;
  protected readonly isEmpty = this.cart.isEmpty;

  protected card: CardDetails = { cardName: '', cardNumber: '', expiry: '', cvc: '' };
  protected submitted = false;
  protected loading = false;
  protected error: string | null = null;

  protected readonly granted = signal<GrantedEntitlement[] | null>(null);
  protected readonly declined = signal(false);

  protected onSubmit(): void {
    this.submitted = true;
    this.declined.set(false);
    if (this.isEmpty() || !this.cardDetailsValid()) return;

    this.loading = true;
    this.error = null;

    this.orders.createOrder(this.cart.toOrderItems()).subscribe({
      next: (order) => this.pay(order.id),
      error: (error: unknown) => this.failWith(error),
    });
  }

  protected resetError(): void {
    this.error = null;
  }

  protected async copyKey(key: string): Promise<void> {
    try {
      await navigator.clipboard.writeText(key);
      this.toasts.show('Licencia copiada al portapapeles', 'success');
    } catch {
      this.toasts.show('No se pudo copiar la licencia', 'error');
    }
  }

  protected goToCatalog(): void {
    void this.router.navigateByUrl('/');
  }

  private pay(orderId: string): void {
    this.orders.payOrder(orderId, { ...this.card }).subscribe({
      next: (result) => {
        this.loading = false;
        if (result.order.status === 'PAID') {
          this.cart.clear();
          this.granted.set(result.entitlements);
          this.toasts.show('Pago aprobado. ¡Disfruta tu compra!', 'success');
        } else {
          this.declined.set(true);
        }
      },
      error: (error: unknown) => this.failWith(error),
    });
  }

  private failWith(error: unknown): void {
    this.loading = false;
    this.error = messageFrom(error);
  }

  private cardDetailsValid(): boolean {
    return Boolean(
      this.card.cardName.trim() &&
      this.card.cardNumber.trim() &&
      this.card.expiry.trim() &&
      this.card.cvc.trim(),
    );
  }
}

function messageFrom(error: unknown): string {
  if (error instanceof HttpErrorResponse) {
    const body = error.error as { error?: { message?: string } } | null;
    return body?.error?.message ?? `No se pudo procesar el pago (error ${error.status}).`;
  }
  return 'No se pudo procesar el pago.';
}
