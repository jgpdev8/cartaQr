import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { timingSafeEqual } from "node:crypto";
import {
  SESSION_COOKIE,
  SESSION_MAX_AGE,
  createSessionToken,
  verifySessionToken,
} from "./session";

export async function isAuthenticated(): Promise<boolean> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  return (await verifySessionToken(token)) !== null;
}

/** Usar al principio de cada página / Server Action del panel. */
export async function requireAdmin(): Promise<void> {
  if (!(await isAuthenticated())) {
    redirect("/admin/login");
  }
}

export function checkPassword(input: string): boolean {
  // Se recorta el valor del entorno: al pegar la variable en Vercel es fácil
  // colar un espacio o salto de línea al final.
  const expected = (process.env.ADMIN_PASSWORD ?? "").trim();
  if (!expected) {
    console.warn("[auth] ADMIN_PASSWORD sin configurar.");
    return false;
  }
  const a = Buffer.from(input.trim());
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export async function startSession(): Promise<void> {
  const token = await createSessionToken();
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
}

export async function endSession(): Promise<void> {
  (await cookies()).delete(SESSION_COOKIE);
}
