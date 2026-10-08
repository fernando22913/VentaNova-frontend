import { Injectable, computed, inject, signal } from '@angular/core';
import type { Observable } from 'rxjs';
import { firstValueFrom, map, tap } from 'rxjs';

import type { AuthResult, LoginInput, PublicUser, RegisterInput } from '../models/auth.model';
import { AuthService } from '../services/auth.service';

const STORAGE_KEY = 'bytemarket.session';

interface StoredSession {
  user: PublicUser;
  accessToken: string;
  refreshToken: string;
}

/**
 * Signals-first session store (blueprint ADR-11). Holds the authenticated user
 * plus both tokens, persists to localStorage, and is the single source of truth
 * for guards and the auth/refresh interceptors.
 *
 * Security trade-off: tokens live in localStorage (kept from the previous
 * phase). That is XSS-exfiltratable; it is mitigated by Angular's default
 * output encoding (no innerHTML), a short 1-hour access-token lifetime and
 * rotating refresh tokens. The hardening path is an httpOnly cookie, which is
 * out of scope here.
 */
@Injectable({ providedIn: 'root' })
export class AuthStore {
  private readonly auth = inject(AuthService);

  private readonly userSignal = signal<PublicUser | null>(null);
  private readonly accessTokenSignal = signal<string | null>(null);
  private readonly refreshTokenSignal = signal<string | null>(null);

  /** Single-flight guard: concurrent 401s share one refresh request. */
  private refreshInFlight: Promise<boolean> | null = null;

  readonly currentUser = this.userSignal.asReadonly();
  readonly currentToken = this.accessTokenSignal.asReadonly();
  readonly currentRefreshToken = this.refreshTokenSignal.asReadonly();
  readonly isLoggedIn = computed(
    () => this.userSignal() !== null && this.accessTokenSignal() !== null,
  );
  readonly isAdmin = computed(() => this.userSignal()?.role === 'ADMIN');

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

  /** Re-reads the current user from the API (exercises the Bearer interceptor). */
  refresh(): Observable<PublicUser> {
    return this.auth.me().pipe(
      tap(({ user }) => this.userSignal.set(user)),
      map(({ user }) => user),
    );
  }

  /**
   * Rotates the session at most once for a burst of concurrent 401s. Resolves
   * true when a new pair was stored, false when there is no session or the
   * refresh failed (in which case the local session is cleared).
   */
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

  /** Client-side logout; best-effort server-side revocation (never blocks). */
  logout(): void {
    const refreshToken = this.refreshTokenSignal();
    if (refreshToken) {
      this.auth.logout(refreshToken).subscribe({ error: () => undefined });
    }
    this.clearSession();
  }

  /** Drops the local session without calling the API (e.g. failed refresh). */
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
