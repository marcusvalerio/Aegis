import { db } from "@/lib/db";
import { StatTile } from "@/components/ui/Card";
import { SeverityBadge, NonConformityStatusBadge } from "@/components/ui/StatusBadge";
import { NonConformityActions } from "@/components/admin/NonConformityActions";
import type { NonConformityStatus, Severity } from "@/lib/types";

export default async function NaoConformidadesPage() {
  const [abertas, emTratamento, resolvidas, criticas, list] = await Promise.all([
    db.nonConformity.count({ where: { status: "ABERTA" } }),
    db.nonConformity.count({ where: { status: "EM_TRATAMENTO" } }),
    db.nonConformity.count({ where: { status: "RESOLVIDA" } }),
    db.nonConformity.count({ where: { severity: "CRITICA", status: { not: "RESOLVIDA" } } }),
    db.nonConformity.findMany({
      include: { forklift: true, attachments: true },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
  ]);

  return (
    <main className="p-6 md:p-10">
      <h1 className="font-display text-2xl font-bold uppercase tracking-tight text-black">
        Não conformidades
      </h1>

      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatTile label="Abertas" value={abertas} tone="red" />
        <StatTile label="Em tratamento" value={emTratamento} />
        <StatTile label="Resolvidas" value={resolvidas} tone="green" />
        <StatTile label="Críticas" value={criticas} tone="red" />
      </div>

      <div className="mt-6 overflow-x-auto border border-black/10 bg-white">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-black/10 font-aux text-[11px] uppercase tracking-widest text-black/50">
              <th className="px-4 py-3">Data</th>
              <th className="px-4 py-3">Empilhadeira</th>
              <th className="px-4 py-3">Item</th>
              <th className="px-4 py-3">Descrição</th>
              <th className="px-4 py-3">Gravidade</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Ações</th>
            </tr>
          </thead>
          <tbody>
            {list.map((nc) => (
              <tr key={nc.id} className="border-b border-black/5 last:border-0 hover:bg-tan/40">
                <td className="px-4 py-3 font-aux text-sm text-black/70">{nc.createdAt.toLocaleDateString("pt-BR")}</td>
                <td className="px-4 py-3 font-sans text-sm font-semibold text-black">{nc.forklift.code}</td>
                <td className="px-4 py-3 font-aux text-sm text-black/70">{nc.itemLabel}</td>
                <td className="max-w-xs px-4 py-3 font-aux text-sm text-black/70 line-clamp-1">{nc.description}</td>
                <td className="px-4 py-3"><SeverityBadge severity={nc.severity as Severity} /></td>
                <td className="px-4 py-3"><NonConformityStatusBadge status={nc.status as NonConformityStatus} /></td>
                <td className="px-4 py-3"><NonConformityActions id={nc.id} status={nc.status as NonConformityStatus} /></td>
              </tr>
            ))}
            {list.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center font-aux text-sm text-black/50">
                  Nenhuma não conformidade registrada.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}
