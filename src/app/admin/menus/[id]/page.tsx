import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { getMenuById, type MenuInput } from "@/lib/menus";
import { formatShortDate, capitalize } from "@/lib/date";
import { MenuEditor } from "../menu-editor";

export const dynamic = "force-dynamic";
export const metadata = { title: "Editar menú" };

export default async function EditMenuPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const menu = await getMenuById(id);
  if (!menu) notFound();

  const initial: MenuInput = {
    id: menu.id,
    serviceDate: menu.serviceDate,
    price: menu.price,
    note: menu.note,
    published: menu.published,
    items: menu.items.map((it) => ({
      course: it.course,
      name: it.name,
      description: it.description,
      allergens: it.allergens,
      photoUrl: it.photoUrl,
    })),
  };

  return (
    <div>
      <h1 className="mb-4 font-display text-2xl text-ink">
        Menú del {capitalize(formatShortDate(menu.serviceDate))}
      </h1>
      <MenuEditor initial={initial} mode="edit" />
    </div>
  );
}
