import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Subject, firstValueFrom, of, throwError } from 'rxjs';
import type { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import type { AuthResult, PublicUser } from '../models/auth.model';
import { AuthStore } from '../stores/auth.store';
import { AuthService } from './auth.service';

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

function configureStore() {
  TestBed.configureTestingModule({
    providers: [AuthStore, { provide: AuthService, useClass: StubAuthService }],
  });
  return TestBed.inject(AuthStore);
}

describe('AuthStore', () => {
  const storageKey = 'bytemarket.session';

  beforeEach(() => {
    localStorage.removeItem(storageKey);
  });

  it('login stores the user and both tokens and flips isLoggedIn', async () => {
    const store = configureStore();

    const result = await firstValueFrom(
      store.login({ email: 'alice@example.com', password: 'secret123' }),
    );

    expect(result).toEqual(user);
    expect(store.currentUser()).toEqual(user);
    expect(store.currentToken()).toBe('access-1');
    expect(store.currentRefreshToken()).toBe('refresh-1');
    expect(store.isLoggedIn()).toBe(true);
    expect(store.isAdmin()).toBe(false);
    expect(JSON.parse(localStorage.getItem(storageKey) ?? '{}')).toMatchObject({
      user: { email: 'alice@example.com' },
      accessToken: 'access-1',
      refreshToken: 'refresh-1',
    });
  });

  it('logout clears the session and the persisted storage', async () => {
    const store = configureStore();
    await firstValueFrom(store.login({ email: 'a@b.c', password: 'secret123' }));

    store.logout();

    expect(store.isLoggedIn()).toBe(false);
    expect(store.currentToken()).toBeNull();
    expect(store.currentRefreshToken()).toBeNull();
    expect(localStorage.getItem(storageKey)).toBeNull();
  });

  it('restores a persisted session on construction', () => {
    localStorage.setItem(
      storageKey,
      JSON.stringify({ user, accessToken: 'access-1', refreshToken: 'refresh-1' }),
    );
    const store = configureStore();
    expect(store.currentUser()?.email).toBe('alice@example.com');
    expect(store.currentToken()).toBe('access-1');
    expect(store.currentRefreshToken()).toBe('refresh-1');
    expect(store.isLoggedIn()).toBe(true);
  });

  it('refresh() re-reads the user from the API', async () => {
    const store = configureStore();
    await firstValueFrom(store.login({ email: 'a@b.c', password: 'secret123' }));

    const refreshed = await firstValueFrom(store.refresh());
    expect(refreshed.email).toBe('alice@example.com');
    expect(store.currentUser()?.email).toBe('alice@example.com');
  });

  describe('refreshAccessToken (single-flight)', () => {
    it('refreshes once for concurrent callers and stores the new pair', async () => {
      const store = configureStore();
      await firstValueFrom(store.login({ email: 'a@b.c', password: 'secret123' }));
      const stub = TestBed.inject(AuthService) as unknown as StubAuthService;

      const [first, second] = await Promise.all([
        store.refreshAccessToken(),
        store.refreshAccessToken(),
      ]);

      expect(first).toBe(true);
      expect(second).toBe(true);
      expect(stub.refreshCalls).toBe(1);
      expect(store.currentToken()).toBe('access-2');
      expect(store.currentRefreshToken()).toBe('refresh-2');
    });

    it('clears the session and returns false when the refresh fails', async () => {
      const store = configureStore();
      await firstValueFrom(store.login({ email: 'a@b.c', password: 'secret123' }));
      const stub = TestBed.inject(AuthService) as unknown as StubAuthService;
      stub.refreshResult$ = throwError(() => new Error('refresh failed'));

      const refreshed = await store.refreshAccessToken();

      expect(refreshed).toBe(false);
      expect(store.isLoggedIn()).toBe(false);
      expect(localStorage.getItem(storageKey)).toBeNull();
    });

    it('shares one in-flight refresh for a real concurrent burst', async () => {
      const store = configureStore();
      await firstValueFrom(store.login({ email: 'a@b.c', password: 'secret123' }));
      const stub = TestBed.inject(AuthService) as unknown as StubAuthService;
      const pending = new Subject<AuthResult>();
      stub.refreshResult$ = pending.asObservable();

      const a = store.refreshAccessToken();
      const b = store.refreshAccessToken();
      pending.next(session('access-9', 'refresh-9'));

      expect(await Promise.all([a, b])).toEqual([true, true]);
      expect(stub.refreshCalls).toBe(1);
      expect(store.currentToken()).toBe('access-9');
    });
  });
});

describe('AuthService (HTTP contract)', () => {
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('POST /auth/login posts credentials and returns the token bundle', async () => {
    const service = TestBed.inject(AuthService);
    const resultPromise = firstValueFrom(
      service.login({ email: 'alice@example.com', password: 'secret123' }),
    );

    const request = http.expectOne(`${environment.apiUrl}/auth/login`);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({ email: 'alice@example.com', password: 'secret123' });
    request.flush(session());

    expect(await resultPromise).toEqual(session());
  });

  it('GET /auth/me hits the protected endpoint', async () => {
    const service = TestBed.inject(AuthService);
    const resultPromise = firstValueFrom(service.me());

    const request = http.expectOne(`${environment.apiUrl}/auth/me`);
    expect(request.request.method).toBe('GET');
    request.flush({ user });

    expect((await resultPromise).user.email).toBe('alice@example.com');
  });

  it('POST /auth/refresh sends the refresh token in the body', async () => {
    const service = TestBed.inject(AuthService);
    const resultPromise = firstValueFrom(service.refresh('refresh-1'));

    const request = http.expectOne(`${environment.apiUrl}/auth/refresh`);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({ refresh_token: 'refresh-1' });
    request.flush(session('access-2', 'refresh-2'));

    expect((await resultPromise).access_token).toBe('access-2');
  });

  it('POST /auth/logout sends the refresh token in the body', async () => {
    const service = TestBed.inject(AuthService);
    const resultPromise = firstValueFrom(service.logout('refresh-1'));

    const request = http.expectOne(`${environment.apiUrl}/auth/logout`);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({ refresh_token: 'refresh-1' });
    request.flush(null);

    await expect(resultPromise).resolves.toBeNull();
  });
});
