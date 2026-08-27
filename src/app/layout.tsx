import type { Metadata, Viewport } from "next";
import { Poppins, Fraunces } from "next/font/google";
import "./globals.css";
import { getSiteUrl, CAFE_NAME } from "@/lib/site";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: {
    default: `${CAFE_NAME} · Menú del día`,
    template: `%s · ${CAFE_NAME}`,
  },
  description: `Consulta el menú del día de ${CAFE_NAME}, de la Fundación ASPAS.`,
  openGraph: {
    title: `${CAFE_NAME} · Menú del día`,
    description: `Consulta el menú del día de ${CAFE_NAME}.`,
    type: "website",
    locale: "es_ES",
    images: ["/logo.jpg"],
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#0078a0",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es" className={`${poppins.variable} ${fraunces.variable} h-full`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
