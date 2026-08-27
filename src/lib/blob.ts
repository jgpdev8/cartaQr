import "server-only";
import { put, del } from "@vercel/blob";

const BLOB_HOST = ".blob.vercel-storage.com";

export function hasBlobToken(): boolean {
  return !!process.env.BLOB_READ_WRITE_TOKEN;
}

function isStoredPhoto(url: string): boolean {
  return url.includes(BLOB_HOST);
}

/** Sube una imagen (ya reducida en el cliente) y devuelve su URL pública. */
export async function storePhoto(
  file: Blob,
  filename: string,
): Promise<string> {
  const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-60) || "foto";
  const { url } = await put(`platos/${safeName}`, file, {
    access: "public",
    addRandomSuffix: true,
    contentType: file.type || "image/jpeg",
  });
  return url;
}

/** Borra fotos del almacén. Best-effort: nunca lanza. */
export async function deleteStoredPhotos(urls: string[]): Promise<void> {
  const targets = urls.filter(isStoredPhoto);
  if (targets.length === 0 || !hasBlobToken()) return;
  try {
    await del(targets);
  } catch (err) {
    console.error("deleteStoredPhotos", err);
  }
}
