import Link from "next/link";
import { db } from "@/lib/db";
import { ForkliftStatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import type { ForkliftStatus } from "@/lib/types";
import type { Prisma } from "@prisma/client";
import { requireAdmin } from "@/lib/actions/admin-guard";

interface SearchParams {
  forklift?: string;
  status?: string;
  q?: string;
}

export default async function ChecklistsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const session = await requireAdmin();
  const forklifts = await db.forklift.findMany({ where: { organizationId: session.user.organizationId }, orderBy: { code: "asc" } });

  const where: Prisma.ChecklistWhereInput = { status: "CONCLUIDO", organizationId: session.user.organizationId };
  if (params.forklift) where.forkliftId = params.forklift;
  if (params.status) where.resultStatus = params.status;

  const checklists = await db.checklist.findMany({
    where,
    include: { forklift: true, operator: true },
    orderBy: { finishedAt: "desc" },
    take: 100,
  });

  const filtered = params.q
    ? checklists.filter(
        (c) =>
          c.forklift.code.toLowerCase().includes(params.q!.toLowerCase()) ||
          c.operator.name.toLowerCase().includes(params.q!.toLowerCase()),
      )
    : checklists;

  return (
    <main className="p-6 md:p-10">
      <h1 className="font-display text-2xl font-bold uppercase tracking-tight text-black">Checklists</h1>

      <form className="mt-6 flex flex-wrap gap-3" method="get">
        <input
          name="q"
          defaultValue={params.q}
          placeholder="Buscar por equipamento ou operador"
          aria-label="Buscar por equipamento ou operador"
          className="input max-w-xs"
        />
        <select name="forklift" defaultValue={params.forklift ?? ""} aria-label="Filtrar por empilhadeira" className="input max-w-[180px]">
          <option value="">Todas as empilhadeiras</option>
          {forklifts.map((f) => (
            <option key={f.id} value={f.id}>{f.code}</option>
          ))}
        </select>
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

      {filtered.length === 0 ? (
        <div className="mt-6">
          <EmptyState title="Nenhum checklist encontrado" description="Ajuste os filtros ou aguarde novas inspeções serem finalizadas." />
        </div>
      ) : (
        <div className="mt-6 overflow-x-auto border border-black/10 bg-white">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-black/10 font-aux text-[11px] uppercase tracking-widest text-black/50">
                <th scope="col" className="px-4 py-3">Data</th>
                <th scope="col" className="px-4 py-3">Hora</th>
                <th scope="col" className="px-4 py-3">Empilhadeira</th>
                <th scope="col" className="px-4 py-3">Operador</th>
                <th scope="col" className="px-4 py-3">Resultado</th>
                <th scope="col" className="px-4 py-3">NC</th>
                <th scope="col" className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={c.id} className="border-b border-black/5 last:border-0 hover:bg-tan/40">
                  <td className="px-4 py-3 font-aux text-sm text-black/70">
                    {c.finishedAt?.toLocaleDateString("pt-BR")}
                  </td>
                  <td className="px-4 py-3 font-aux text-sm text-black/70">
                    {c.finishedAt?.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                  </td>
                  <td className="px-4 py-3">
                    <Link href={`/admin/checklists/${c.id}`} className="font-sans text-sm font-semibold text-black hover:underline">
                      {c.forklift.code}
                    </Link>
                  </td>
                  <td className="px-4 py-3 font-aux text-sm text-black/70">{c.operator.name}</td>
                  <td className="px-4 py-3 font-aux text-sm text-black/70">
                    {c.conformCount}/{c.totalItems} conformes
                  </td>
                  <td className="px-4 py-3 font-aux text-sm text-black/70">{c.nonConformCount} NC</td>
                  <td className="px-4 py-3"><ForkliftStatusBadge status={c.resultStatus as ForkliftStatus} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
