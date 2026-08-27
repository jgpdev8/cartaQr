import "server-only";
import path from "node:path";
import type { NeonHttpDatabase } from "drizzle-orm/neon-http";
import * as schema from "./schema";

// PGlite y Neon exponen la misma API de consultas de Drizzle; usamos el tipo
// de Neon como tipo común para el resto de la app.
type DrizzleDb = NeonHttpDatabase<typeof schema>;

const globalForDb = globalThis as unknown as {
  __dbPromise?: Promise<DrizzleDb>;
};

async function createDb(): Promise<DrizzleDb> {
  const url = process.env.DATABASE_URL?.trim();

  if (url) {
    // Producción / Neon (o cualquier Postgres accesible por URL).
    const { drizzle } = await import("drizzle-orm/neon-http");
    const { neon } = await import("@neondatabase/serverless");
    return drizzle(neon(url), { schema });
  }

  // Sin DATABASE_URL solo se admite el modo local con PGlite. En un despliegue
  // (Vercel u otro) esto es un fallo de configuración: hay que definir la
  // variable de entorno DATABASE_URL.
  if (process.env.VERCEL || process.env.NODE_ENV === "production") {
    throw new Error(
      "Falta la variable de entorno DATABASE_URL (cadena de conexión de Neon).",
    );
  }

  // Desarrollo local sin Postgres: base de datos embebida PGlite.
  const { PGlite } = await import("@electric-sql/pglite");
  const { drizzle } = await import("drizzle-orm/pglite");
  const { DEV_SCHEMA_SQL } = await import("./dev-bootstrap");

  const client = new PGlite(path.join(process.cwd(), ".pglite"));
  await client.exec(DEV_SCHEMA_SQL);
  const db = drizzle(client, { schema });
  return db as unknown as DrizzleDb;
}

/**
 * Devuelve el cliente Drizzle. Se memoiza en `globalThis` para no reabrir la
 * conexión (ni reejecutar migraciones en PGlite) en cada recarga en caliente.
 */
export function getDb(): Promise<DrizzleDb> {
  globalForDb.__dbPromise ??= createDb().catch((err) => {
    // No cachear un fallo: permitir reintentar en la siguiente petición.
    globalForDb.__dbPromise = undefined;
    throw err;
  });
  return globalForDb.__dbPromise;
}
