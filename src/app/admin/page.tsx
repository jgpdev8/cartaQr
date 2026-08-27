import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { listMenus } from "@/lib/menus";
import { todayInMadrid, formatShortDate, capitalize } from "@/lib/date";
import { deleteMenuAction, duplicateMenuAction } from "./actions";
import { ConfirmButton } from "./_components/confirm-button";

export const dynamic = "force-dynamic";
export const metadata = { title: "Menús" };

function priceLabel(price: string | null): string {
  if (!price) return "Sin precio";
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
  }).format(Number(price));
}

export default async function AdminHome() {
  await requireAdmin();
  const menus = await listMenus();
  const today = todayInMadrid();

  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <h1 className="font-display text-2xl text-ink">Menús del día</h1>
        <Link
          href="/admin/menus/new"
          className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark"
        >
          Nuevo menú
        </Link>
      </div>

      {menus.length === 0 ? (
        <p className="rounded-xl bg-surface p-6 text-stone-dark shadow-sm ring-1 ring-black/5">
          Todavía no hay ningún menú. Crea el primero con «Nuevo menú».
        </p>
      ) : (
        <ul className="space-y-3">
          {menus.map((menu) => {
            const isToday = menu.serviceDate === today;
            return (
              <li
                key={menu.id}
                className="rounded-xl bg-surface p-4 shadow-sm ring-1 ring-black/5"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-medium text-ink">
                      {capitalize(formatShortDate(menu.serviceDate))}
                      {isToday && (
                        <span className="ml-2 rounded-full bg-brand-soft px-2 py-0.5 text-xs font-semibold text-brand-dark">
                          Hoy
                        </span>
                      )}
                      {!menu.published && (
                        <span className="ml-2 rounded-full bg-paper px-2 py-0.5 text-xs text-stone-dark">
                          Oculto
                        </span>
                      )}
                    </p>
                    <p className="mt-0.5 text-sm text-stone-dark">
                      {menu.itemCount}{" "}
                      {menu.itemCount === 1 ? "plato" : "platos"} ·{" "}
                      {priceLabel(menu.price)}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 text-sm">
                    <Link
                      href={`/admin/menus/${menu.id}`}
                      className="rounded-md px-3 py-1.5 font-medium text-brand hover:bg-brand-soft"
                    >
                      Editar
                    </Link>
                    <form action={duplicateMenuAction}>
                      <input type="hidden" name="id" value={menu.id} />
                      <button
                        type="submit"
                        className="rounded-md px-3 py-1.5 text-stone-dark hover:bg-paper"
                      >
                        Duplicar
                      </button>
                    </form>
                    <form action={deleteMenuAction}>
                      <input type="hidden" name="id" value={menu.id} />
                      <ConfirmButton
                        confirm={`¿Eliminar el menú del ${formatShortDate(menu.serviceDate)}?`}
                        className="rounded-md px-3 py-1.5 text-red-600 hover:bg-red-50 disabled:opacity-50"
                      >
                        Eliminar
                      </ConfirmButton>
                    </form>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
