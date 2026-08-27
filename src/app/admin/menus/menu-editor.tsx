"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { COURSES, type Course, type MenuInput } from "@/lib/menu-shared";
import { ALLERGENS } from "@/lib/allergens";
import { downscaleImage } from "@/lib/image";
import { saveMenuAction } from "../actions";

type EditableItem = {
  key: string;
  course: Course;
  name: string;
  description: string;
  allergens: string[];
  photoUrl: string | null;
  uploading: boolean;
};

function toEditable(input: MenuInput): EditableItem[] {
  return input.items.map((it) => ({
    key: crypto.randomUUID(),
    course: it.course,
    name: it.name,
    description: it.description ?? "",
    allergens: it.allergens,
    photoUrl: it.photoUrl ?? null,
    uploading: false,
  }));
}

export function MenuEditor({
  initial,
  mode,
}: {
  initial: MenuInput;
  mode: "new" | "edit";
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [serviceDate, setServiceDate] = useState(initial.serviceDate);
  const [price, setPrice] = useState(initial.price ?? "");
  const [note, setNote] = useState(initial.note ?? "");
  const [published, setPublished] = useState(initial.published);
  const [items, setItems] = useState<EditableItem[]>(toEditable(initial));

  const anyUploading = items.some((it) => it.uploading);

  function addItem(course: Course) {
    setItems((prev) => [
      ...prev,
      {
        key: crypto.randomUUID(),
        course,
        name: "",
        description: "",
        allergens: [],
        photoUrl: null,
        uploading: false,
      },
    ]);
  }

  function updateItem(key: string, patch: Partial<EditableItem>) {
    setItems((prev) =>
      prev.map((it) => (it.key === key ? { ...it, ...patch } : it)),
    );
  }

  function removeItem(key: string) {
    setItems((prev) => prev.filter((it) => it.key !== key));
  }

  function moveItem(key: string, dir: -1 | 1) {
    setItems((prev) => {
      const current = prev.find((it) => it.key === key);
      if (!current) return prev;
      const globalIdx = prev.findIndex((it) => it.key === key);
      let neighbour = -1;
      for (let i = globalIdx + dir; i >= 0 && i < prev.length; i += dir) {
        if (prev[i].course === current.course) {
          neighbour = i;
          break;
        }
      }
      if (neighbour === -1) return prev;
      const next = [...prev];
      [next[globalIdx], next[neighbour]] = [next[neighbour], next[globalIdx]];
      return next;
    });
  }

  function toggleAllergen(key: string, id: string) {
    setItems((prev) =>
      prev.map((it) => {
        if (it.key !== key) return it;
        const has = it.allergens.includes(id);
        return {
          ...it,
          allergens: has
            ? it.allergens.filter((a) => a !== id)
            : [...it.allergens, id],
        };
      }),
    );
  }

  async function uploadPhoto(key: string, file: File) {
    setError(null);
    updateItem(key, { uploading: true });
    try {
      let body: Blob | null = null;
      try {
        body = await downscaleImage(file);
      } catch {
        // El navegador no ha podido procesar la imagen (p. ej. HEIC de iPhone).
        body = null;
      }
      if (!body) {
        if (file.type === "image/jpeg" || file.type === "image/png") {
          body = file; // se sube tal cual
        } else {
          throw new Error(
            "No se pudo procesar esa imagen. Haz una captura o guárdala como JPG/PNG.",
          );
        }
      }
      if (body.size > 4 * 1024 * 1024) {
        throw new Error("La imagen es demasiado grande (máx. 4 MB).");
      }

      const form = new FormData();
      form.append("file", body, "foto.jpg");
      const res = await fetch("/admin/upload", { method: "POST", body: form });

      let data: { url?: string; error?: string } = {};
      try {
        data = await res.json();
      } catch {
        /* respuesta no-JSON (p. ej. 413 de la plataforma) */
      }
      if (res.status === 413) {
        throw new Error("La imagen es demasiado grande. Prueba con otra más ligera.");
      }
      if (!res.ok || !data.url) {
        throw new Error(data.error ?? `No se pudo subir la imagen (${res.status}).`);
      }
      updateItem(key, { photoUrl: data.url, uploading: false });
    } catch (err) {
      updateItem(key, { uploading: false });
      setError(err instanceof Error ? err.message : "No se pudo subir la imagen.");
    }
  }

  function save() {
    setError(null);
    const cleanItems = items
      .map((it) => ({
        course: it.course,
        name: it.name.trim(),
        description: it.description.trim() || null,
        allergens: it.allergens,
        photoUrl: it.photoUrl,
      }))
      .filter((it) => it.name.length > 0);

    if (!serviceDate) {
      setError("Indica la fecha del menú.");
      return;
    }
    if (cleanItems.length === 0) {
      setError("Añade al menos un plato con nombre.");
      return;
    }
    if (anyUploading) {
      setError("Espera a que terminen de subirse las fotos.");
      return;
    }

    const payload = {
      id: initial.id,
      serviceDate,
      price: price.trim(),
      note: note.trim(),
      published,
      items: cleanItems,
    };

    startTransition(async () => {
      const res = await saveMenuAction(payload);
      if (res.ok) {
        router.push("/admin");
        router.refresh();
      } else {
        setError(res.error);
      }
    });
  }

  const fieldClass =
    "w-full rounded-lg border border-black/15 bg-white px-3 py-2 outline-none focus:border-brand focus:ring-2 focus:ring-brand/30";

  return (
    <div className="space-y-6">
      <div className="rounded-xl bg-surface p-4 shadow-sm ring-1 ring-black/5 sm:p-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="text-sm font-medium text-stone-dark">Fecha</span>
            <input
              type="date"
              value={serviceDate}
              onChange={(e) => setServiceDate(e.target.value)}
              className={`mt-1 ${fieldClass}`}
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-stone-dark">
              Precio del menú (€)
            </span>
            <input
              type="text"
              inputMode="decimal"
              placeholder="p. ej. 12,50"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className={`mt-1 ${fieldClass}`}
            />
          </label>
        </div>
        <label className="mt-4 block">
          <span className="text-sm font-medium text-stone-dark">
            Nota (opcional)
          </span>
          <input
            type="text"
            placeholder="p. ej. Incluye pan, bebida y café"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className={`mt-1 ${fieldClass}`}
          />
        </label>
        <label className="mt-4 flex items-center gap-2">
          <input
            type="checkbox"
            checked={published}
            onChange={(e) => setPublished(e.target.checked)}
            className="h-4 w-4 accent-[var(--color-brand)]"
          />
          <span className="text-sm text-stone-dark">
            Publicado (visible en la web)
          </span>
        </label>
      </div>

      {COURSES.map((course) => {
        const courseItems = items.filter((it) => it.course === course.id);
        return (
          <section
            key={course.id}
            className="rounded-xl bg-surface p-4 shadow-sm ring-1 ring-black/5 sm:p-6"
          >
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-display text-lg text-ink">{course.plural}</h2>
              <button
                type="button"
                onClick={() => addItem(course.id)}
                className="rounded-md bg-brand-soft px-3 py-1.5 text-sm font-medium text-brand-dark hover:bg-brand/20"
              >
                + Añadir
              </button>
            </div>

            {courseItems.length === 0 ? (
              <p className="text-sm text-stone">Sin platos en esta sección.</p>
            ) : (
              <ul className="space-y-4">
                {courseItems.map((item, idx) => (
                  <li
                    key={item.key}
                    className="rounded-lg border border-black/10 p-3"
                  >
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Nombre del plato"
                        value={item.name}
                        onChange={(e) =>
                          updateItem(item.key, { name: e.target.value })
                        }
                        className={`flex-1 ${fieldClass}`}
                      />
                      <div className="flex flex-col">
                        <button
                          type="button"
                          aria-label="Subir"
                          disabled={idx === 0}
                          onClick={() => moveItem(item.key, -1)}
                          className="px-1.5 text-stone-dark disabled:opacity-30"
                        >
                          ▲
                        </button>
                        <button
                          type="button"
                          aria-label="Bajar"
                          disabled={idx === courseItems.length - 1}
                          onClick={() => moveItem(item.key, 1)}
                          className="px-1.5 text-stone-dark disabled:opacity-30"
                        >
                          ▼
                        </button>
                      </div>
                      <button
                        type="button"
                        aria-label="Eliminar plato"
                        onClick={() => removeItem(item.key)}
                        className="rounded-md px-2 text-red-600 hover:bg-red-50"
                      >
                        ✕
                      </button>
                    </div>

                    <input
                      type="text"
                      placeholder="Descripción (opcional)"
                      value={item.description}
                      onChange={(e) =>
                        updateItem(item.key, { description: e.target.value })
                      }
                      className={`mt-2 text-sm ${fieldClass}`}
                    />

                    {/* Foto del plato */}
                    <div className="mt-3 flex items-center gap-3">
                      {item.photoUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={item.photoUrl}
                          alt=""
                          className="h-16 w-16 flex-none rounded-md object-cover ring-1 ring-black/10"
                        />
                      ) : (
                        <div className="flex h-16 w-16 flex-none items-center justify-center rounded-md bg-paper text-2xl text-stone">
                          🍽️
                        </div>
                      )}
                      <div className="flex flex-wrap gap-2 text-sm">
                        <label className="cursor-pointer rounded-md bg-brand-soft px-3 py-1.5 font-medium text-brand-dark hover:bg-brand/20">
                          {item.uploading
                            ? "Subiendo…"
                            : item.photoUrl
                              ? "Cambiar foto"
                              : "Añadir foto"}
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            disabled={item.uploading}
                            onChange={(e) => {
                              const f = e.target.files?.[0];
                              e.target.value = "";
                              if (f) uploadPhoto(item.key, f);
                            }}
                          />
                        </label>
                        {item.photoUrl && !item.uploading && (
                          <button
                            type="button"
                            onClick={() =>
                              updateItem(item.key, { photoUrl: null })
                            }
                            className="rounded-md px-3 py-1.5 text-red-600 hover:bg-red-50"
                          >
                            Quitar
                          </button>
                        )}
                      </div>
                    </div>

                    <details className="mt-2 text-sm">
                      <summary className="cursor-pointer text-stone-dark">
                        Alérgenos
                        {item.allergens.length > 0 &&
                          ` (${item.allergens.length})`}
                      </summary>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {ALLERGENS.map((a) => {
                          const on = item.allergens.includes(a.id);
                          return (
                            <button
                              key={a.id}
                              type="button"
                              onClick={() => toggleAllergen(item.key, a.id)}
                              className={`rounded-full px-2.5 py-1 text-xs ${
                                on
                                  ? "bg-brand text-white"
                                  : "bg-paper text-stone-dark hover:bg-black/5"
                              }`}
                            >
                              {a.icon} {a.label}
                            </button>
                          );
                        })}
                      </div>
                    </details>
                  </li>
                ))}
              </ul>
            )}
          </section>
        );
      })}

      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <div className="sticky bottom-0 flex gap-3 border-t border-black/10 bg-paper/95 py-3 backdrop-blur">
        <button
          type="button"
          onClick={save}
          disabled={pending || anyUploading}
          className="rounded-lg bg-brand px-5 py-2.5 font-semibold text-white hover:bg-brand-dark disabled:opacity-60"
        >
          {pending
            ? "Guardando…"
            : mode === "new"
              ? "Crear menú"
              : "Guardar cambios"}
        </button>
        <button
          type="button"
          onClick={() => router.push("/admin")}
          className="rounded-lg px-4 py-2.5 text-stone-dark hover:bg-black/5"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}
