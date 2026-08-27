"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import {
  checkPassword,
  endSession,
  requireAdmin,
  startSession,
} from "@/lib/auth";
import { ALLERGEN_IDS } from "@/lib/allergens";
import {
  deleteMenu,
  MenuDateTakenError,
  saveMenu,
  type MenuInput,
} from "@/lib/menus";

/* ------------------------------ Autenticación ----------------------------- */

type LoginState = { error?: string };

// Límite de intentos simple en memoria (por instancia del servidor).
const attempts = new Map<string, { count: number; first: number }>();
const WINDOW_MS = 10 * 60 * 1000;
const MAX_ATTEMPTS = 8;

function rateLimited(key: string): boolean {
  const now = Date.now();
  const entry = attempts.get(key);
  if (!entry || now - entry.first > WINDOW_MS) {
    attempts.set(key, { count: 1, first: now });
    return false;
  }
  entry.count += 1;
  return entry.count > MAX_ATTEMPTS;
}

export async function loginAction(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const ip =
    (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() || "local";

  if (rateLimited(ip)) {
    return { error: "Demasiados intentos. Espera unos minutos e inténtalo de nuevo." };
  }

  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "/admin");

  if (!process.env.ADMIN_PASSWORD?.trim()) {
    return {
      error:
        "El servidor no tiene configurada la variable ADMIN_PASSWORD. Revísala en Vercel y vuelve a desplegar.",
    };
  }

  if (!checkPassword(password)) {
    return { error: "Contraseña incorrecta." };
  }

  try {
    await startSession();
  } catch (err) {
    console.error("startSession", err);
    return {
      error:
        "No se pudo iniciar sesión. Revisa que ADMIN_SESSION_SECRET esté configurada en Vercel (mínimo 16 caracteres) y vuelve a desplegar.",
    };
  }

  attempts.delete(ip);
  redirect(next.startsWith("/admin") ? next : "/admin");
}

export async function logoutAction(): Promise<void> {
  await endSession();
  redirect("/admin/login");
}

/* --------------------------------- Menús ---------------------------------- */

const priceSchema = z
  .string()
  .trim()
  .transform((v) => v.replace(",", "."))
  .refine((v) => v === "" || /^\d{1,4}(\.\d{1,2})?$/.test(v), {
    message: "Precio no válido.",
  })
  .transform((v) => (v === "" ? null : Number(v).toFixed(2)));

const itemSchema = z.object({
  course: z.enum(["primero", "segundo", "postre"]),
  name: z.string().trim().min(1, "Falta el nombre de un plato.").max(200),
  description: z
    .string()
    .trim()
    .max(500)
    .transform((v) => (v === "" ? null : v))
    .nullable(),
  allergens: z
    .array(z.string())
    .transform((arr) => arr.filter((a) => (ALLERGEN_IDS as string[]).includes(a))),
  photoUrl: z
    .string()
    .trim()
    .transform((v) => (v === "" ? null : v))
    .nullable()
    .refine(
      (v) => v === null || /^https?:\/\//.test(v),
      "URL de foto no válida.",
    ),
});

const menuSchema = z.object({
  id: z.uuid().optional(),
  serviceDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha no válida.")
    .refine((v) => !Number.isNaN(Date.parse(v)), "Fecha no válida."),
  price: priceSchema,
  note: z
    .string()
    .trim()
    .max(300)
    .transform((v) => (v === "" ? null : v))
    .nullable(),
  published: z.boolean(),
  items: z.array(itemSchema).min(1, "Añade al menos un plato."),
});

export type SaveMenuResult =
  | { ok: true; id: string }
  | { ok: false; error: string };

export async function saveMenuAction(raw: unknown): Promise<SaveMenuResult> {
  await requireAdmin();

  const parsed = menuSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Datos no válidos.",
    };
  }

  try {
    const id = await saveMenu(parsed.data as MenuInput);
    revalidatePath("/");
    revalidatePath("/admin");
    return { ok: true, id };
  } catch (err) {
    if (err instanceof MenuDateTakenError) {
      return {
        ok: false,
        error: "Ya existe un menú para esa fecha. Edítalo desde la lista.",
      };
    }
    console.error("saveMenuAction", err);
    return { ok: false, error: "No se pudo guardar el menú. Inténtalo de nuevo." };
  }
}

export async function deleteMenuAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (id) {
    await deleteMenu(id);
    revalidatePath("/");
    revalidatePath("/admin");
  }
  redirect("/admin");
}

export async function duplicateMenuAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  redirect(id ? `/admin/menus/new?from=${id}` : "/admin/menus/new");
}
