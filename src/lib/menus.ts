import "server-only";
import { and, desc, eq, inArray, lte, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { menuItems, menus } from "@/db/schema";
import { todayInMadrid } from "./date";
import { deleteStoredPhotos } from "./blob";
import type { Course, Menu, MenuInput, MenuSummary } from "./menu-shared";

export {
  COURSES,
  type Course,
  type Menu,
  type MenuInput,
  type MenuItem,
  type MenuItemInput,
  type MenuSummary,
} from "./menu-shared";

function toMenu(
  row: typeof menus.$inferSelect,
  items: (typeof menuItems.$inferSelect)[],
): Menu {
  return {
    id: row.id,
    serviceDate: row.serviceDate,
    price: row.price,
    note: row.note,
    published: row.published,
    items: items
      .map((it) => ({
        id: it.id,
        course: it.course as Course,
        name: it.name,
        description: it.description,
        allergens: it.allergens ?? [],
        photoUrl: it.photoUrl,
        position: it.position,
      }))
      .sort((a, b) => a.position - b.position),
  };
}

async function loadItems(menuId: string) {
  const db = await getDb();
  return db.select().from(menuItems).where(eq(menuItems.menuId, menuId));
}

export async function getMenuForDate(serviceDate: string): Promise<Menu | null> {
  const db = await getDb();
  const [row] = await db
    .select()
    .from(menus)
    .where(eq(menus.serviceDate, serviceDate))
    .limit(1);
  if (!row) return null;
  return toMenu(row, await loadItems(row.id));
}

/** El menú publicado más reciente cuya fecha no sea futura. */
export async function getLatestPublishedMenu(): Promise<Menu | null> {
  const db = await getDb();
  const [row] = await db
    .select()
    .from(menus)
    .where(and(eq(menus.published, true), lte(menus.serviceDate, todayInMadrid())))
    .orderBy(desc(menus.serviceDate))
    .limit(1);
  if (!row) return null;
  return toMenu(row, await loadItems(row.id));
}

export async function getMenuById(id: string): Promise<Menu | null> {
  const db = await getDb();
  const [row] = await db.select().from(menus).where(eq(menus.id, id)).limit(1);
  if (!row) return null;
  return toMenu(row, await loadItems(row.id));
}

export async function listMenus(): Promise<MenuSummary[]> {
  const db = await getDb();
  const rows = await db
    .select({
      id: menus.id,
      serviceDate: menus.serviceDate,
      price: menus.price,
      published: menus.published,
      itemCount: sql<number>`count(${menuItems.id})::int`,
    })
    .from(menus)
    .leftJoin(menuItems, eq(menuItems.menuId, menus.id))
    .groupBy(menus.id)
    .orderBy(desc(menus.serviceDate));
  return rows;
}

/** Se lanza al intentar guardar un menú en una fecha que ya tiene otro. */
export class MenuDateTakenError extends Error {
  constructor() {
    super("Ya existe un menú para esa fecha.");
    this.name = "MenuDateTakenError";
  }
}

export async function saveMenu(input: MenuInput): Promise<string> {
  const db = await getDb();
  const now = new Date();
  const set = {
    serviceDate: input.serviceDate,
    price: input.price,
    note: input.note,
    published: input.published,
    updatedAt: now,
  };

  // 1. Comprobar que la fecha no está ocupada por otro menú.
  const [clash] = await db
    .select({ id: menus.id })
    .from(menus)
    .where(eq(menus.serviceDate, input.serviceDate))
    .limit(1);
  if (clash && clash.id !== input.id) {
    throw new MenuDateTakenError();
  }

  // 2. Guardar la cabecera del menú.
  let menuId: string;
  if (input.id) {
    const [row] = await db
      .update(menus)
      .set(set)
      .where(eq(menus.id, input.id))
      .returning({ id: menus.id });
    if (!row) throw new Error("Menú no encontrado.");
    menuId = row.id;
  } else {
    const [row] = await db
      .insert(menus)
      .values(set)
      .returning({ id: menus.id });
    menuId = row.id;
  }

  // 3. Reemplazar los platos.
  const previous = await db
    .select({ photoUrl: menuItems.photoUrl })
    .from(menuItems)
    .where(eq(menuItems.menuId, menuId));

  await db.delete(menuItems).where(eq(menuItems.menuId, menuId));
  if (input.items.length > 0) {
    await db.insert(menuItems).values(
      input.items.map((it, index) => ({
        menuId,
        course: it.course,
        name: it.name,
        description: it.description,
        allergens: it.allergens,
        photoUrl: it.photoUrl,
        position: index,
      })),
    );
  }

  await cleanUpPhotos(
    previous.map((p) => p.photoUrl).filter((u): u is string => !!u),
  );

  return menuId;
}

/** Borra del almacén las fotos que ya no referencia ningún plato. */
async function cleanUpPhotos(candidates: string[]): Promise<void> {
  const unique = [...new Set(candidates)];
  if (unique.length === 0) return;
  const db = await getDb();
  const stillUsed = new Set(
    (
      await db
        .select({ photoUrl: menuItems.photoUrl })
        .from(menuItems)
        .where(inArray(menuItems.photoUrl, unique))
    ).map((r) => r.photoUrl),
  );
  await deleteStoredPhotos(unique.filter((u) => !stillUsed.has(u)));
}

export async function deleteMenu(id: string): Promise<void> {
  const db = await getDb();
  const photos = await db
    .select({ photoUrl: menuItems.photoUrl })
    .from(menuItems)
    .where(eq(menuItems.menuId, id));
  await db.delete(menus).where(eq(menus.id, id));
  await cleanUpPhotos(
    photos.map((p) => p.photoUrl).filter((u): u is string => !!u),
  );
}
