# VentaNova — Frontend

SPA en **Angular 22** (standalone components + signals, Tailwind CSS v4) para la tienda
VentaNova. La API es un servicio aparte (ver el repo del backend).

## Requisitos

- Node.js 24+
- El backend corriendo (por defecto en `http://localhost:3000`)

## Levantar todo (rápido)

```bash
npm ci
npm start        # dev server en http://localhost:4200
```

`npm start` usa `src/environments/environment.development.ts`, que apunta a
`http://localhost:3000/api/v1`. Recarga en caliente al guardar cambios.

## Build

```bash
npm run build    # ng build (producción) -> dist/frontend/browser
npm run watch    # build en modo desarrollo, sin servir
```

## Tests

Runner **vitest** (vía `@angular/build:unit-test`, sin Karma). Con `CI=true` no entra en
modo watch:

```bash
CI=true npm test
# un solo spec:
CI=true npm test -- --include=src/app/shared/money.pipe.spec.ts
```

No hay lint en el frontend (ESLint es solo del backend).

## Vistas por rol

La app muestra y protege las vistas según el rol de la sesión. Los guards son **solo UX**: el
backend revalida el rol en cada request.

| Rol | Vistas |
|---|---|
| Sin sesión (público) | Inicio, Catálogo, Producto, Tendencias, Contacto, Carrito, Login / Crear cuenta |
| `CUSTOMER` | Biblioteca, Pedidos, Cuenta |
| `WORKER` | Panel de soporte (`/worker`): Contactos, Catálogo, Ventas |
| `ADMIN` | Panel de administración (`/admin`): Catálogo, Pedidos y Equipo (crear trabajadores) |

El botón **Crear cuenta** siempre registra un `CUSTOMER`. Los trabajadores los crea un admin
desde `/admin` → pestaña *Equipo*.

## Entornos

| Archivo | Se usa en | URL de API |
|---|---|---|
| `src/environments/environment.ts` | Build de producción | `https://ventanova-api.onrender.com/api/v1` |
| `src/environments/environment.development.ts` | `npm start` | `http://localhost:3000/api/v1` |

`angular.json` cambia el archivo con `fileReplacements` al servir. La URL de producción queda
fijada en el build.

## Deploy (Netlify)

`netlify.toml` maneja el deploy de producción:

- **Build:** `npm ci && npm run build`
- **Publish:** `dist/frontend/browser`
- **SPA fallback:** `/* → /index.html` (para que rutas como `/library` sobrevivan al recargar)

La URL de producción del frontend debe coincidir con el `CORS_ORIGIN` del backend. Si cambia,
actualiza `src/environments/environment.ts` y vuelve a desplegar.
