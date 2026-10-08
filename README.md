# VentaNova — Frontend

Angular 22 single-page application (standalone components + signals, Tailwind CSS v4)
for the VentaNova digital storefront. This repository is the standalone frontend;
the API lives in a separate repository.

## Requirements

- Node.js 24 LTS
- npm (lockfile committed)

## Install dependencies

```bash
npm ci
```

## Run locally

```bash
npm start
```

The dev server listens on `http://localhost:4200/` and reloads on changes. It uses the
development environment (`src/environments/environment.development.ts`), which points at
`http://localhost:3000/api/v1` — start the backend separately.

## Build

```bash
npm run build
```

`ng build` defaults to the **production** configuration (optimization + output hashing).
Build output goes to `dist/frontend/browser`.

## Tests

The runner is **vitest** via the `@angular/build:unit-test` builder (no Karma). In CI,
`CI=true` keeps it from entering watch mode:

```bash
CI=true npm test
```

A single spec or directory:

```bash
CI=true npm test -- --include=src/app/shared/money.pipe.spec.ts
```

There is no frontend lint step (ESLint is backend-only).

## Environment configuration

| File | Purpose | API URL |
|---|---|---|
| `src/environments/environment.ts` | Production build (default) | `https://ventanova-api.onrender.com/api/v1` |
| `src/environments/environment.development.ts` | `ng serve` / development | `http://localhost:3000/api/v1` |

`angular.json` swaps the development file in via `fileReplacements` at serve time; the
production build uses `environment.ts`. The production API URL is baked in at build time —
there are no build-time environment variables.

## How it connects to the deployed API

- All requests go to `environment.apiUrl` (`/api/v1`).
- The API is a short-lived Bearer **access** JWT paired with a rotating opaque **refresh**
  token. `refreshInterceptor` transparently refreshes an expired access token once
  (single-flight) and retries; on failure it clears the session and redirects to `/login`.
- Route guards/interceptors are UX only — the backend re-verifies JWT and role on every
  request.
- CORS on the API allows exactly the Netlify production origin, so the deployed site URL
  must match the backend's `CORS_ORIGIN`.

## Netlify deployment

This repository is the production frontend. `netlify.toml` (repo root) drives the deploy:

- **Build command:** `npm ci && npm run build`
- **Publish directory:** `dist/frontend/browser`
- **Node:** `24`
- **SPA fallback:** `/* → /index.html` (status 200) so deep routes such as `/library` survive
  a hard reload.

After the first deploy, confirm the production URL matches the API's `CORS_ORIGIN` and, if
it differs, update `src/environments/environment.ts` and redeploy.
