import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import type { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { environment } from '../../../environments/environment';
import type {
  Category,
  PagedResult,
  ProductQuery,
  PublicProduct,
  PublicProductDetail,
} from '../models/catalog.model';

/**
 * Catalog data access. Typed Http calls; components bridge results into
 * signals with `toSignal()` or subscriptions (ADR-11: RxJS only here).
 */
@Injectable({ providedIn: 'root' })
export class CatalogService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiUrl;

  getCategories(): Observable<Category[]> {
    return this.http
      .get<{ items: Category[] }>(`${this.baseUrl}/categories`)
      .pipe(map((response) => response.items));
  }

  searchProducts(query: ProductQuery): Observable<PagedResult<PublicProduct>> {
    return this.http.get<PagedResult<PublicProduct>>(`${this.baseUrl}/products`, {
      params: this.toParams(query),
    });
  }

  getProductBySlug(slug: string): Observable<PublicProductDetail> {
    return this.http.get<PublicProductDetail>(
      `${this.baseUrl}/products/${encodeURIComponent(slug)}`,
    );
  }

  private toParams(query: ProductQuery): HttpParams {
    let params = new HttpParams();
    if (query.search) params = params.set('search', query.search);
    if (query.category) params = params.set('category', query.category);
    if (query.platform) params = params.set('platform', query.platform);
    if (query.minPrice) params = params.set('minPrice', query.minPrice);
    if (query.maxPrice) params = params.set('maxPrice', query.maxPrice);
    params = params.set('sort', query.sort);
    params = params.set('page', String(query.page));
    params = params.set('pageSize', String(query.pageSize));
    return params;
  }
}
