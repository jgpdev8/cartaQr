import Image from "next/image";
import { COURSES, type Menu } from "@/lib/menu-shared";
import { allergenIcon, allergenLabel } from "@/lib/allergens";
import { capitalize, formatLongDate } from "@/lib/date";

function formatPrice(price: string | null): string | null {
  if (price == null || price === "") return null;
  const n = Number(price);
  if (Number.isNaN(n)) return null;
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
  }).format(n);
}

export function MenuView({
  menu,
  staleNotice = false,
}: {
  menu: Menu;
  /** true si NO es el menú de hoy sino el último disponible. */
  staleNotice?: boolean;
}) {
  const price = formatPrice(menu.price);

  return (
    <article className="rounded-2xl bg-surface p-6 shadow-sm ring-1 ring-black/5 sm:p-8">
      <header className="text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand">
          Menú del día
        </p>
        <h1 className="mt-1 font-display text-3xl text-ink sm:text-4xl">
          {capitalize(formatLongDate(menu.serviceDate))}
        </h1>
        {price && (
          <p className="mt-4 inline-block rounded-full bg-brand px-5 py-1.5 text-lg font-semibold text-white">
            {price}
          </p>
        )}
        {staleNotice && (
          <p className="mx-auto mt-4 max-w-sm rounded-lg bg-brand-soft px-3 py-2 text-sm text-brand-dark">
            El menú de hoy todavía no está publicado. Este es el último menú
            disponible.
          </p>
        )}
      </header>

      <div className="mt-8 space-y-8">
        {COURSES.map((course) => {
          const items = menu.items.filter((it) => it.course === course.id);
          if (items.length === 0) return null;
          return (
            <section key={course.id}>
              <h2 className="font-display text-xl text-stone-dark">
                <span className="border-b-2 border-brand/30 pb-1">
                  {course.plural}
                </span>
              </h2>
              <ul className="mt-4 space-y-5">
                {items.map((item) => (
                  <li key={item.id} className="flex gap-3">
                    {item.photoUrl && (
                      <Image
                        src={item.photoUrl}
                        alt={item.name}
                        width={112}
                        height={112}
                        className="h-20 w-20 flex-none rounded-lg object-cover ring-1 ring-black/10 sm:h-24 sm:w-24"
                      />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-lg font-medium leading-snug text-ink">
                        {item.name}
                      </p>
                      {item.description && (
                        <p className="mt-0.5 font-display text-[0.95rem] italic text-stone">
                          {item.description}
                        </p>
                      )}
                      {item.allergens.length > 0 && (
                        <p className="mt-1.5 flex flex-wrap gap-1.5">
                          {item.allergens.map((a) => (
                            <span
                              key={a}
                              className="inline-flex items-center gap-1 rounded-full bg-paper px-2 py-0.5 text-xs text-stone-dark"
                            >
                              <span aria-hidden>{allergenIcon(a)}</span>
                              {allergenLabel(a)}
                            </span>
                          ))}
                        </p>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>

      {menu.note && (
        <p className="mt-8 border-t border-black/10 pt-4 text-center text-sm text-stone-dark">
          {menu.note}
        </p>
      )}
    </article>
  );
}
