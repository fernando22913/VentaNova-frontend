import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import type { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { environment } from '../../../environments/environment';
import type { PagedResult } from '../models/catalog.model';
import type { AdminOrder } from '../models/order.model';
import type {
  AdminProduct,
  AdminProductInput,
  AdminProductQuery,
  AdminProductStatus,
  AdminProductUpdate,
} from '../models/admin.model';

/** Admin catalog + orders data access (ADMIN role enforced server-side). */
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
}
