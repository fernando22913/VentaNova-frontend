import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { environment } from '../../../environments/environment';
import { TrendsService } from './trends.service';
import type { TrendReport } from '../models/trends.model';

const trendsUrl = `${environment.apiUrl}/trends`;

describe('TrendsService', () => {
  let service: TrendsService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [TrendsService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(TrendsService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('fetches the aggregate report from GET /trends', () => {
    const report: TrendReport = {
      totals: { revenueCents: 44980, paidOrders: 12, unitsSold: 31, averageOrderCents: 3748 },
      sales: [{ date: '2026-09-09', revenueCents: 2999, units: 2 }],
      bestSellers: [
        { slug: 'neo-tokyo-racer', title: 'Neo Tokyo Racer', unitsSold: 8, revenueCents: 31992 },
      ],
    };

    let result: TrendReport | undefined;
    service.getTrends().subscribe((value) => (result = value));

    const request = http.expectOne((req) => req.url === trendsUrl);
    expect(request.request.method).toBe('GET');
    request.flush(report);
    expect(result).toEqual(report);
  });
});