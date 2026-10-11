export type UserRole = 'CUSTOMER' | 'WORKER' | 'ADMIN';

// Forma del usuario público devuelta por la API (`/auth/register|login|me`).
export interface PublicUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  createdAt: string;
}

// Paquete de tokens de register/login/refresh; snake_case refleja el envelope de la API.
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
