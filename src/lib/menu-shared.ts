// Tipos y constantes del menú que pueden usarse tanto en el servidor como en
// el cliente (sin dependencias de base de datos).

export type Course = "primero" | "segundo" | "postre";

export const COURSES: { id: Course; label: string; plural: string }[] = [
  { id: "primero", label: "Primero", plural: "Primeros" },
  { id: "segundo", label: "Segundo", plural: "Segundos" },
  { id: "postre", label: "Postre", plural: "Postres" },
];

export type MenuItemInput = {
  course: Course;
  name: string;
  description: string | null;
  allergens: string[];
};

export type MenuInput = {
  id?: string;
  serviceDate: string;
  price: string | null;
  note: string | null;
  published: boolean;
  items: MenuItemInput[];
};

export type MenuItem = {
  id: string;
  course: Course;
  name: string;
  description: string | null;
  allergens: string[];
  position: number;
};

export type Menu = {
  id: string;
  serviceDate: string;
  price: string | null;
  note: string | null;
  published: boolean;
  items: MenuItem[];
};

export type MenuSummary = {
  id: string;
  serviceDate: string;
  price: string | null;
  published: boolean;
  itemCount: number;
};
