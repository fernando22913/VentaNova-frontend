import { Injectable, computed, signal } from '@angular/core';

import type { CartItem } from '../models/order.model';

const STORAGE_KEY = 'bytemarket.cart';

/**
 * Client-side cart (blueprint ADR-06): the cart is UI state, persisted across
 * reloads in localStorage. The server is never involved until checkout, where
 * it recomputes every price. `subtotalCents`/`count` are computed signals.
 */
@Injectable({ providedIn: 'root' })
export class CartStore {
  private readonly itemsSignal = signal<CartItem[]>([]);

  readonly items = this.itemsSignal.asReadonly();
  readonly count = computed(() =>
    this.itemsSignal().reduce((total, item) => total + item.quantity, 0),
  );
  readonly subtotalCents = computed(() =>
    this.itemsSignal().reduce((total, item) => total + item.priceCents * item.quantity, 0),
  );
  readonly isEmpty = computed(() => this.itemsSignal().length === 0);

  constructor() {
    this.restore();
  }

  add(item: Omit<CartItem, 'quantity'>): void {
    const existing = this.itemsSignal().find((line) => line.productId === item.productId);
    if (existing) {
      this.setQuantity(item.productId, existing.quantity + 1);
      return;
    }
    this.itemsSignal.update((lines) => [...lines, { ...item, quantity: 1 }]);
    this.persist();
  }

  setQuantity(productId: string, quantity: number): void {
    const safeQuantity = Math.max(1, Math.min(99, Math.trunc(quantity)));
    this.itemsSignal.update((lines) =>
      lines.map((line) =>
        line.productId === productId ? { ...line, quantity: safeQuantity } : line,
      ),
    );
    this.persist();
  }

  remove(productId: string): void {
    this.itemsSignal.update((lines) => lines.filter((line) => line.productId !== productId));
    this.persist();
  }

  clear(): void {
    this.itemsSignal.set([]);
    this.persist();
  }

  /** Payload for POST /orders — ids + quantities only; the server prices it. */
  toOrderItems(): { productId: string; quantity: number }[] {
    return this.itemsSignal().map((line) => ({
      productId: line.productId,
      quantity: line.quantity,
    }));
  }

  private persist(): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.itemsSignal()));
  }

  private restore(): void {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      this.itemsSignal.set(JSON.parse(raw) as CartItem[]);
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    }
  }
}
