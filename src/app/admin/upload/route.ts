import type { NextRequest } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import { hasBlobToken, storePhoto } from "@/lib/blob";

const MAX_BYTES = 8 * 1024 * 1024; // 8 MB (la imagen ya llega reducida)

export async function POST(req: NextRequest) {
  if (!(await isAuthenticated())) {
    return Response.json({ error: "No autorizado" }, { status: 401 });
  }
  if (!hasBlobToken()) {
    return Response.json(
      {
        error:
          "El almacén de imágenes no está configurado (falta BLOB_READ_WRITE_TOKEN).",
      },
      { status: 503 },
    );
  }

  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof Blob)) {
    return Response.json({ error: "No se ha recibido ninguna imagen." }, { status: 400 });
  }
  if (!file.type.startsWith("image/")) {
    return Response.json({ error: "El archivo no es una imagen." }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return Response.json({ error: "La imagen es demasiado grande." }, { status: 413 });
  }

  const name = file instanceof File ? file.name : "foto.jpg";
  try {
    const url = await storePhoto(file, name);
    return Response.json({ url });
  } catch (err) {
    console.error("upload", err);
    const detail =
      err instanceof Error ? err.message : "error desconocido";
    return Response.json(
      { error: `No se pudo subir la imagen: ${detail}` },
      { status: 500 },
    );
  }
}
