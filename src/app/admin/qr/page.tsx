import Image from "next/image";
import { requireAdmin } from "@/lib/auth";
import { getSiteUrl, CAFE_NAME } from "@/lib/site";
import { PrintButton } from "./print-button";

export const dynamic = "force-dynamic";
export const metadata = { title: "Código QR" };

export default async function QrPage() {
  await requireAdmin();
  const url = getSiteUrl();
  const isLocal = url.includes("localhost");

  return (
    <div>
      <h1 className="mb-1 font-display text-2xl text-ink">Código QR</h1>
      <p className="mb-6 text-sm text-stone-dark">
        Este QR enlaza con <span className="font-medium text-ink">{url}</span>,
        la web donde se muestra el menú del día.
      </p>

      {isLocal && (
        <p className="mb-6 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
          Estás en local. Configura <code>NEXT_PUBLIC_SITE_URL</code> con el
          dominio real para que el QR apunte a la web publicada.
        </p>
      )}

      <div className="no-print rounded-xl bg-surface p-6 shadow-sm ring-1 ring-black/5">
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/admin/qr/image?format=svg"
            alt="Código QR de la carta"
            width={220}
            height={220}
            className="rounded-lg border border-black/10"
          />
          <div className="flex flex-col gap-2">
            <a
              href="/admin/qr/image?format=png"
              download="qr-aspas-cafe.png"
              className="rounded-lg bg-brand px-4 py-2 text-center text-sm font-semibold text-white hover:bg-brand-dark"
            >
              Descargar PNG
            </a>
            <a
              href="/admin/qr/image?format=svg"
              download="qr-aspas-cafe.svg"
              className="rounded-lg border border-brand px-4 py-2 text-center text-sm font-semibold text-brand hover:bg-brand-soft"
            >
              Descargar SVG
            </a>
            <PrintButton />
          </div>
        </div>
      </div>

      {/* Cartel para imprimir y poner en las mesas */}
      <div className="hidden print:block">
        <div className="mx-auto max-w-md pt-16 text-center">
          <Image
            src="/logo.jpg"
            alt="Fundación ASPAS"
            width={300}
            height={90}
            className="mx-auto mb-10 h-16 w-auto"
          />
          <h2 className="mb-2 font-display text-3xl">{CAFE_NAME}</h2>
          <p className="mb-8 text-lg">Escanea el código para ver el menú del día</p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/admin/qr/image?format=png"
            alt="Código QR de la carta"
            width={320}
            height={320}
            className="mx-auto"
          />
          <p className="mt-8 text-sm">{url}</p>
        </div>
      </div>
    </div>
  );
}
