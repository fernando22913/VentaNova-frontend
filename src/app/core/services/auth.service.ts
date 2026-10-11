import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import type { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import type { AuthResult, LoginInput, PublicUser, RegisterInput } from '../models/auth.model';

// Acceso a datos de autenticación; nunca guarda tokens (lo hace AuthStore).
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

  // Usuario actual — requiere el access token Bearer que adjunta el interceptor.
  me(): Observable<{ user: PublicUser }> {
    return this.http.get<{ user: PublicUser }>(`${this.baseUrl}/auth/me`);
  }

  // Cambia un refresh token por un nuevo par access + refresh (rotación).
  refresh(refreshToken: string): Observable<AuthResult> {
    return this.http.post<AuthResult>(`${this.baseUrl}/auth/refresh`, {
      refresh_token: refreshToken,
    });
  }

  // Revoca la sesión de refresh en el servidor (best-effort al cerrar sesión).
  logout(refreshToken: string): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/auth/logout`, { refresh_token: refreshToken });
  }
}
