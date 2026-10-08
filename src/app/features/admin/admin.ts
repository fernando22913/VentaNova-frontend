import { HttpErrorResponse } from '@angular/common/http';
import { DatePipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { AdminService } from '../../core/services/admin.service';
import { CatalogService } from '../../core/services/catalog.service';
import { ToastService } from '../../core/services/toast.service';
import type { Category, ProductPlatform, ProductType } from '../../core/models/catalog.model';
import {
  PRODUCT_PLATFORMS,
  PRODUCT_STATUS_LABELS,
  PRODUCT_TYPES,
  productStatusClass,
} from '../../core/models/catalog.model';
import type { AdminProduct, AdminProductStatus } from '../../core/models/admin.model';
import type { AdminOrder } from '../../core/models/order.model';
import { ORDER_STATUS_LABELS, orderStatusClass } from '../../core/models/order.model';
import { MoneyPipe } from '../../shared/money.pipe';

interface ProductForm {
  id: string | null;
  slug: string;
  title: string;
  summary: string;
  description: string;
  type: ProductType;
  platform: ProductPlatform;
  categoryId: string;
  price: string;
  coverImageUrl: string;
  assetUrl: string;
  status: 'DRAFT' | 'PUBLISHED';
}

function emptyForm(): ProductForm {
  return {
    id: null,
    slug: '',
    title: '',
    summary: '',
    description: '',
    type: 'GAME',
    platform: 'CROSS',
    categoryId: '',
    price: '0.00',
    coverImageUrl: '',
    assetUrl: '',
    status: 'DRAFT',
  };
}

@Component({
  selector: 'app-admin-panel',
  templateUrl: './admin.html',
  imports: [DatePipe, FormsModule, MoneyPipe],
})
export class AdminPanelComponent {
  private readonly admin = inject(AdminService);
  private readonly catalog = inject(CatalogService);
  private readonly toasts = inject(ToastService);

  protected readonly products = signal<AdminProduct[]>([]);
  protected readonly total = signal(0);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly categories = signal<Category[]>([]);
  protected readonly orders = signal<AdminOrder[]>([]);

  protected readonly statusFilter = signal<'' | AdminProductStatus>('');
  protected readonly searchTerm = signal('');
  protected readonly showForm = signal(false);
  protected readonly saving = signal(false);

  protected readonly statusLabels = PRODUCT_STATUS_LABELS;
  protected readonly statusClass = productStatusClass;
  protected readonly orderStatusLabels = ORDER_STATUS_LABELS;
  protected readonly orderStatusClass = orderStatusClass;
  protected readonly platforms = PRODUCT_PLATFORMS;
  protected readonly types = PRODUCT_TYPES;

  protected form: ProductForm = emptyForm();

  constructor() {
    this.catalog.getCategories().subscribe({
      next: (categories) => this.categories.set(categories),
      error: () => this.categories.set([]),
    });
    this.loadProducts();
    this.loadOrders();
  }

  protected loadProducts(): void {
    this.loading.set(true);
    this.error.set(null);
    const status = this.statusFilter();
    this.admin
      .listProducts({
        pageSize: 50,
        ...(this.searchTerm() ? { search: this.searchTerm() } : {}),
        ...(status ? { status } : {}),
      })
      .subscribe({
        next: (result) => {
          this.products.set(result.items);
          this.total.set(result.total);
          this.loading.set(false);
        },
        error: () => {
          this.error.set('No se pudo cargar el catálogo.');
          this.loading.set(false);
        },
      });
  }

  protected loadOrders(): void {
    this.admin.listAllOrders().subscribe({
      next: (orders) => this.orders.set(orders),
      error: () => this.orders.set([]),
    });
  }

  protected onSearchInput(event: Event): void {
    this.searchTerm.set((event.target as HTMLInputElement).value);
  }

  protected onStatusFilter(event: Event): void {
    this.statusFilter.set((event.target as HTMLSelectElement).value as '' | AdminProductStatus);
    this.loadProducts();
  }

  protected openCreate(): void {
    this.form = emptyForm();
    this.form.categoryId = this.categories()[0]?.id ?? '';
    this.showForm.set(true);
  }

  protected openEdit(product: AdminProduct): void {
    this.form = {
      id: product.id,
      slug: product.slug,
      title: product.title,
      summary: product.summary,
      description: product.description,
      type: product.type,
      platform: product.platform,
      categoryId: product.categoryId,
      price: (product.priceCents / 100).toFixed(2),
      coverImageUrl: product.coverImageUrl ?? '',
      assetUrl: product.assetUrl,
      status: product.status === 'ARCHIVED' ? 'DRAFT' : product.status,
    };
    this.showForm.set(true);
  }

  protected cancelForm(): void {
    this.showForm.set(false);
  }

  protected save(): void {
    const priceCents = Math.round(Number.parseFloat(this.form.price.replace(',', '.')) * 100);
    if (!Number.isFinite(priceCents) || priceCents < 0) {
      this.toasts.show('Precio inválido', 'error');
      return;
    }

    const base = {
      slug: this.form.slug.trim(),
      title: this.form.title.trim(),
      summary: this.form.summary.trim(),
      description: this.form.description.trim(),
      type: this.form.type,
      platform: this.form.platform,
      categoryId: this.form.categoryId,
      priceCents,
      coverImageUrl: this.form.coverImageUrl.trim() || null,
      assetUrl: this.form.assetUrl.trim(),
    };

    this.saving.set(true);
    const request$ = this.form.id
      ? this.admin.updateProduct(this.form.id, base)
      : this.admin.createProduct({ ...base, status: this.form.status });

    request$.subscribe({
      next: () => {
        this.saving.set(false);
        this.showForm.set(false);
        this.toasts.show(this.form.id ? 'Producto actualizado' : 'Producto creado', 'success');
        this.loadProducts();
      },
      error: (error: unknown) => {
        this.saving.set(false);
        this.toasts.show(messageFrom(error), 'error');
      },
    });
  }

  protected setStatus(product: AdminProduct, status: AdminProductStatus): void {
    this.admin.changeStatus(product.id, status).subscribe({
      next: () => {
        this.toasts.show(`"${product.title}" → ${this.statusLabels[status]}`, 'success');
        this.loadProducts();
      },
      error: (error: unknown) => this.toasts.show(messageFrom(error), 'error'),
    });
  }
}

function messageFrom(error: unknown): string {
  if (error instanceof HttpErrorResponse) {
    const body = error.error as { error?: { message?: string } } | null;
    return body?.error?.message ?? `Error ${error.status}`;
  }
  return 'Error inesperado';
}
