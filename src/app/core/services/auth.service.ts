import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import type { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import type { AuthResult, LoginInput, PublicUser, RegisterInput } from '../models/auth.model';

/** Authentication data access. Never stores tokens itself — AuthStore does. */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiUrl;

  register(input: RegisterInput): Observable<AuthResult> {
    return this.http.post<AuthResult>(`${this.baseUrl}/auth/register`, input);
  }

  login(input: LoginInput): Observable<AuthResult> {
    return this.http.post<AuthResult>(`${this.baseUrl}/auth/login`, input);
  }

  /** Current user — requires the Bearer access token attached by the interceptor. */
  me(): Observable<{ user: PublicUser }> {
    return this.http.get<{ user: PublicUser }>(`${this.baseUrl}/auth/me`);
  }

  /** Exchange a refresh token for a fresh access + refresh pair (rotation). */
  refresh(refreshToken: string): Observable<AuthResult> {
    return this.http.post<AuthResult>(`${this.baseUrl}/auth/refresh`, {
      refresh_token: refreshToken,
    });
  }

  /** Revoke the refresh session server-side (best-effort on logout). */
  logout(refreshToken: string): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/auth/logout`, { refresh_token: refreshToken });
  }
}
