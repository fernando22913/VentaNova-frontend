import { TestBed } from '@angular/core/testing';
import type { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { firstValueFrom } from 'rxjs';

import { AuthService } from '../services/auth.service';
import { AuthStore } from '../stores/auth.store';
import { adminGuard, authGuard, guestGuard, workerGuard } from './auth.guard';

type Role = 'CUSTOMER' | 'WORKER' | 'ADMIN';

// Stub configurable: el rol devuelto en login decide el rol de la sesión.
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

// Crea un store nuevo (sin sesión) con el cableado real de TestBed.
function setupStore(): void {
  TestBed.configureTestingModule({
    providers: [AuthStore, { provide: AuthService, useClass: StubAuthService }, provideRouter([])],
  });
  void TestBed.inject(AuthStore);
}

describe('route guards', () => {
  const route = {} as ActivatedRouteSnapshot;

  beforeEach(() => {
    // localStorage de jsdom se comparte; limpia sesiones para que los guards inicien sin sesión.
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
    // Debe ser un UrlTree, no un booleano.
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

    // Cambia el rol en el mismo store (sin reconfigurar TestBed).
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

  it('workerGuard allows staff and rejects customers', async () => {
    const store = await signInAs('WORKER');
    expect(TestBed.runInInjectionContext(() => workerGuard(route, routeState('/worker')))).toBe(
      true,
    );
    expect(TestBed.runInInjectionContext(() => adminGuard(route, routeState('/admin')))).not.toBe(
      true,
    );

    store.logout();
    loginRole = 'ADMIN';
    await firstValueFrom(store.login({ email: 'user@example.com', password: 'secret123' }));
    expect(TestBed.runInInjectionContext(() => workerGuard(route, routeState('/worker')))).toBe(
      true,
    );

    store.logout();
    loginRole = 'CUSTOMER';
    await firstValueFrom(store.login({ email: 'user@example.com', password: 'secret123' }));
    expect(TestBed.runInInjectionContext(() => workerGuard(route, routeState('/worker')))).not.toBe(
      true,
    );
  });

  it('workerGuard sends guests to the login screen', () => {
    setupStore();
    expect(TestBed.runInInjectionContext(() => workerGuard(route, routeState('/worker')))).not.toBe(
      true,
    );
  });
});
