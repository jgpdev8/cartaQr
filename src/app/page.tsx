import Image from "next/image";
import { getLatestPublishedMenu, getMenuForDate } from "@/lib/menus";
import { todayInMadrid } from "@/lib/date";
import { MenuView } from "@/components/menu-view";
import { ALLERGENS } from "@/lib/allergens";
import { CAFE_NAME, FOUNDATION_NAME } from "@/lib/site";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const today = todayInMadrid();
  const todaysMenu = await getMenuForDate(today);
  const menu =
    todaysMenu && todaysMenu.published ? todaysMenu : await getLatestPublishedMenu();
  const isStale = !(todaysMenu && todaysMenu.published) && menu !== null;

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-8 sm:py-12">
      <div className="mb-8 flex justify-center">
        <Image
          src="/logo.jpg"
          alt={FOUNDATION_NAME}
          width={300}
          height={90}
          priority
          className="h-auto w-52 sm:w-64"
        />
      </div>

      {menu ? (
        <MenuView menu={menu} staleNotice={isStale} />
      ) : (
        <div className="rounded-2xl bg-surface p-8 text-center shadow-sm ring-1 ring-black/5">
          <h1 className="font-display text-2xl text-ink">
            Aún no hay menú publicado
          </h1>
          <p className="mt-2 text-stone-dark">
            Vuelve a consultar esta página más tarde para ver el menú del día de{" "}
            {CAFE_NAME}.
          </p>
        </div>
      )}

      {menu && (
        <details className="mx-auto mt-6 max-w-2xl rounded-xl bg-surface px-5 py-3 text-sm shadow-sm ring-1 ring-black/5">
          <summary className="cursor-pointer font-medium text-stone-dark">
            Información sobre alérgenos
          </summary>
          <p className="mt-3 text-stone-dark">
            Consulta al personal si necesitas información detallada sobre
            alérgenos e intolerancias. Referencia de iconos:
          </p>
          <ul className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5 sm:grid-cols-3">
            {ALLERGENS.map((a) => (
              <li key={a.id} className="flex items-center gap-1.5 text-stone-dark">
                <span aria-hidden>{a.icon}</span>
                {a.label}
              </li>
            ))}
          </ul>
        </details>
      )}

      <footer className="mt-10 text-center text-xs text-stone">
        {CAFE_NAME} · {FOUNDATION_NAME}
      </footer>
    </main>
  );
}
