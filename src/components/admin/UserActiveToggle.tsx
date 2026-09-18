"use client";

import { useTransition } from "react";
import { toggleOperatorActiveAction } from "@/lib/actions/users";

export function UserActiveToggle({ id, active }: { id: string; active: boolean }) {
  const [pending, startTransition] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => startTransition(() => toggleOperatorActiveAction(id, !active))}
      className={active
        ? "font-aux text-[10px] font-semibold uppercase text-black/50 hover:text-red"
        : "font-aux text-[10px] font-semibold uppercase text-red hover:text-black"}
    >
      {pending ? "..." : active ? "Desativar" : "Ativar"}
    </button>
  );
}
