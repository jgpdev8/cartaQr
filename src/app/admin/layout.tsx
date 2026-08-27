import Link from "next/link";
import Image from "next/image";
import { isAuthenticated } from "@/lib/auth";
import { logoutAction } from "./actions";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const authed = await isAuthenticated();

  return (
    <div className="mx-auto flex min-h-full w-full max-w-3xl flex-1 flex-col px-4 py-6">
      {authed && (
        <header className="no-print mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-black/10 pb-4">
          <div className="flex items-center gap-3">
            <Image
              src="/logo.jpg"
              alt="Fundación ASPAS"
              width={300}
              height={90}
              className="h-8 w-auto"
            />
            <span className="font-display text-lg text-ink">Panel</span>
          </div>
          <nav className="flex items-center gap-4 text-sm">
            <Link href="/admin" className="text-brand hover:text-brand-dark">
              Menús
            </Link>
            <Link href="/admin/qr" className="text-brand hover:text-brand-dark">
              Código QR
            </Link>
            <Link href="/" className="text-stone-dark hover:text-ink" target="_blank">
              Ver web
            </Link>
            <form action={logoutAction}>
              <button
                type="submit"
                className="rounded-md px-2 py-1 text-stone-dark hover:bg-paper hover:text-ink"
              >
                Salir
              </button>
            </form>
          </nav>
        </header>
      )}
      <div className="flex-1">{children}</div>
    </div>
  );
}
