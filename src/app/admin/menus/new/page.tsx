import { requireAdmin } from "@/lib/auth";
import { getMenuById, type MenuInput } from "@/lib/menus";
import { todayInMadrid } from "@/lib/date";
import { MenuEditor } from "../menu-editor";

export const dynamic = "force-dynamic";
export const metadata = { title: "Nuevo menú" };

export default async function NewMenuPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string }>;
}) {
  await requireAdmin();
  const { from } = await searchParams;

  let initial: MenuInput = {
    serviceDate: todayInMadrid(),
    price: null,
    note: null,
    published: true,
    items: [],
  };

  if (from) {
    const source = await getMenuById(from);
    if (source) {
      initial = {
        serviceDate: todayInMadrid(),
        price: source.price,
        note: source.note,
        published: true,
        items: source.items.map((it) => ({
          course: it.course,
          name: it.name,
          description: it.description,
          allergens: it.allergens,
        })),
      };
    }
  }

  return (
    <div>
      <h1 className="mb-4 font-display text-2xl text-ink">
        {from ? "Duplicar menú" : "Nuevo menú"}
      </h1>
      <MenuEditor initial={initial} mode="new" />
    </div>
  );
}
