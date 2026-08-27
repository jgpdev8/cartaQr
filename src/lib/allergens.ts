/** Los 14 alérgenos de declaración obligatoria en la UE (Reglamento 1169/2011). */
export const ALLERGENS = [
  { id: "gluten", label: "Gluten", icon: "🌾" },
  { id: "crustaceos", label: "Crustáceos", icon: "🦐" },
  { id: "huevos", label: "Huevos", icon: "🥚" },
  { id: "pescado", label: "Pescado", icon: "🐟" },
  { id: "cacahuetes", label: "Cacahuetes", icon: "🥜" },
  { id: "soja", label: "Soja", icon: "🫘" },
  { id: "lacteos", label: "Lácteos", icon: "🥛" },
  { id: "frutos-cascara", label: "Frutos de cáscara", icon: "🌰" },
  { id: "apio", label: "Apio", icon: "🥬" },
  { id: "mostaza", label: "Mostaza", icon: "🌭" },
  { id: "sesamo", label: "Sésamo", icon: "◦" },
  { id: "sulfitos", label: "Sulfitos", icon: "🍷" },
  { id: "altramuces", label: "Altramuces", icon: "🌱" },
  { id: "moluscos", label: "Moluscos", icon: "🐚" },
] as const;

export type AllergenId = (typeof ALLERGENS)[number]["id"];

export const ALLERGEN_IDS = ALLERGENS.map((a) => a.id) as AllergenId[];

const BY_ID = new Map(ALLERGENS.map((a) => [a.id, a]));

export function allergenLabel(id: string): string {
  return BY_ID.get(id as AllergenId)?.label ?? id;
}

export function allergenIcon(id: string): string {
  return BY_ID.get(id as AllergenId)?.icon ?? "•";
}
