import Link from "next/link";
import { db } from "@/lib/db";
import { ForkliftMedia } from "@/components/ForkliftMedia";
import { ForkliftStatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { Plus } from "lucide-react";
import type { ForkliftStatus } from "@/lib/types";
import type { Prisma } from "@prisma/client";

interface SearchParams {
  q?: string;
  status?: string;
}

export default async function EmpilhadeirasPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;

  const where: Prisma.ForkliftWhereInput = {};
  if (params.status) where.status = params.status;
  if (params.q) {
    where.OR = [
      { code: { contains: params.q } },
      { brand: { contains: params.q } },
      { model: { contains: params.q } },
    ];
  }

  const forklifts = await db.forklift.findMany({
    where,
    include: {
      forkliftType: true,
      energyType: true,
      checklists: {
        where: { status: "CONCLUIDO" },
        orderBy: { finishedAt: "desc" },
        take: 1,
      },
    },
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
          <Plus size={14} aria-hidden="true" /> Cadastrar
        </Link>
      </div>

      <form className="mt-6 flex flex-wrap gap-3" method="get">
        <input
          name="q"
          defaultValue={params.q}
          placeholder="Buscar por código, marca ou modelo"
          aria-label="Buscar empilhadeira"
          className="input max-w-xs"
        />
        <select name="status" defaultValue={params.status ?? ""} aria-label="Filtrar por status" className="input max-w-[180px]">
          <option value="">Todos os status</option>
          <option value="LIBERADA">Liberada</option>
          <option value="RESTRICAO">Restrição</option>
          <option value="BLOQUEADA">Bloqueada</option>
        </select>
        <button type="submit" className="bg-black px-4 py-2.5 font-sans text-xs font-bold uppercase text-white">
          Filtrar
        </button>
      </form>

      {forklifts.length === 0 ? (
        <div className="mt-6">
          <EmptyState title="Nenhuma empilhadeira encontrada" description="Ajuste os filtros ou cadastre um novo equipamento." />
        </div>
      ) : (
        <div className="mt-6 overflow-x-auto border border-black/10 bg-white">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-black/10 font-aux text-[11px] uppercase tracking-widest text-black/50">
                <th scope="col" className="px-4 py-3">Equipamento</th>
                <th scope="col" className="px-4 py-3">Tipo</th>
                <th scope="col" className="px-4 py-3">Energia</th>
                <th scope="col" className="px-4 py-3">Capacidade</th>
                <th scope="col" className="px-4 py-3">Último checklist</th>
                <th scope="col" className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {forklifts.map((f) => {
                const lastChecklist = f.checklists[0];
                return (
                  <tr key={f.id} className="border-b border-black/5 last:border-0 hover:bg-tan/40">
                    <td className="px-4 py-3">
                      <Link href={`/admin/empilhadeiras/${f.id}`} className="flex items-center gap-3">
                        <div className="h-10 w-10 shrink-0 border border-black/10 bg-tan">
                          <ForkliftMedia
                            imageUrl={f.imageUrl}
                            typeKey={f.forkliftType.key}
                            alt={`${f.brand} ${f.model}`}
                            fit="contain"
                            className="h-full w-full p-1 text-black/70"
                          />
                        </div>
                        <div>
                          <p className="font-sans text-sm font-semibold text-black hover:underline">{f.code}</p>
                          <p className="font-aux text-xs text-black/50">{f.brand} {f.model}</p>
                        </div>
                      </Link>
                    </td>
                    <td className="px-4 py-3 font-aux text-sm text-black/70">{f.forkliftType.name}</td>
                    <td className="px-4 py-3 font-aux text-sm text-black/70">{f.energyType.name}</td>
                    <td className="px-4 py-3 font-aux text-sm text-black/70">{f.capacityKg.toLocaleString("pt-BR")} kg</td>
                    <td className="px-4 py-3 font-aux text-sm text-black/70">
                      {lastChecklist?.finishedAt
                        ? lastChecklist.finishedAt.toLocaleDateString("pt-BR")
                        : <span className="text-black/30">—</span>}
                    </td>
                    <td className="px-4 py-3"><ForkliftStatusBadge status={f.status as ForkliftStatus} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
