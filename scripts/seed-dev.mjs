// Carga un menú de ejemplo en la base de datos de desarrollo (PGlite).
// Uso: npm run db:seed
import { PGlite } from "@electric-sql/pglite";

// Copia del DDL de src/db/dev-bootstrap.ts (mantener en sync si cambia el esquema).
const DEV_SCHEMA_SQL = `
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
  "position" integer DEFAULT 0 NOT NULL
);
DO $$ BEGIN
  ALTER TABLE "menu_items" ADD CONSTRAINT "menu_items_menu_id_menus_id_fk"
    FOREIGN KEY ("menu_id") REFERENCES "menus"("id") ON DELETE cascade;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
`;

const client = new PGlite("./.pglite");
await client.exec(DEV_SCHEMA_SQL);

const today = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Europe/Madrid",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
}).format(new Date());

const { rows } = await client.query(
  `INSERT INTO menus (service_date, price, note, published)
   VALUES ($1, $2, $3, true)
   ON CONFLICT (service_date) DO UPDATE
     SET price = EXCLUDED.price, note = EXCLUDED.note, published = true
   RETURNING id`,
  [today, "13.50", "Incluye pan, bebida y café"],
);
const menuId = rows[0].id;
await client.query("DELETE FROM menu_items WHERE menu_id = $1", [menuId]);

const items = [
  ["primero", "Ensalada de la casa", "Con vinagreta de mostaza", ["gluten", "mostaza"]],
  ["primero", "Crema de calabaza", "Con picatostes", ["gluten", "lacteos"]],
  ["segundo", "Merluza a la plancha", "Con verduras salteadas", ["pescado"]],
  ["segundo", "Estofado de ternera", "Guiso tradicional", []],
  ["postre", "Flan casero", null, ["huevos", "lacteos"]],
  ["postre", "Fruta de temporada", null, []],
];

for (let i = 0; i < items.length; i++) {
  const [course, name, description, allergens] = items[i];
  await client.query(
    `INSERT INTO menu_items (menu_id, course, name, description, allergens, position)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [menuId, course, name, description, allergens, i],
  );
}

console.log(`Menú de ejemplo creado para ${today}.`);
await client.close();
