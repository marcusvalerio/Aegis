import Link from "next/link";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/actions/admin-guard";
import { MetricRow, Metric } from "@/components/ui/Card";
import { ForkliftStatusBadge, NonConformityStatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import type { ForkliftStatus } from "@/lib/types";

const DAY_MS = 24 * 60 * 60 * 1000;

function startOfDay(date = new Date()) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function formatDay(date: Date) {
  return date.toLocaleDateString("pt-BR", { weekday: "short" }).replace(".", "");
}

export default async function AdminDashboardPage() {
  const session = await requireAdmin();
  const now = new Date();
  const today = startOfDay(now);
  const last30 = new Date(today.getTime() - 29 * DAY_MS);
  const last7 = new Date(today.getTime() - 6 * DAY_MS);
  const organizationId = session.user.organizationId;

  const [fleet, checklists30, nc30, openNCs, recentChecklists] = await Promise.all([
    db.forklift.findMany({
      where: { organizationId, active: true },
      select: { id: true, code: true, status: true },
    }),
    db.checklist.findMany({
      where: { organizationId, status: "CONCLUIDO", finishedAt: { gte: last30 } },
      select: {
        id: true,
        finishedAt: true,
        resultStatus: true,
        nonConformCount: true,
        forklift: { select: { code: true } },
        operator: { select: { name: true } },
      },
      orderBy: { finishedAt: "desc" },
    }),
    db.nonConformity.findMany({
      where: { organizationId, createdAt: { gte: last30 } },
      select: {
        id: true,
        itemLabel: true,
        categoryName: true,
        severity: true,
        status: true,
        createdAt: true,
        forklift: { select: { code: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    db.nonConformity.findMany({
      where: { organizationId, status: { in: ["ABERTA", "EM_TRATAMENTO"] } },
      select: {
        id: true,
        itemLabel: true,
        severity: true,
        status: true,
        createdAt: true,
        forklift: { select: { code: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 6,
    }),
    db.checklist.findMany({
      where: { organizationId, status: "CONCLUIDO", finishedAt: { gte: today } },
      select: {
        id: true,
        finishedAt: true,
        resultStatus: true,
        nonConformCount: true,
        forklift: { select: { code: true } },
        operator: { select: { name: true } },
      },
      orderBy: { finishedAt: "desc" },
      take: 8,
    }),
  ]);

  const realizados30 = checklists30.length;
  const conformes30 = checklists30.filter((c) => c.nonConformCount === 0).length;
  const taxaConformidade = realizados30 ? Math.round((conformes30 / realizados30) * 100) : 0;

  const liberadas = fleet.filter((f) => f.status === "LIBERADA").length;
  const restricao = fleet.filter((f) => f.status === "RESTRICAO").length;
  const bloqueadas = fleet.filter((f) => f.status === "BLOQUEADA").length;

  const problemFrequency = new Map<string, { count: number; category: string }>();
  for (const nc of nc30) {
    const current = problemFrequency.get(nc.itemLabel) ?? { count: 0, category: nc.categoryName };
    current.count += 1;
    problemFrequency.set(nc.itemLabel, current);
  }
  const topProblems = [...problemFrequency.entries()]
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 5);
  const maxProblemCount = topProblems[0]?.[1].count ?? 1;

  const trend = Array.from({ length: 7 }, (_, index) => {
    const day = new Date(last7.getTime() + index * DAY_MS);
    const start = startOfDay(day);
    const end = new Date(start.getTime() + DAY_MS);
    const inspections = checklists30.filter(
      (c) => c.finishedAt && c.finishedAt >= start && c.finishedAt < end,
    ).length;
    const problems = nc30.filter((nc) => nc.createdAt >= start && nc.createdAt < end).length;
    return { label: formatDay(start), inspections, problems };
  });
  const maxTrend = Math.max(...trend.map((d) => Math.max(d.inspections, d.problems)), 1);

  return (
    <main className="p-6 md:p-10">
      <div className="flex flex-col justify-between gap-4 border-b border-black/10 pb-6 lg:flex-row lg:items-end">
        <div>
          <p className="font-aux text-[10px] font-semibold uppercase tracking-[0.18em] text-black/40">
            Visão operacional · últimos 30 dias
          </p>
          <h1 className="mt-1 font-display text-3xl font-bold uppercase tracking-tight text-black">
            Dashboard
          </h1>
          <p className="mt-1 font-aux text-sm text-black/60">
            Acompanhe conformidade da frota, frequência de problemas e inspeções.
          </p>
        </div>
        <div className="font-aux text-xs text-black/40">
          Atualizado {now.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
        </div>
      </div>

      <div className="mt-6">
        <MetricRow>
          <Metric label="Frota ativa" value={fleet.length} />
          <Metric label="Operando conforme" value={liberadas} tone="green" />
          <Metric label="Em restrição" value={restricao} tone="yellow" />
          <Metric label="Bloqueadas" value={bloqueadas} tone="red" />
        </MetricRow>
      </div>

      <div className="mt-4">
        <MetricRow>
          <Metric label="Inspeções · 30 dias" value={realizados30} />
          <Metric label="Taxa de conformidade" value={`${taxaConformidade}%`} tone="green" />
          <Metric label="Problemas · 30 dias" value={nc30.length} tone={nc30.length ? "red" : "green"} />
          <Metric label="Pendências abertas" value={openNCs.length} tone={openNCs.length ? "yellow" : "green"} />
        </MetricRow>
      </div>

      <section className="mt-10 border-l-2 border-yellow bg-black p-5 text-white">
        <h2 className="font-aux text-[10px] font-semibold uppercase tracking-widest text-yellow">
          Leitura rápida
        </h2>
        {fleet.length > 0 ? (
          <p className="mt-2 font-display text-lg font-semibold leading-snug">
            {bloqueadas > 0
              ? `${bloqueadas} de ${fleet.length} empilhadeiras bloqueadas`
              : restricao > 0
                ? `${restricao} de ${fleet.length} empilhadeiras em restrição`
                : `Frota liberada — ${fleet.length} de ${fleet.length} empilhadeiras operando normalmente`}
            {topProblems.length > 0
              ? `. Problema mais frequente nos últimos 30 dias: "${topProblems[0][0]}" (${topProblems[0][1].count}x).`
              : ". Nenhuma não conformidade registrada nos últimos 30 dias."}
            {realizados30 > 0 && ` Taxa de conformidade no período: ${taxaConformidade}%.`}
          </p>
        ) : (
          <p className="mt-2 font-aux text-sm text-white/60">
            Cadastre empilhadeiras para começar a acompanhar o status da frota.
          </p>
        )}
      </section>

      <div className="mt-10 grid grid-cols-1 gap-8 xl:grid-cols-[1.35fr_0.65fr]">
        <section className="border border-black/10 bg-white p-5">
          <div className="flex items-end justify-between border-b border-black/10 pb-3">
            <div>
              <p className="font-aux text-[10px] font-semibold uppercase tracking-widest text-black/40">Análise</p>
              <h2 className="mt-1 font-display text-sm font-bold uppercase tracking-wide text-black">
                Frequência de problemas
              </h2>
            </div>
            <span className="font-aux text-[10px] uppercase text-black/40">30 dias</span>
          </div>

          {topProblems.length === 0 ? (
            <div className="py-10">
              <EmptyState title="Nenhum problema registrado" description="As não conformidades aparecerão aqui conforme as inspeções forem realizadas." />
            </div>
          ) : (
            <div className="mt-5 space-y-5">
              {topProblems.map(([label, data]) => (
                <div key={label}>
                  <div className="flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <p className="truncate font-sans text-sm font-semibold text-black">{label}</p>
                      <p className="font-aux text-[10px] uppercase text-black/40">{data.category}</p>
                    </div>
                    <span className="font-display text-sm font-bold tabular-nums text-black">{data.count}</span>
                  </div>
                  <div className="mt-2 h-2 bg-black/5">
                    <div
                      className="h-full bg-red"
                      style={{ width: `${Math.max(8, (data.count / maxProblemCount) * 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="border border-black/10 bg-white p-5">
          <div className="border-b border-black/10 pb-3">
            <p className="font-aux text-[10px] font-semibold uppercase tracking-widest text-black/40">Frota</p>
            <h2 className="mt-1 font-display text-sm font-bold uppercase tracking-wide text-black">
              Situação atual
            </h2>
          </div>

          <div className="mt-5 space-y-5">
            {[
              ["LIBERADA", "Operando conforme", liberadas, "bg-green"],
              ["RESTRICAO", "Com restrição", restricao, "bg-yellow"],
              ["BLOQUEADA", "Bloqueada", bloqueadas, "bg-red"],
            ].map(([key, label, value, bar]) => (
              <div key={key}>
                <div className="flex items-center justify-between">
                  <span className="font-aux text-xs font-semibold uppercase tracking-wide text-black/60">{label}</span>
                  <span className="font-display text-sm font-bold tabular-nums">{value}</span>
                </div>
                <div className="mt-2 h-2 bg-black/5">
                  <div
                    className={`h-full ${bar}`}
                    style={{ width: `${fleet.length ? (Number(value) / fleet.length) * 100 : 0}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="mt-8 border border-black/10 bg-white p-5">
        <div className="flex items-end justify-between border-b border-black/10 pb-3">
          <div>
            <p className="font-aux text-[10px] font-semibold uppercase tracking-widest text-black/40">Movimento</p>
            <h2 className="mt-1 font-display text-sm font-bold uppercase tracking-wide text-black">
              Inspeções x problemas
            </h2>
          </div>
          <span className="font-aux text-[10px] uppercase text-black/40">Últimos 7 dias</span>
        </div>

        <div className="mt-6 grid grid-cols-7 gap-2 md:gap-4">
          {trend.map((day) => (
            <div key={day.label} className="flex min-w-0 flex-col items-center gap-2">
              <div className="flex h-36 w-full max-w-16 items-end justify-center gap-1 border-b border-black/10">
                <div
                  title={`${day.inspections} inspeções`}
                  className="w-2 bg-black/70"
                  style={{ height: `${Math.max(day.inspections ? 8 : 0, (day.inspections / maxTrend) * 100)}%` }}
                />
                <div
                  title={`${day.problems} problemas`}
                  className="w-2 bg-red"
                  style={{ height: `${Math.max(day.problems ? 8 : 0, (day.problems / maxTrend) * 100)}%` }}
                />
              </div>
              <span className="font-aux text-[10px] uppercase text-black/40">{day.label}</span>
            </div>
          ))}
        </div>
        <div className="mt-4 flex gap-5 font-aux text-[10px] uppercase tracking-wide text-black/50">
          <span><i className="mr-1 inline-block h-2 w-2 bg-black/70" /> Inspeções</span>
          <span><i className="mr-1 inline-block h-2 w-2 bg-red" /> Problemas</span>
        </div>
      </section>

      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-2">
        <section>
          <div className="flex items-center justify-between border-b border-black/10 pb-3">
            <h2 className="font-display text-sm font-bold uppercase tracking-wide text-black">Inspeções de hoje</h2>
            <Link href="/admin/checklists" className="font-aux text-xs font-semibold uppercase text-black/50 hover:text-black">
              Ver todos →
            </Link>
          </div>
          {recentChecklists.length === 0 ? (
            <div className="mt-4"><EmptyState title="Nenhuma inspeção hoje" description="Assim que um operador finalizar uma inspeção, ela aparece aqui." /></div>
          ) : (
            <div>
              {recentChecklists.map((c) => (
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
            <h2 className="font-display text-sm font-bold uppercase tracking-wide text-black">Problemas em aberto</h2>
            <Link href="/admin/nao-conformidades" className="font-aux text-xs font-semibold uppercase text-black/50 hover:text-black">
              Ver todas →
            </Link>
          </div>
          {openNCs.length === 0 ? (
            <div className="mt-4"><EmptyState title="Nenhuma ocorrência em aberto" description="Tudo tratado — bom trabalho." /></div>
          ) : (
            <div>
              {openNCs.map((nc) => (
                <div key={nc.id} className="flex items-center gap-3 border-b border-black/5 py-3">
                  <span className="font-sans text-sm font-semibold text-black">{nc.forklift.code}</span>
                  <span className="min-w-0 flex-1 truncate font-aux text-xs text-black/50">{nc.itemLabel}</span>
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
