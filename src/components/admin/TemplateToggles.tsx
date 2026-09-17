"use client";

import { useTransition } from "react";
import { toggleCategoryActiveAction, toggleItemActiveAction } from "@/lib/actions/templates";

export function CategoryActiveToggle({ id, active }: { id: string; active: boolean }) {
  const [isPending, startTransition] = useTransition();
  return (
    <button
      disabled={isPending}
      onClick={() => startTransition(() => toggleCategoryActiveAction(id, !active))}
      className={
        active
          ? "font-aux text-[11px] font-semibold uppercase text-black/50 hover:text-red"
          : "font-aux text-[11px] font-semibold uppercase text-red"
      }
    >
      {active ? "Desativar" : "Ativar"}
    </button>
  );
}

export function ItemActiveToggle({ id, active }: { id: string; active: boolean }) {
  const [isPending, startTransition] = useTransition();
  return (
    <button
      disabled={isPending}
      onClick={() => startTransition(() => toggleItemActiveAction(id, !active))}
      className={
        active
          ? "shrink-0 font-aux text-[11px] font-semibold uppercase text-black/50 hover:text-red"
          : "shrink-0 font-aux text-[11px] font-semibold uppercase text-red"
      }
    >
      {active ? "Desativar" : "Ativar"}
    </button>
  );
}
