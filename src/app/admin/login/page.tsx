import { Suspense } from "react";
import Image from "next/image";
import { redirect } from "next/navigation";
import { isAuthenticated } from "@/lib/auth";
import { LoginForm } from "./login-form";

export const metadata = { title: "Entrar" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  if (await isAuthenticated()) redirect("/admin");
  const { next } = await searchParams;

  return (
    <div className="mx-auto mt-16 w-full max-w-sm">
      <div className="mb-8 flex justify-center">
        <Image
          src="/logo.jpg"
          alt="Fundación ASPAS"
          width={300}
          height={90}
          className="h-12 w-auto"
        />
      </div>
      <div className="rounded-2xl bg-surface p-6 shadow-sm ring-1 ring-black/5">
        <h1 className="font-display text-xl text-ink">Panel de administración</h1>
        <p className="mt-1 text-sm text-stone-dark">
          Introduce la contraseña para gestionar el menú del día.
        </p>
        <Suspense>
          <LoginForm next={next} />
        </Suspense>
      </div>
    </div>
  );
}
