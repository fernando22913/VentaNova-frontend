import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { environment } from '../../../environments/environment';
import { CatalogService } from './catalog.service';

const productsUrl = `${environment.apiUrl}/products`;

describe('CatalogService', () => {
  let service: CatalogService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [CatalogService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(CatalogService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('sends every filter as an HTTP query param on /products', () => {
    service
      .searchProducts({
        search: 'neo racer',
        category: 'games',
        platform: 'CROSS',
        minPrice: '9900',
        maxPrice: '15000',
        sort: 'price_asc',
        page: 2,
        pageSize: 8,
      })
      .subscribe();

    // Predicate so the query string does not disqualify the match.
    const request = http.expectOne((req) => req.url === productsUrl);
    expect(request.request.method).toBe('GET');
    expect(request.request.params.get('search')).toBe('neo racer');
    expect(request.request.params.get('category')).toBe('games');
    expect(request.request.params.get('platform')).toBe('CROSS');
    expect(request.request.params.get('minPrice')).toBe('9900');
    expect(request.request.params.get('maxPrice')).toBe('15000');
    expect(request.request.params.get('sort')).toBe('price_asc');
    expect(request.request.params.get('page')).toBe('2');
    expect(request.request.params.get('pageSize')).toBe('8');
    request.flush({ items: [], page: 2, pageSize: 8, total: 0 });
  });

  it('omits empty filters from the request', () => {
    service.searchProducts({ sort: 'newest', page: 1, pageSize: 12 }).subscribe();
    const request = http.expectOne((req) => req.url === productsUrl);
    expect(request.request.params.get('search')).toBeNull();
    expect(request.request.params.get('category')).toBeNull();
    expect(request.request.params.get('minPrice')).toBeNull();
    expect(request.request.params.get('page')).toBe('1');
    request.flush({ items: [], page: 1, pageSize: 12, total: 0 });
  });

  it('fetches categories from GET /categories unwrapping the items array', () => {
    let result: unknown[] | undefined;
    service.getCategories().subscribe((items) => (result = items));

    const request = http.expectOne(`${environment.apiUrl}/categories`);
    request.flush({ items: [{ id: 'c-1', slug: 'games', name: 'Games' }] });
    expect(result).toEqual([{ id: 'c-1', slug: 'games', name: 'Games' }]);
  });
});
