import { TestBed } from '@angular/core/testing';

import type { PublicProduct } from '../models/catalog.model';
import { toCartItem } from '../models/order.model';
import { CartStore } from './cart.store';

const product = (id: string, priceCents: number): PublicProduct => ({
  id,
  slug: `product-${id}`,
  title: `Product ${id}`,
  summary: 'Summary.',
  type: 'GAME',
  platform: 'CROSS',
  categoryId: 'c-1',
  priceCents,
  coverImageUrl: null,
  createdAt: '2026-10-06T00:00:00.000Z',
  updatedAt: '2026-10-06T00:00:00.000Z',
});

const STORAGE_KEY = 'bytemarket.cart';

describe('CartStore', () => {
  let store: CartStore;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
    store = TestBed.inject(CartStore);
  });

  it('adds a product and increments quantity for a repeated add', () => {
    store.add(toCartItem(product('p-1', 1999)));
    store.add(toCartItem(product('p-1', 1999)));

    expect(store.items()).toHaveLength(1);
    expect(store.items()[0]?.quantity).toBe(2);
    expect(store.count()).toBe(2);
  });

  it('computes the subtotal from unit prices × quantities', () => {
    store.add(toCartItem(product('p-1', 1999)));
    store.add(toCartItem(product('p-2', 500)));
    store.setQuantity('p-2', 3);

    // 1999 + 500×3 = 3499
    expect(store.subtotalCents()).toBe(3499);
    expect(store.count()).toBe(4);
  });

  it('clamps quantity to 1..99 and removes lines', () => {
    store.add(toCartItem(product('p-1', 100)));
    store.setQuantity('p-1', 0);
    expect(store.items()[0]?.quantity).toBe(1);
    store.setQuantity('p-1', 500);
    expect(store.items()[0]?.quantity).toBe(99);

    store.remove('p-1');
    expect(store.isEmpty()).toBe(true);
  });

  it('clears the cart', () => {
    store.add(toCartItem(product('p-1', 100)));
    store.clear();
    expect(store.isEmpty()).toBe(true);
    expect(store.subtotalCents()).toBe(0);
  });

  it('persists to localStorage and restores on a new store instance', () => {
    store.add(toCartItem(product('p-1', 1999)));
    store.setQuantity('p-1', 2);
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]')).toHaveLength(1);

    const restored = new CartStore();
    expect(restored.items()).toHaveLength(1);
    expect(restored.items()[0]?.quantity).toBe(2);
  });

  it('produces the server payload with ids + quantities only', () => {
    store.add(toCartItem(product('p-1', 1999)));
    store.setQuantity('p-1', 2);
    expect(store.toOrderItems()).toEqual([{ productId: 'p-1', quantity: 2 }]);
  });
});
