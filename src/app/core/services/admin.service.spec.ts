import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { firstValueFrom } from 'rxjs';

import { environment } from '../../../environments/environment';
import { AdminService } from './admin.service';

describe('AdminService', () => {
  let service: AdminService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [AdminService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(AdminService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('maps the status filter and paging to /admin/products query params', () => {
    service.listProducts({ status: 'DRAFT', page: 2, pageSize: 20 }).subscribe();
    const request = http.expectOne((req) => req.url === `${environment.apiUrl}/admin/products`);
    expect(request.request.params.get('status')).toBe('DRAFT');
    expect(request.request.params.get('page')).toBe('2');
    request.flush({ items: [], page: 2, pageSize: 20, total: 0 });
  });

  it('PATCHes the status sub-resource', async () => {
    const promise = firstValueFrom(service.changeStatus('p-1', 'PUBLISHED'));
    const request = http.expectOne(`${environment.apiUrl}/admin/products/p-1/status`);
    expect(request.request.method).toBe('PATCH');
    expect(request.request.body).toEqual({ status: 'PUBLISHED' });
    request.flush({ id: 'p-1', status: 'PUBLISHED' });
    await promise;
  });

  it('unwraps the admin orders envelope', async () => {
    const promise = firstValueFrom(service.listAllOrders());
    const request = http.expectOne(`${environment.apiUrl}/admin/orders`);
    request.flush({ items: [{ id: 'o-1', userId: 'u-1', status: 'PAID' }] });
    expect((await promise)[0]?.id).toBe('o-1');
  });

  it('creates a user via POST /admin/users and unwraps the user', async () => {
    const promise = firstValueFrom(
      service.createUser({
        email: 'worker@test.dev',
        name: 'Worker',
        password: 'password123',
        role: 'WORKER',
      }),
    );
    const request = http.expectOne(`${environment.apiUrl}/admin/users`);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toMatchObject({ role: 'WORKER' });
    request.flush({ user: { id: 'u-1', email: 'worker@test.dev', role: 'WORKER' } });
    expect((await promise).email).toBe('worker@test.dev');
  });

  it('unwraps the users envelope from GET /admin/users', async () => {
    const promise = firstValueFrom(service.listUsers());
    const request = http.expectOne(`${environment.apiUrl}/admin/users`);
    request.flush({ items: [{ id: 'u-1', email: 'a@test.dev', role: 'WORKER' }] });
    expect((await promise)[0]?.email).toBe('a@test.dev');
  });
});
