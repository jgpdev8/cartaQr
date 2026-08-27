import { SignJWT, jwtVerify, type JWTPayload } from "jose";

export const SESSION_COOKIE = "aspas_admin";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 30; // 30 días en segundos

function getSecret(): Uint8Array {
  const raw = process.env.ADMIN_SESSION_SECRET;
  if (!raw || raw.length < 16) {
    if (process.env.NODE_ENV === "production") {
      throw new Error(
        "ADMIN_SESSION_SECRET no está configurado (mínimo 16 caracteres).",
      );
    }
    console.warn(
      "[auth] ADMIN_SESSION_SECRET sin configurar: usando un secreto de desarrollo inseguro.",
    );
    return new TextEncoder().encode("dev-insecure-secret-change-me");
  }
  return new TextEncoder().encode(raw);
}

export async function createSessionToken(): Promise<string> {
  return new SignJWT({ role: "admin" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE}s`)
    .sign(getSecret());
}

export async function verifySessionToken(
  token: string | undefined | null,
): Promise<JWTPayload | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getSecret(), {
      algorithms: ["HS256"],
    });
    return payload.role === "admin" ? payload : null;
  } catch {
    return null;
  }
}
