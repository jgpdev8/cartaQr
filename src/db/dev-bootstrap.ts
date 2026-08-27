// DDL para la base de datos de desarrollo embebida (PGlite).
// Debe reflejar `src/db/schema.ts`. En producción se usan las migraciones
// de Drizzle (`drizzle/`), no este archivo.
export const DEV_SCHEMA_SQL = /* sql */ `
CREATE TABLE IF NOT EXISTS "menus" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "service_date" date NOT NULL,
  "price" numeric(6, 2),
  "note" text,
  "published" boolean DEFAULT true NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "menus_service_date_unique" UNIQUE ("service_date")
);

CREATE TABLE IF NOT EXISTS "menu_items" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "menu_id" uuid NOT NULL,
  "course" text NOT NULL,
  "name" text NOT NULL,
  "description" text,
  "allergens" text[],
  "photo_url" text,
  "position" integer DEFAULT 0 NOT NULL
);

DO $$ BEGIN
  ALTER TABLE "menu_items"
    ADD CONSTRAINT "menu_items_menu_id_menus_id_fk"
    FOREIGN KEY ("menu_id") REFERENCES "menus"("id") ON DELETE cascade;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "menu_items" ADD COLUMN "photo_url" text;
EXCEPTION
  WHEN duplicate_column THEN NULL;
END $$;
`;
