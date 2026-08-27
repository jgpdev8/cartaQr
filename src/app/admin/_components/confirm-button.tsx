"use client";

import { useFormStatus } from "react-dom";

export function ConfirmButton({
  children,
  confirm,
  className,
}: {
  children: React.ReactNode;
  confirm: string;
  className?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className={className}
      onClick={(e) => {
        if (!window.confirm(confirm)) e.preventDefault();
      }}
    >
      {children}
    </button>
  );
}
