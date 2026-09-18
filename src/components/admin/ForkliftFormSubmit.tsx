"use client";

import { useFormStatus } from "react-dom";

export function ForkliftFormSubmit({ label }: { label: string }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="mt-6 bg-black px-6 py-3 font-sans text-xs font-bold uppercase tracking-wide text-white hover:bg-black/85 disabled:opacity-50"
    >
      {pending ? "Enviando..." : label}
    </button>
  );
}
