import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import type { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { environment } from '../../../environments/environment';
import type { PagedResult } from '../models/catalog.model';
import type { AdminOrder } from '../models/order.model';
import type { PublicUser } from '../models/auth.model';
import type {
  AdminProduct,
  AdminProductInput,
  AdminProductQuery,
  AdminProductStatus,
  AdminProductUpdate,
  CreateUserInput,
} from '../models/admin.model';

// Acceso a datos de catálogo y pedidos de admin (rol ADMIN verificado en el servidor).
@Injectable({ providedIn: 'root' })
export class AdminService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiUrl;

  listProducts(query: AdminProductQuery): Observable<PagedResult<AdminProduct>> {
    let params = new HttpParams();
    if (query.search) params = params.set('search', query.search);
    if (query.status) params = params.set('status', query.status);
    if (query.platform) params = params.set('platform', query.platform);
    if (query.sort) params = params.set('sort', query.sort);
    if (query.page) params = params.set('page', String(query.page));
    if (query.pageSize) params = params.set('pageSize', String(query.pageSize));

    return this.http.get<PagedResult<AdminProduct>>(`${this.baseUrl}/admin/products`, { params });
  }

  createProduct(input: AdminProductInput): Observable<AdminProduct> {
    return this.http.post<AdminProduct>(`${this.baseUrl}/admin/products`, input);
  }

  updateProduct(id: string, changes: AdminProductUpdate): Observable<AdminProduct> {
    return this.http.patch<AdminProduct>(`${this.baseUrl}/admin/products/${id}`, changes);
  }

  changeStatus(id: string, status: AdminProductStatus): Observable<AdminProduct> {
    return this.http.patch<AdminProduct>(`${this.baseUrl}/admin/products/${id}/status`, { status });
  }

  listAllOrders(): Observable<AdminOrder[]> {
    return this.http
      .get<{ items: AdminOrder[] }>(`${this.baseUrl}/admin/orders`)
      .pipe(map((response) => response.items));
  }

  // Solo ADMIN: crea una cuenta de staff o cliente.
  createUser(input: CreateUserInput): Observable<PublicUser> {
    return this.http
      .post<{ user: PublicUser }>(`${this.baseUrl}/admin/users`, input)
      .pipe(map((response) => response.user));
  }

  // Solo ADMIN: todas las cuentas.
  listUsers(): Observable<PublicUser[]> {
    return this.http
      .get<{ items: PublicUser[] }>(`${this.baseUrl}/admin/users`)
      .pipe(map((response) => response.items));
  }
}
