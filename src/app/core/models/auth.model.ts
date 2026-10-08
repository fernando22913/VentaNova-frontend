export type UserRole = 'CUSTOMER' | 'ADMIN';

/** Public user shape as returned by the API (`/auth/register|login|me`). */
export interface PublicUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  createdAt: string;
}

/**
 * Token bundle returned by register/login/refresh. Snake_case mirrors the API
 * (OAuth-style token envelope). The refresh token is opaque — not a JWT.
 */
export interface AuthResult {
  user: PublicUser;
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
}

export interface RegisterInput {
  email: string;
  name: string;
  password: string;
}

export interface LoginInput {
  email: string;
  password: string;
}
