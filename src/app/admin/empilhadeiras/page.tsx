import Link from "next/link";
import { db } from "@/lib/db";
import { ForkliftStatusBadge } from "@/components/ui/StatusBadge";
import { Plus } from "lucide-react";
import type { ForkliftStatus } from "@/lib/types";

export default async function EmpilhadeirasPage() {
  const forklifts = await db.forklift.findMany({
    include: { forkliftType: true, energyType: true, _count: { select: { checklists: true } } },
    orderBy: { code: "asc" },
  });

  return (
    <main className="p-6 md:p-10">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold uppercase tracking-tight text-black">
          Empilhadeiras
        </h1>
        <Link
          href="/admin/empilhadeiras/nova"
          className="flex items-center gap-2 bg-yellow px-4 py-2.5 font-sans text-xs font-bold uppercase tracking-wide text-black hover:bg-yellow/90"
        >
          <Plus size={14} /> Cadastrar
        </Link>
      </div>

      <div className="mt-6 overflow-x-auto border border-black/10 bg-white">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-black/10 font-aux text-[11px] uppercase tracking-widest text-black/50">
              <th className="px-4 py-3">Código</th>
              <th className="px-4 py-3">Marca / Modelo</th>
              <th className="px-4 py-3">Tipo</th>
              <th className="px-4 py-3">Energia</th>
              <th className="px-4 py-3">Capacidade</th>
              <th className="px-4 py-3">Horímetro</th>
              <th className="px-4 py-3">Checklists</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {forklifts.map((f) => (
              <tr key={f.id} className="border-b border-black/5 last:border-0 hover:bg-tan/40">
                <td className="px-4 py-3">
                  <Link href={`/admin/empilhadeiras/${f.id}`} className="font-sans text-sm font-semibold text-black hover:underline">
                    {f.code}
                  </Link>
                </td>
                <td className="px-4 py-3 font-aux text-sm text-black/70">{f.brand} {f.model}</td>
                <td className="px-4 py-3 font-aux text-sm text-black/70">{f.forkliftType.name}</td>
                <td className="px-4 py-3 font-aux text-sm text-black/70">{f.energyType.name}</td>
                <td className="px-4 py-3 font-aux text-sm text-black/70">{f.capacityKg.toLocaleString("pt-BR")} kg</td>
                <td className="px-4 py-3 font-aux text-sm text-black/70">{f.hourmeter.toLocaleString("pt-BR")} h</td>
                <td className="px-4 py-3 font-aux text-sm text-black/70">{f._count.checklists}</td>
                <td className="px-4 py-3"><ForkliftStatusBadge status={f.status as ForkliftStatus} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
