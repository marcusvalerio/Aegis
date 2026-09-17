import Link from "next/link";
import { db } from "@/lib/db";
import { MetricRow, Metric } from "@/components/ui/Card";
import { ForkliftStatusBadge, NonConformityStatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import type { ForkliftStatus } from "@/lib/types";

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

export default async function AdminDashboardPage() {
  const since = startOfToday();

  const todayChecklists = await db.checklist.findMany({
    where: { status: "CONCLUIDO", finishedAt: { gte: since } },
    include: { forklift: true, operator: true },
    orderBy: { finishedAt: "desc" },
  });

  const realizados = todayChecklists.length;
  const conformes = todayChecklists.filter((c) => c.nonConformCount === 0).length;
  const restricao = todayChecklists.filter((c) => c.resultStatus === "RESTRICAO").length;
  const bloqueados = todayChecklists.filter((c) => c.resultStatus === "BLOQUEADA").length;

  const openNCs = await db.nonConformity.findMany({
    where: { status: { in: ["ABERTA", "EM_TRATAMENTO"] } },
    include: { forklift: true },
    orderBy: { createdAt: "desc" },
    take: 6,
  });

  return (
    <main className="p-6 md:p-10">
      <h1 className="font-display text-2xl font-bold uppercase tracking-tight text-black">
        Checklists de hoje
      </h1>
      <p className="mt-1 font-aux text-sm capitalize text-black/60">
        {since.toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" })}
      </p>

      <div className="mt-6">
        <MetricRow>
          <Metric label="Realizados" value={realizados} />
          <Metric label="Conformes" value={conformes} tone="green" />
          <Metric label="Restrição" value={restricao} tone="yellow" />
          <Metric label="Bloqueados" value={bloqueados} tone="red" />
        </MetricRow>
      </div>

      <div className="mt-10 grid grid-cols-1 gap-10 lg:grid-cols-2">
        <section>
          <div className="flex items-center justify-between border-b border-black/10 pb-3">
            <h2 className="font-display text-sm font-bold uppercase tracking-wide text-black">
              Checklists recentes
            </h2>
            <Link href="/admin/checklists" className="font-aux text-xs font-semibold uppercase text-black/50 hover:text-black">
              Ver todos →
            </Link>
          </div>
          {todayChecklists.length === 0 ? (
            <div className="mt-4">
              <EmptyState title="Nenhum checklist hoje" description="Assim que um operador finalizar uma inspeção, ela aparece aqui." />
            </div>
          ) : (
            <div>
              {todayChecklists.slice(0, 8).map((c) => (
                <Link
                  key={c.id}
                  href={`/admin/checklists/${c.id}`}
                  className="flex items-center gap-3 border-b border-black/5 py-3 transition-colors hover:bg-tan/40"
                >
                  <span className="font-aux text-xs tabular-nums text-black/40">
                    {c.finishedAt?.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                  </span>
                  <span className="font-sans text-sm font-semibold text-black">{c.forklift.code}</span>
                  <span className="truncate font-aux text-xs text-black/50">{c.operator.name}</span>
                  <ForkliftStatusBadge status={c.resultStatus as ForkliftStatus} />
                </Link>
              ))}
            </div>
          )}
        </section>

        <section>
          <div className="flex items-center justify-between border-b border-black/10 pb-3">
            <h2 className="font-display text-sm font-bold uppercase tracking-wide text-black">
              Não conformidades em aberto
            </h2>
            <Link href="/admin/nao-conformidades" className="font-aux text-xs font-semibold uppercase text-black/50 hover:text-black">
              Ver todas →
            </Link>
          </div>
          {openNCs.length === 0 ? (
            <div className="mt-4">
              <EmptyState title="Nenhuma ocorrência em aberto" description="Tudo tratado — bom trabalho." />
            </div>
          ) : (
            <div>
              {openNCs.map((nc) => (
                <div key={nc.id} className="flex items-center gap-3 border-b border-black/5 py-3">
                  <span className="font-sans text-sm font-semibold text-black">{nc.forklift.code}</span>
                  <span className="truncate font-aux text-xs text-black/50">{nc.itemLabel}</span>
                  <NonConformityStatusBadge status={nc.status as "ABERTA" | "EM_TRATAMENTO" | "RESOLVIDA" | "CANCELADA"} />
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
