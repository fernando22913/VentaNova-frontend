import { Injectable, computed, inject, signal } from '@angular/core';
import type { Observable } from 'rxjs';
import { firstValueFrom, map, tap } from 'rxjs';

import type { AuthResult, LoginInput, PublicUser, RegisterInput } from '../models/auth.model';
import { AuthService } from '../services/auth.service';

const STORAGE_KEY = 'ventanova.session';

interface StoredSession {
  user: PublicUser;
  accessToken: string;
  refreshToken: string;
}

// Store de sesión basado en signals (ADR-11): usuario + tokens en localStorage; fuente de verdad para guards/interceptors (los tokens son exfiltrables por XSS, mitigado con codificación, vida corta y rotación).
@Injectable({ providedIn: 'root' })
export class AuthStore {
  private readonly auth = inject(AuthService);

  private readonly userSignal = signal<PublicUser | null>(null);
  private readonly accessTokenSignal = signal<string | null>(null);
  private readonly refreshTokenSignal = signal<string | null>(null);

  // Guarda single-flight: los 401 concurrentes comparten una única petición de refresh.
  private refreshInFlight: Promise<boolean> | null = null;

  readonly currentUser = this.userSignal.asReadonly();
  readonly currentToken = this.accessTokenSignal.asReadonly();
  readonly currentRefreshToken = this.refreshTokenSignal.asReadonly();
  readonly isLoggedIn = computed(
    () => this.userSignal() !== null && this.accessTokenSignal() !== null,
  );
  readonly isAdmin = computed(() => this.userSignal()?.role === 'ADMIN');
  readonly isWorker = computed(() => this.userSignal()?.role === 'WORKER');
  // Staff = ADMIN o WORKER: puede usar el panel de soporte/operaciones.
  readonly isStaff = computed(() => {
    const role = this.userSignal()?.role;
    return role === 'ADMIN' || role === 'WORKER';
  });
  readonly isCustomer = computed(() => this.userSignal()?.role === 'CUSTOMER');

  constructor() {
    this.restoreSession();
  }

  register(input: RegisterInput): Observable<PublicUser> {
    return this.auth.register(input).pipe(
      tap((result) => this.applySession(result)),
      map((result) => result.user),
    );
  }

  login(input: LoginInput): Observable<PublicUser> {
    return this.auth.login(input).pipe(
      tap((result) => this.applySession(result)),
      map((result) => result.user),
    );
  }

  // Relee el usuario actual desde la API (ejercita el interceptor Bearer).
  refresh(): Observable<PublicUser> {
    return this.auth.me().pipe(
      tap(({ user }) => this.userSignal.set(user)),
      map(({ user }) => user),
    );
  }

  // Rota la sesión una vez ante una ráfaga de 401 concurrentes; true si se guardó un nuevo par, false si no hay sesión o falló el refresh (se limpia la sesión).
  refreshAccessToken(): Promise<boolean> {
    if (this.refreshInFlight) return this.refreshInFlight;

    const refreshToken = this.refreshTokenSignal();
    if (!refreshToken) return Promise.resolve(false);

    this.refreshInFlight = firstValueFrom(this.auth.refresh(refreshToken))
      .then((result) => {
        this.applySession(result);
        return true;
      })
      .catch(() => {
        this.clearSession();
        return false;
      })
      .finally(() => {
        this.refreshInFlight = null;
      });

    return this.refreshInFlight;
  }

  // Logout en el cliente; revocación en el servidor best-effort (nunca bloquea).
  logout(): void {
    const refreshToken = this.refreshTokenSignal();
    if (refreshToken) {
      this.auth.logout(refreshToken).subscribe({ error: () => undefined });
    }
    this.clearSession();
  }

  // Descarta la sesión local sin llamar a la API (p. ej. refresh fallido).
  clearSession(): void {
    this.userSignal.set(null);
    this.accessTokenSignal.set(null);
    this.refreshTokenSignal.set(null);
    localStorage.removeItem(STORAGE_KEY);
  }

  private applySession(result: AuthResult): void {
    this.userSignal.set(result.user);
    this.accessTokenSignal.set(result.access_token);
    this.refreshTokenSignal.set(result.refresh_token);
    const session: StoredSession = {
      user: result.user,
      accessToken: result.access_token,
      refreshToken: result.refresh_token,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  }

  private restoreSession(): void {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const session = JSON.parse(raw) as StoredSession;
      if (session.user && session.accessToken && session.refreshToken) {
        this.userSignal.set(session.user);
        this.accessTokenSignal.set(session.accessToken);
        this.refreshTokenSignal.set(session.refreshToken);
      }
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    }
  }
}
