import {
  pgTable,
  uuid,
  date,
  numeric,
  text,
  boolean,
  integer,
  timestamp,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

/** Un menú del día. Como mucho uno por fecha. */
export const menus = pgTable("menus", {
  id: uuid("id").primaryKey().defaultRandom(),
  serviceDate: date("service_date").notNull().unique(),
  price: numeric("price", { precision: 6, scale: 2 }),
  note: text("note"),
  published: boolean("published").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

/** Cada plato del menú, agrupado por `course`. */
export const menuItems = pgTable("menu_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  menuId: uuid("menu_id")
    .notNull()
    .references(() => menus.id, { onDelete: "cascade" }),
  course: text("course").notNull(), // 'primero' | 'segundo' | 'postre'
  name: text("name").notNull(),
  description: text("description"),
  allergens: text("allergens").array(),
  photoUrl: text("photo_url"),
  position: integer("position").notNull().default(0),
});

export const menusRelations = relations(menus, ({ many }) => ({
  items: many(menuItems),
}));

export const menuItemsRelations = relations(menuItems, ({ one }) => ({
  menu: one(menus, {
    fields: [menuItems.menuId],
    references: [menus.id],
  }),
}));

export type MenuRow = typeof menus.$inferSelect;
export type MenuItemRow = typeof menuItems.$inferSelect;
