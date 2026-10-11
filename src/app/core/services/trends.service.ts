import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import type { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import type { TrendReport } from '../models/trends.model';

// Acceso público a datos de tendencias de ventas; lectura agregada sin autenticar que alimenta la vista Tendencias.
@Injectable({ providedIn: 'root' })
export class TrendsService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiUrl;

  getTrends(): Observable<TrendReport> {
    return this.http.get<TrendReport>(`${this.baseUrl}/trends`);
  }
}