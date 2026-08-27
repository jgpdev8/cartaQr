import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // PGlite (base de datos de desarrollo) carga un binario WASM y debe quedar
  // fuera del bundle del servidor.
  serverExternalPackages: ["@electric-sql/pglite"],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "*.public.blob.vercel-storage.com" },
    ],
  },
};

export default nextConfig;
