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

/** El backend limita pageSize a 60; el catálogo semilla cabe en una carga. */
const FETCH_PAGE_SIZE = 60;

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

  // Filter UI state (signals) — the source of truth for the derived results.
  protected readonly searchTerm = signal('');
  protected readonly categorySlug = signal('');
  protected readonly platform = signal<ProductPlatform | ''>('');
  protected readonly sortBy = signal<ProductSort>('newest');
  protected readonly minPrice = signal('');
  protected readonly maxPrice = signal('');
  protected readonly page = signal(1);

  // Full dataset loaded once from the service; filtering happens in the browser.
  protected readonly allProducts = signal<PublicProduct[]>([]);
  protected readonly categories = signal<Category[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);

  /**
   * Visible products — `computed()` recalculates this set automatically every
   * time a search term, category, platform, price or sort signal changes.
   */
  protected readonly filteredProducts = computed(() => {
    const term = this.searchTerm().trim().toLowerCase();
    const categorySlug = this.categorySlug();
    const categoryId = categorySlug
      ? this.categories().find((category) => category.slug === categorySlug)?.id
      : undefined;
    const platform = this.platform();
    const min = toCents(this.minPrice());
    const max = toCents(this.maxPrice());

    const matches = this.allProducts().filter((product) => {
      if (categoryId && product.categoryId !== categoryId) return false;
      if (platform && product.platform !== platform) return false;
      if (min !== undefined && product.priceCents < min) return false;
      if (max !== undefined && product.priceCents > max) return false;
      if (term) {
        const haystack = `${product.title} ${product.summary}`.toLowerCase();
        if (!haystack.includes(term)) return false;
      }
      return true;
    });

    return [...matches].sort((a, b) => {
      switch (this.sortBy()) {
        case 'price_asc':
          return a.priceCents - b.priceCents;
        case 'price_desc':
          return b.priceCents - a.priceCents;
        case 'title':
          return a.title.localeCompare(b.title, 'es');
        default:
          return b.createdAt.localeCompare(a.createdAt);
      }
    });
  });

  protected readonly total = computed(() => this.filteredProducts().length);
  protected readonly pageCount = computed(() =>
    Math.max(1, Math.ceil(this.total() / this.pageSize)),
  );
  protected readonly pagedProducts = computed(() => {
    const start = (this.page() - 1) * this.pageSize;
    return this.filteredProducts().slice(start, start + this.pageSize);
  });

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

  /** Loads every published product once; the visible set is derived locally. */
  protected load(): void {
    this.loading.set(true);
    this.error.set(null);

    const query: ProductQuery = { sort: 'newest', page: 1, pageSize: FETCH_PAGE_SIZE };
    this.catalog.searchProducts(query).subscribe({
      next: ({ items }) => {
        this.allProducts.set(items);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('No se pudo cargar el catálogo. Inténtalo de nuevo.');
        this.loading.set(false);
      },
    });
  }

  protected onSearchInput(event: Event): void {
    this.searchTerm.set((event.target as HTMLInputElement).value);
    this.page.set(1);
  }

  protected setCategory(slug: string): void {
    this.categorySlug.set(slug);
    this.page.set(1);
  }

  protected setPlatform(event: Event): void {
    this.platform.set((event.target as HTMLSelectElement).value as ProductPlatform | '');
    this.page.set(1);
  }

  protected setSort(event: Event): void {
    this.sortBy.set((event.target as HTMLSelectElement).value as ProductSort);
    this.page.set(1);
  }

  protected setMinPrice(event: Event): void {
    this.minPrice.set((event.target as HTMLInputElement).value);
    this.page.set(1);
  }

  protected setMaxPrice(event: Event): void {
    this.maxPrice.set((event.target as HTMLInputElement).value);
    this.page.set(1);
  }

  protected goToPage(page: number): void {
    if (page < 1 || page > this.pageCount()) return;
    this.page.set(page);
  }

  protected resetFilters(): void {
    this.searchTerm.set('');
    this.categorySlug.set('');
    this.platform.set('');
    this.minPrice.set('');
    this.maxPrice.set('');
    this.sortBy.set('newest');
    this.page.set(1);
  }

  protected onAddToCart(product: PublicProduct): void {
    this.cart.add(toCartItem(product));
    this.toasts.show(`"${product.title}" añadido al carrito`, 'success');
  }
}

/** Converts a user-facing dollar amount ("39.99") to integer cents. */
function toCents(value: string): number | undefined {
  const trimmed = value.trim().replace(',', '.');
  if (!/^\d+(\.\d{1,2})?$/.test(trimmed)) return undefined;
  return Math.round(parseFloat(trimmed) * 100);
}
