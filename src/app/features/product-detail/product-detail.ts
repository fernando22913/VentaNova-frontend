import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { CatalogService } from '../../core/services/catalog.service';
import { ToastService } from '../../core/services/toast.service';
import { CartStore } from '../../core/stores/cart.store';
import type { Category, PublicProductDetail } from '../../core/models/catalog.model';
import { PRODUCT_PLATFORM_LABELS, PRODUCT_TYPE_LABELS } from '../../core/models/catalog.model';
import { toCartItem } from '../../core/models/order.model';
import { MoneyPipe } from '../../shared/money.pipe';
import { StatePanelComponent } from '../../shared/state-panel/state-panel';

@Component({
  selector: 'app-product-detail',
  templateUrl: './product-detail.html',
  imports: [MoneyPipe, RouterLink, StatePanelComponent],
})
export class ProductDetailComponent {
  private readonly catalog = inject(CatalogService);
  private readonly route = inject(ActivatedRoute);
  private readonly cart = inject(CartStore);
  private readonly toasts = inject(ToastService);
  private readonly router = inject(Router);

  protected readonly product = signal<PublicProductDetail | null>(null);
  protected readonly categories = signal<Category[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);

  protected readonly platformLabels = PRODUCT_PLATFORM_LABELS;
  protected readonly typeLabels = PRODUCT_TYPE_LABELS;

  constructor() {
    const slug = this.route.snapshot.paramMap.get('slug');
    if (!slug) {
      this.error.set('Producto no encontrado.');
      this.loading.set(false);
      return;
    }

    this.catalog.getCategories().subscribe({
      next: (items) => this.categories.set(items),
      error: () => this.categories.set([]),
    });

    this.catalog.getProductBySlug(slug).subscribe({
      next: (product) => {
        this.product.set(product);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('No se encontró el producto.');
        this.loading.set(false);
      },
    });
  }

  protected categoryName(): string {
    const product = this.product();
    if (!product) return '';
    return this.categories().find((category) => category.id === product.categoryId)?.name ?? '';
  }

  protected addToCart(): void {
    const product = this.product();
    if (!product) return;
    this.cart.add(toCartItem(product));
    this.toasts.show(`"${product.title}" añadido al carrito`, 'success');
  }

  protected goToCatalog(): void {
    void this.router.navigateByUrl('/');
  }

  protected buyNow(): void {
    this.addToCart();
    void this.router.navigateByUrl('/cart');
  }
}
