import type { Config } from "drizzle-kit";

export default {
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    // Solo se necesita para `drizzle-kit migrate` / `push` (producción).
    url: process.env.DATABASE_URL ?? "postgres://user:pass@localhost:5432/db",
  },
} satisfies Config;
