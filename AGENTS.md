# AGENTS.md

ByteMarket **frontend** — Angular 22 SPA. The API is a separate repository/service, so
this repo only builds and serves the browser app.

## Commands

Single npm project (repo root). Scripts:

- `npm start` — dev server at `:4200` (uses `environment.development.ts`).
- `npm run build` — `ng build`, production by default.
- `npm test` — vitest via the `@angular/build:unit-test` builder.

Run tests with `CI=true npm test`; without `CI=true`, `ng test` stays in watch mode and
never exits. A single spec or directory:

```bash
CI=true npm test -- --include=src/app/shared/money.pipe.spec.ts
```

There is **no frontend lint** — ESLint is backend-only. Prettier is repo-configured
(singleQuote, printWidth 100; also formats `.html`) but is not a CI gate.

## Architecture notes

- Angular 22, standalone components + signals.
- Tailwind v4 via Angular's PostCSS pipeline (`.postcssrc.json` + `@import 'tailwindcss'`
  in `styles.css`) — there is no `tailwind.config` and no separate Tailwind CLI step.
- `ng build` defaults to production. `fileReplacements` in `angular.json` swaps
  `environment.ts` for `environment.development.ts` at serve time; production `apiUrl`
  points at Render.
- Route guards/interceptors are UX only — the backend re-verifies JWT and role on every
  request. `refreshInterceptor` handles an expired access token: one single-flight refresh
  (`AuthStore.refreshAccessToken`), one retry, then clear-session + redirect on failure; it
  never refreshes the auth endpoints.

## Deploy

Netlify builds from this repository root (`netlify.toml`): `npm ci && npm run build`,
publish `dist/frontend/browser`, SPA fallback `/* → /index.html`. The production API URL is
baked into `environment.ts` at build time; keep it in sync with the API's `CORS_ORIGIN`.
