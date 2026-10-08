import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import type { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { environment } from '../../../environments/environment';
import type { CardDetails, LibraryItem, PayResult, PublicOrder } from '../models/order.model';

/** Orders, checkout and library data access (all authenticated endpoints). */
@Injectable({ providedIn: 'root' })
export class OrdersService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiUrl;

  createOrder(items: { productId: string; quantity: number }[]): Observable<PublicOrder> {
    return this.http.post<PublicOrder>(`${this.baseUrl}/orders`, { items });
  }

  payOrder(orderId: string, card: CardDetails): Observable<PayResult> {
    return this.http.post<PayResult>(`${this.baseUrl}/orders/${orderId}/pay`, card);
  }

  listOrders(): Observable<PublicOrder[]> {
    return this.http
      .get<{ items: PublicOrder[] }>(`${this.baseUrl}/orders`)
      .pipe(map((response) => response.items));
  }

  getOrder(orderId: string): Observable<PublicOrder> {
    return this.http.get<PublicOrder>(`${this.baseUrl}/orders/${orderId}`);
  }

  getLibrary(): Observable<LibraryItem[]> {
    return this.http
      .get<{ items: LibraryItem[] }>(`${this.baseUrl}/library`)
      .pipe(map((response) => response.items));
  }
}
