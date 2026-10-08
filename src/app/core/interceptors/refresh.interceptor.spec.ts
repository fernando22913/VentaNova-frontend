import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { Subject, firstValueFrom, of } from 'rxjs';
import type { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import type { AuthResult, PublicUser } from '../models/auth.model';
import { AuthStore } from '../stores/auth.store';
import { AuthService } from '../services/auth.service';
import { authInterceptor } from './auth.interceptor';
import { refreshInterceptor } from './refresh.interceptor';
import { errorInterceptor } from './error.interceptor';

const user: PublicUser = {
  id: 'u-1',
  email: 'alice@example.com',
  name: 'Alice',
  role: 'CUSTOMER',
  createdAt: '2026-10-06T00:00:00.000Z',
};

const session = (access = 'access-1', refresh = 'refresh-1'): AuthResult => ({
  user,
  access_token: access,
  refresh_token: refresh,
  token_type: 'bearer',
  expires_in: 3600,
});

/** Lets the async refresh promise settle so the retry request is emitted. */
const tick = () => new Promise<void>((resolve) => setTimeout(resolve, 0));

class StubAuthService {
  refreshCalls = 0;
  refreshResult$: Observable<AuthResult> = of(session('access-2', 'refresh-2'));

  login() {
    return of(session());
  }
  register() {
    return of(session());
  }
  me() {
    return of({ user });
  }
  refresh() {
    this.refreshCalls += 1;
    return this.refreshResult$;
  }
  logout() {
    return of(void 0);
  }
}

describe('refreshInterceptor', () => {
  const url = `${environment.apiUrl}/library`;
  let http: HttpClient;
  let httpc: HttpTestingController;
  let store: AuthStore;
  let stub: StubAuthService;

  beforeEach(async () => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideHttpClient(
          withInterceptors([refreshInterceptor, authInterceptor, errorInterceptor]),
        ),
        provideHttpClientTesting(),
        AuthStore,
        { provide: AuthService, useClass: StubAuthService },
      ],
    });
    http = TestBed.inject(HttpClient);
    httpc = TestBed.inject(HttpTestingController);
    store = TestBed.inject(AuthStore);
    stub = TestBed.inject(AuthService) as unknown as StubAuthService;
    await firstValueFrom(store.login({ email: 'a@b.c', password: 'secret123' }));
  });

  afterEach(() => httpc.verify());

  it('refreshes once on 401, retries with the new token, and succeeds', async () => {
    const promise = firstValueFrom(http.get<{ items: unknown[] }>(url));

    const initial = httpc.expectOne(url);
    expect(initial.request.headers.get('Authorization')).toBe('Bearer access-1');
    initial.flush({}, { status: 401, statusText: 'Unauthorized' });
    await tick();

    const retry = httpc.expectOne(url);
    expect(retry.request.headers.get('Authorization')).toBe('Bearer access-2');
    retry.flush({ items: [] });

    await expect(promise).resolves.toEqual({ items: [] });
    expect(stub.refreshCalls).toBe(1);
  });

  it('deduplicates concurrent 401s into a single refresh', async () => {
    const pending = new Subject<AuthResult>();
    stub.refreshResult$ = pending.asObservable();

    const first = firstValueFrom(http.get(url));
    const second = firstValueFrom(http.get(url));

    const requests = httpc.match(url);
    expect(requests).toHaveLength(2);
    requests[0]!.flush({}, { status: 401, statusText: 'Unauthorized' });
    requests[1]!.flush({}, { status: 401, statusText: 'Unauthorized' });
    await tick();

    expect(stub.refreshCalls).toBe(1);
    pending.next(session('access-2', 'refresh-2'));
    await tick();

    const retries = httpc.match(url);
    expect(retries).toHaveLength(2);
    for (const retry of retries) {
      expect(retry.request.headers.get('Authorization')).toBe('Bearer access-2');
      retry.flush({ ok: true });
    }

    await expect(Promise.all([first, second])).resolves.toEqual([{ ok: true }, { ok: true }]);
  });

  it('does not refresh or retry the refresh endpoint itself', async () => {
    const promise = firstValueFrom(
      http.post(`${environment.apiUrl}/auth/refresh`, { refresh_token: 'refresh-1' }),
    ).then(
      () => ({ ok: true as const }),
      (error: unknown) => ({ ok: false as const, error }),
    );
    const request = httpc.expectOne(`${environment.apiUrl}/auth/refresh`);
    request.flush({}, { status: 401, statusText: 'Unauthorized' });

    const result = await promise;
    if (result.ok) throw new Error('expected the refresh call to reject');
    expect(result.error).toMatchObject({ status: 401 });
    expect(stub.refreshCalls).toBe(0);
  });

  it('refreshes at most once per request (no infinite loop)', async () => {
    const promise = firstValueFrom(http.get(url)).then(
      () => ({ ok: true as const }),
      (error: unknown) => ({ ok: false as const, error }),
    );

    httpc.expectOne(url).flush({}, { status: 401, statusText: 'Unauthorized' });
    await tick();
    // Retry also 401s — the interceptor must not refresh a second time.
    httpc.expectOne(url).flush({}, { status: 401, statusText: 'Unauthorized' });
    await tick();

    const result = await promise;
    if (result.ok) throw new Error('expected the retried request to reject');
    expect(result.error).toMatchObject({ status: 401 });
    expect(stub.refreshCalls).toBe(1);
  });
});
