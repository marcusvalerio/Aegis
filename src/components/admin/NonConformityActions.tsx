"use client";

import { useTransition } from "react";
import { updateNonConformityStatusAction } from "@/lib/actions/nonconformities";
import type { NonConformityStatus } from "@/lib/types";

const NEXT_STATUS: Record<NonConformityStatus, NonConformityStatus[]> = {
  ABERTA: ["EM_TRATAMENTO", "CANCELADA"],
  EM_TRATAMENTO: ["RESOLVIDA", "CANCELADA"],
  RESOLVIDA: [],
  CANCELADA: [],
};

const LABEL: Record<NonConformityStatus, string> = {
  ABERTA: "Marcar como aberta",
  EM_TRATAMENTO: "Iniciar tratamento",
  RESOLVIDA: "Marcar resolvida",
  CANCELADA: "Cancelar",
};

export function NonConformityActions({ id, status }: { id: string; status: NonConformityStatus }) {
  const [isPending, startTransition] = useTransition();
  const options = NEXT_STATUS[status];

  if (options.length === 0) return <span className="font-aux text-xs text-black/30">—</span>;

  return (
    <div className="flex gap-2">
      {options.map((next) => (
        <button
          key={next}
          disabled={isPending}
          onClick={() => startTransition(() => updateNonConformityStatusAction(id, next))}
          className="border border-black/20 px-2 py-1 font-aux text-[11px] font-semibold uppercase text-black/70 hover:border-black hover:text-black disabled:opacity-40"
        >
          {LABEL[next]}
        </button>
      ))}
    </div>
  );
}
