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

function daysAgo(n: number) {
  const d = startOfToday();
  d.setDate(d.getDate() - n);
  return d;
}

function dayKey(d: Date) {
  return d.toISOString().slice(0, 10);
}

const FLEET_STATUS_ORDER: ForkliftStatus[] = ["LIBERADA", "RESTRICAO", "BLOQUEADA"];

const FLEET_STATUS_LABEL: Record<ForkliftStatus, string> = {
  LIBERADA: "Liberadas",
  RESTRICAO: "Em restrição",
  BLOQUEADA: "Bloqueadas",
};

const FLEET_STATUS_BAR: Record<ForkliftStatus, string> = {
  LIBERADA: "bg-green",
  RESTRICAO: "bg-yellow",
  BLOQUEADA: "bg-red",
};

export default async function AdminDashboardPage() {
  const since = startOfToday();
  const since30 = daysAgo(30);

  const [
    todayChecklists,
    openNCs,
    fleetByStatus,
    fleetTotal,
    period30Checklists,
    topProblems,
  ] = await Promise.all([
    db.checklist.findMany({
      where: { status: "CONCLUIDO", finishedAt: { gte: since } },
      include: { forklift: true, operator: true },
      orderBy: { finishedAt: "desc" },
    }),
    db.nonConformity.findMany({
      where: { status: { in: ["ABERTA", "EM_TRATAMENTO"] } },
      include: { forklift: true },
      orderBy: { createdAt: "desc" },
      take: 6,
    }),
    db.forklift.groupBy({
      by: ["status"],
      where: { active: true },
      _count: { status: true },
    }),
    db.forklift.count({ where: { active: true } }),
    db.checklist.findMany({
      where: { status: "CONCLUIDO", finishedAt: { gte: since30 } },
      select: { finishedAt: true, nonConformCount: true },
    }),
    db.nonConformity.groupBy({
      by: ["itemLabel"],
      where: { createdAt: { gte: since30 } },
      _count: { itemLabel: true },
      orderBy: { _count: { itemLabel: "desc" } },
      take: 5,
    }),
  ]);

  const realizados = todayChecklists.length;
  const conformes = todayChecklists.filter((c) => c.nonConformCount === 0).length;
  const restricao = todayChecklists.filter((c) => c.resultStatus === "RESTRICAO").length;
  const bloqueados = todayChecklists.filter((c) => c.resultStatus === "BLOQUEADA").length;

  const fleetCounts: Record<ForkliftStatus, number> = { LIBERADA: 0, RESTRICAO: 0, BLOQUEADA: 0 };
  for (const row of fleetByStatus) {
    if (row.status in fleetCounts) fleetCounts[row.status as ForkliftStatus] = row._count.status;
  }
  const fleetMax = Math.max(1, ...FLEET_STATUS_ORDER.map((s) => fleetCounts[s]));

  const dailyCounts = new Map<string, number>();
  for (let i = 0; i < 30; i++) dailyCounts.set(dayKey(daysAgo(29 - i)), 0);
  for (const c of period30Checklists) {
    if (!c.finishedAt) continue;
    const key = dayKey(c.finishedAt);
    if (dailyCounts.has(key)) dailyCounts.set(key, (dailyCounts.get(key) ?? 0) + 1);
  }
  const dailySeries = Array.from(dailyCounts.entries());
  const dailyMax = Math.max(1, ...dailySeries.map(([, n]) => n));

  const total30 = period30Checklists.length;
  const conform30 = period30Checklists.filter((c) => c.nonConformCount === 0).length;
  const conformRate30 = total30 > 0 ? Math.round((conform30 / total30) * 100) : null;

  const problemsMax = Math.max(1, ...topProblems.map((p) => p._count.itemLabel));
  const topProblem = topProblems[0];

  const fleetHasData = fleetTotal > 0;

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

      <section className="mt-10 border-l-2 border-yellow bg-black p-5 text-white">
        <h2 className="font-aux text-[10px] font-semibold uppercase tracking-widest text-yellow">
          Leitura rápida
        </h2>
        {fleetHasData ? (
          <p className="mt-2 font-display text-lg font-semibold leading-snug">
            {fleetCounts.BLOQUEADA > 0
              ? `${fleetCounts.BLOQUEADA} de ${fleetTotal} empilhadeiras bloqueadas`
              : fleetCounts.RESTRICAO > 0
                ? `${fleetCounts.RESTRICAO} de ${fleetTotal} empilhadeiras em restrição`
                : `Frota liberada — ${fleetTotal} de ${fleetTotal} empilhadeiras operando normalmente`}
            {topProblem
              ? `. Problema mais frequente nos últimos 30 dias: "${topProblem.itemLabel}" (${topProblem._count.itemLabel}x).`
              : ". Nenhuma não conformidade registrada nos últimos 30 dias."}
            {conformRate30 !== null && ` Taxa de conformidade no período: ${conformRate30}%.`}
          </p>
        ) : (
          <p className="mt-2 font-aux text-sm text-white/60">
            Cadastre empilhadeiras para começar a acompanhar o status da frota.
          </p>
        )}
      </section>

      <div className="mt-10 grid grid-cols-1 gap-10 lg:grid-cols-2">
        <section>
          <div className="flex items-center justify-between border-b border-black/10 pb-3">
            <h2 className="font-display text-sm font-bold uppercase tracking-wide text-black">
              Status da frota
            </h2>
            <Link href="/admin/empilhadeiras" className="font-aux text-xs font-semibold uppercase text-black/50 hover:text-black">
              Ver todas →
            </Link>
          </div>
          {!fleetHasData ? (
            <div className="mt-4">
              <EmptyState title="Nenhuma empilhadeira cadastrada" description="Cadastre a frota para ver o status aqui." />
            </div>
          ) : (
            <div className="mt-4 space-y-4">
              {FLEET_STATUS_ORDER.map((status) => (
                <div key={status}>
                  <div className="flex items-center justify-between font-aux text-xs">
                    <span className="font-semibold uppercase tracking-wide text-black/70">
                      {FLEET_STATUS_LABEL[status]}
                    </span>
                    <span className="tabular-nums text-black/50">{fleetCounts[status]}</span>
                  </div>
                  <div className="mt-1.5 h-2 w-full bg-black/10">
                    <div
                      className={`h-2 ${FLEET_STATUS_BAR[status]}`}
                      style={{ width: `${(fleetCounts[status] / fleetMax) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section>
          <div className="flex items-center justify-between border-b border-black/10 pb-3">
            <h2 className="font-display text-sm font-bold uppercase tracking-wide text-black">
              Problemas mais frequentes
            </h2>
            <span className="font-aux text-[10px] uppercase tracking-wide text-black/40">Últimos 30 dias</span>
          </div>
          {topProblems.length === 0 ? (
            <div className="mt-4">
              <EmptyState title="Nenhuma não conformidade no período" description="Os itens mais reprovados nos últimos 30 dias aparecem aqui." />
            </div>
          ) : (
            <div className="mt-4 space-y-3">
              {topProblems.map((p) => (
                <div key={p.itemLabel}>
                  <div className="flex items-center justify-between font-aux text-xs">
                    <span className="truncate pr-2 text-black/70">{p.itemLabel}</span>
                    <span className="shrink-0 tabular-nums font-semibold text-black/60">{p._count.itemLabel}</span>
                  </div>
                  <div className="mt-1.5 h-2 w-full bg-black/10">
                    <div
                      className="h-2 bg-red"
                      style={{ width: `${(p._count.itemLabel / problemsMax) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      <section className="mt-10">
        <div className="flex items-center justify-between border-b border-black/10 pb-3">
          <h2 className="font-display text-sm font-bold uppercase tracking-wide text-black">
            Checklists nos últimos 30 dias
          </h2>
          <span className="font-aux text-xs text-black/50">
            {total30} realizados
            {conformRate30 !== null && ` · ${conformRate30}% conformes`}
          </span>
        </div>
        {total30 === 0 ? (
          <div className="mt-4">
            <EmptyState title="Nenhum checklist no período" description="O histórico dos últimos 30 dias aparece aqui." />
          </div>
        ) : (
          <div className="mt-5 flex h-24 items-end gap-[3px]">
            {dailySeries.map(([key, count]) => (
              <div
                key={key}
                title={`${key}: ${count}`}
                className="flex-1 bg-black/10"
                style={{ height: count === 0 ? "2px" : `${Math.max((count / dailyMax) * 100, 6)}%` }}
              >
                <div className={`h-full w-full ${count > 0 ? "bg-yellow" : ""}`} />
              </div>
            ))}
          </div>
        )}
      </section>

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
