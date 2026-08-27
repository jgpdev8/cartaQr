# Aspas Café — Carta web + panel admin

Web pública que muestra el **menú del día** de Aspas Café (Fundación ASPAS), un
pequeño **panel de administración** para configurarlo y una pantalla que genera
el **código QR** que enlaza con la web.

- **Web pública:** `/`
- **Panel admin:** `/admin` (protegido con una contraseña única)
- **Código QR:** `/admin/qr`

## Stack

- Next.js 16 (App Router) + React 19 + TypeScript
- Tailwind CSS v4
- PostgreSQL con Drizzle ORM
  - **Producción:** Neon (`DATABASE_URL`)
  - **Desarrollo local:** [PGlite](https://pglite.dev) embebido en `./.pglite`
    (no hace falta instalar Postgres)
- `qrcode` para el QR, `jose` para la cookie de sesión del admin

## Puesta en marcha (local)

```bash
nvm use 20            # requiere Node 20.9+
npm install
cp .env.example .env.local   # ya incluido; revisa los valores
npm run db:seed       # (opcional) carga un menú de ejemplo
npm run dev
```

Abre <http://localhost:3000>. El panel está en
<http://localhost:3000/admin> (contraseña por defecto en `.env.local`: `aspas`).

Sin `DATABASE_URL` la app usa PGlite y crea las tablas automáticamente al
arrancar.

## Variables de entorno

| Variable | Descripción |
|---|---|
| `DATABASE_URL` | Cadena de conexión de Postgres (Neon). Vacía en local = PGlite. |
| `ADMIN_PASSWORD` | Contraseña única del panel `/admin`. |
| `ADMIN_SESSION_SECRET` | Secreto para firmar la cookie de sesión (`openssl rand -base64 32`). |
| `NEXT_PUBLIC_SITE_URL` | URL pública del sitio; se usa en el QR y en las metaetiquetas. |

## Base de datos

El esquema está en `src/db/schema.ts`. Tras cambiarlo:

```bash
npm run db:generate         # genera la migración SQL en ./drizzle
npm run db:migrate          # la aplica a la BD de DATABASE_URL (producción)
```

En local, PGlite aplica el DDL de `src/db/dev-bootstrap.ts` al arrancar (si
cambias el esquema, actualiza también ese archivo y `scripts/seed-dev.mjs`).

## Despliegue en Vercel

1. Sube el repo a GitHub e impórtalo en Vercel.
2. Crea una base de datos **Neon** (integración de Vercel o
   [neon.tech](https://neon.tech), plan gratuito) y copia su cadena de conexión.
3. En Vercel → *Settings → Environment Variables*, añade:
   - `DATABASE_URL` = cadena de Neon (pooled)
   - `ADMIN_PASSWORD` = la contraseña que usará el café
   - `ADMIN_SESSION_SECRET` = `openssl rand -base64 32`
   - `NEXT_PUBLIC_SITE_URL` = `https://<tu-proyecto>.vercel.app` (o el dominio propio)
4. Aplica el esquema a Neon una vez:
   ```bash
   DATABASE_URL="<cadena-de-neon>" npm run db:migrate
   ```
5. Deploy. Entra en `/admin`, crea el menú del día y descarga el QR en
   `/admin/qr`.

## Notas

- `npm audit` reporta una vulnerabilidad *moderate* de `esbuild` que llega solo
  como dependencia de desarrollo de `drizzle-kit`; no afecta al código de
  producción.
- El bloque `BEGIN:nextjs-agent-rules` de `AGENTS.md` lo regenera `next dev`.
