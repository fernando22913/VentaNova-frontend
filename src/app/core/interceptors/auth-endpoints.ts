// Endpoints de auth que nunca deben activar el envío de token ni el refresh.
const AUTH_PATHS = ['/auth/login', '/auth/register', '/auth/refresh', '/auth/logout'];

export function isAuthEndpoint(url: string): boolean {
  return AUTH_PATHS.some((path) => url.includes(path));
}
