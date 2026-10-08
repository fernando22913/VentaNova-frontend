import { Component, computed, inject, signal } from '@angular/core';

import { CatalogService } from '../../core/services/catalog.service';
import { ToastService } from '../../core/services/toast.service';
import { CartStore } from '../../core/stores/cart.store';
import type {
  Category,
  ProductPlatform,
  ProductQuery,
  ProductSort,
  PublicProduct,
} from '../../core/models/catalog.model';
import {
  PRODUCT_PLATFORM_LABELS,
  PRODUCT_PLATFORMS,
  PRODUCT_SORTS,
} from '../../core/models/catalog.model';

const SORT_LABELS: Record<ProductSort, string> = {
  newest: 'Más recientes',
  price_asc: 'Precio: menor a mayor',
  price_desc: 'Precio: mayor a menor',
  title: 'Alfabético',
};
import { toCartItem } from '../../core/models/order.model';
import { CategoryFilterComponent } from '../../shared/category-filter/category-filter';
import { PaginationComponent } from '../../shared/pagination/pagination';
import { ProductCardComponent } from '../../shared/product-card/product-card';
import { StatePanelComponent } from '../../shared/state-panel/state-panel';

@Component({
  selector: 'app-catalog',
  templateUrl: './catalog.html',
  imports: [
    CategoryFilterComponent,
    PaginationComponent,
    ProductCardComponent,
    StatePanelComponent,
  ],
})
export class CatalogComponent {
  private readonly catalog = inject(CatalogService);
  private readonly cart = inject(CartStore);
  private readonly toasts = inject(ToastService);

  protected readonly pageSize = 12;

  // Filter UI state (signals) — drives every request.
  protected readonly searchTerm = signal('');
  protected readonly categorySlug = signal('');
  protected readonly platform = signal<ProductPlatform | ''>('');
  protected readonly sortBy = signal<ProductSort>('newest');
  protected readonly minPrice = signal('');
  protected readonly maxPrice = signal('');
  protected readonly page = signal(1);

  // Results.
  protected readonly products = signal<PublicProduct[]>([]);
  protected readonly total = signal(0);
  protected readonly categories = signal<Category[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);

  protected readonly pageCount = computed(() =>
    Math.max(1, Math.ceil(this.total() / this.pageSize)),
  );
  protected readonly platforms = PRODUCT_PLATFORMS;
  protected readonly platformLabels = PRODUCT_PLATFORM_LABELS;
  protected readonly sorts = PRODUCT_SORTS;
  protected readonly sortLabels = SORT_LABELS;

  protected readonly hasActiveFilters = computed(() =>
    Boolean(
      this.searchTerm() ||
      this.categorySlug() ||
      this.platform() ||
      this.minPrice() ||
      this.maxPrice(),
    ),
  );
  protected readonly rangeStart = computed(() =>
    this.total() === 0 ? 0 : (this.page() - 1) * this.pageSize + 1,
  );
  protected readonly rangeEnd = computed(() => Math.min(this.page() * this.pageSize, this.total()));

  constructor() {
    this.catalog.getCategories().subscribe({
      next: (items) => this.categories.set(items),
      error: () => this.categories.set([]),
    });
    this.load();
  }

  protected load(): void {
    this.loading.set(true);
    this.error.set(null);

    this.catalog.searchProducts(this.buildQuery()).subscribe({
      next: ({ items, total }) => {
        this.products.set(items);
        this.total.set(total);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('No se pudo cargar el catálogo. Inténtalo de nuevo.');
        this.loading.set(false);
      },
    });
  }

  protected applySearch(): void {
    this.page.set(1);
    this.load();
  }

  protected onSearchInput(event: Event): void {
    this.searchTerm.set((event.target as HTMLInputElement).value);
  }

  protected onSearchKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter') this.applySearch();
  }

  protected setCategory(slug: string): void {
    this.categorySlug.set(slug);
    this.page.set(1);
    this.load();
  }

  protected setPlatform(event: Event): void {
    this.platform.set((event.target as HTMLSelectElement).value as ProductPlatform | '');
    this.page.set(1);
    this.load();
  }

  protected setSort(event: Event): void {
    this.sortBy.set((event.target as HTMLSelectElement).value as ProductSort);
    this.page.set(1);
    this.load();
  }

  protected setMinPrice(event: Event): void {
    this.minPrice.set((event.target as HTMLInputElement).value);
    this.page.set(1);
    this.load();
  }

  protected setMaxPrice(event: Event): void {
    this.maxPrice.set((event.target as HTMLInputElement).value);
    this.page.set(1);
    this.load();
  }

  protected goToPage(page: number): void {
    if (page < 1 || page > this.pageCount()) return;
    this.page.set(page);
    this.load();
  }

  protected resetFilters(): void {
    this.searchTerm.set('');
    this.categorySlug.set('');
    this.platform.set('');
    this.minPrice.set('');
    this.maxPrice.set('');
    this.sortBy.set('newest');
    this.page.set(1);
    this.load();
  }

  protected onAddToCart(product: PublicProduct): void {
    this.cart.add(toCartItem(product));
    this.toasts.show(`"${product.title}" añadido al carrito`, 'success');
  }

  private buildQuery(): ProductQuery {
    const query: ProductQuery = { sort: this.sortBy(), page: this.page(), pageSize: this.pageSize };
    const search = this.searchTerm().trim();
    if (search) query.search = search;
    if (this.categorySlug()) query.category = this.categorySlug();
    const platform = this.platform();
    if (platform) query.platform = platform;
    const min = toCents(this.minPrice());
    const max = toCents(this.maxPrice());
    if (min !== undefined) query.minPrice = String(min);
    if (max !== undefined) query.maxPrice = String(max);
    return query;
  }
}

/** Converts a user-facing dollar amount ("39.99") to integer cents. */
function toCents(value: string): number | undefined {
  const trimmed = value.trim().replace(',', '.');
  if (!/^\d+(\.\d{1,2})?$/.test(trimmed)) return undefined;
  return Math.round(parseFloat(trimmed) * 100);
}
