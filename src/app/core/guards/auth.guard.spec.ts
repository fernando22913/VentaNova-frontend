import { TestBed } from '@angular/core/testing';
import type { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { firstValueFrom } from 'rxjs';

import { AuthService } from '../services/auth.service';
import { AuthStore } from '../stores/auth.store';
import { adminGuard, authGuard, guestGuard } from './auth.guard';

type Role = 'CUSTOMER' | 'ADMIN';

/** Configurable stub: the role it returns on login decides the session role. */
let loginRole: Role = 'CUSTOMER';

class StubAuthService {
  private result() {
    return of({
      user: {
        id: 'u-1',
        email: 'user@example.com',
        name: 'User',
        role: loginRole,
        createdAt: '2026-10-06T00:00:00.000Z',
      },
      access_token: 'access-token',
      refresh_token: 'refresh-token',
      token_type: 'bearer',
      expires_in: 3600,
    });
  }
  login() {
    return this.result();
  }
  register() {
    return this.result();
  }
  me() {
    return of(null);
  }
  refresh() {
    return this.result();
  }
  logout() {
    return of(void 0);
  }
}

function routeState(url: string) {
  return { url } as RouterStateSnapshot;
}

async function signInAs(role: Role): Promise<AuthStore> {
  loginRole = role;
  TestBed.configureTestingModule({
    providers: [AuthStore, { provide: AuthService, useClass: StubAuthService }, provideRouter([])],
  });
  const store = TestBed.inject(AuthStore);
  await firstValueFrom(store.login({ email: 'user@example.com', password: 'secret123' }));
  return store;
}

/** Builds a fresh (logged-out) store via the real TestBed wiring. */
function setupStore(): void {
  TestBed.configureTestingModule({
    providers: [AuthStore, { provide: AuthService, useClass: StubAuthService }, provideRouter([])],
  });
  void TestBed.inject(AuthStore);
}

describe('route guards', () => {
  const route = {} as ActivatedRouteSnapshot;

  beforeEach(() => {
    // The jsdom localStorage is shared across tests; wipe sessions so guards
    // start logged-out unless a test explicitly signs in.
    localStorage.clear();
  });

  it('authGuard allows authenticated users', async () => {
    await signInAs('CUSTOMER');
    const result = TestBed.runInInjectionContext(() => authGuard(route, routeState('/account')));
    expect(result).toBe(true);
  });

  it('authGuard redirects guests to /login with the target remembered', () => {
    setupStore();
    const result = TestBed.runInInjectionContext(() => authGuard(route, routeState('/account')));
    expect(result).not.toBe(true);
    // It must be a UrlTree, not a boolean.
    expect(typeof result).not.toBe('boolean');
  });

  it('guestGuard blocks authenticated users back home', async () => {
    await signInAs('CUSTOMER');
    const result = TestBed.runInInjectionContext(() => guestGuard(route, routeState('/login')));
    expect(result).not.toBe(true);
  });

  it('guestGuard allows guests onto the auth pages', () => {
    setupStore();
    const result = TestBed.runInInjectionContext(() => guestGuard(route, routeState('/login')));
    expect(result).toBe(true);
  });

  it('adminGuard allows admins and rejects customers', async () => {
    const store = await signInAs('ADMIN');
    expect(TestBed.runInInjectionContext(() => adminGuard(route, routeState('/admin')))).toBe(true);

    // Change role on the same store (no TestBed reconfiguration needed).
    store.logout();
    loginRole = 'CUSTOMER';
    await firstValueFrom(store.login({ email: 'user@example.com', password: 'secret123' }));
    expect(TestBed.runInInjectionContext(() => adminGuard(route, routeState('/admin')))).not.toBe(
      true,
    );
  });

  it('adminGuard sends guests to the login screen', () => {
    setupStore();
    expect(TestBed.runInInjectionContext(() => adminGuard(route, routeState('/admin')))).not.toBe(
      true,
    );
  });
});
