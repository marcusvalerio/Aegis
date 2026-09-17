import Link from "next/link";
import { db } from "@/lib/db";
import { StatTile } from "@/components/ui/Card";
import { ForkliftStatusBadge, NonConformityStatusBadge } from "@/components/ui/StatusBadge";
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
  const comNC = todayChecklists.filter((c) => c.nonConformCount > 0).length;
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
      <p className="mt-1 font-aux text-sm text-black/60">
        {since.toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" })}
      </p>

      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatTile label="Realizados" value={realizados} />
        <StatTile label="Conformes" value={conformes} tone="green" />
        <StatTile label="Com não conformidade" value={comNC} tone="red" />
        <StatTile label="Bloqueados" value={bloqueados} tone="red" />
      </div>

      <div className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section>
          <div className="flex items-center justify-between">
            <h2 className="font-display text-sm font-bold uppercase tracking-wide text-black">
              Últimos checklists
            </h2>
            <Link href="/admin/checklists" className="font-aux text-xs font-semibold uppercase text-black/50 hover:text-black">
              Ver todos
            </Link>
          </div>
          <div className="mt-3 border border-black/10 bg-white">
            {todayChecklists.length === 0 && (
              <p className="p-6 text-center font-aux text-sm text-black/50">Nenhum checklist hoje ainda.</p>
            )}
            {todayChecklists.slice(0, 8).map((c) => (
              <Link
                key={c.id}
                href={`/admin/checklists/${c.id}`}
                className="flex items-center justify-between border-b border-black/5 px-4 py-3 last:border-0 hover:bg-tan/40"
              >
                <div>
                  <p className="font-sans text-sm font-semibold text-black">{c.forklift.code}</p>
                  <p className="font-aux text-xs text-black/50">
                    {c.operator.name} ·{" "}
                    {c.finishedAt?.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
                <ForkliftStatusBadge status={c.resultStatus as ForkliftStatus} />
              </Link>
            ))}
          </div>
        </section>

        <section>
          <div className="flex items-center justify-between">
            <h2 className="font-display text-sm font-bold uppercase tracking-wide text-black">
              Não conformidades em aberto
            </h2>
            <Link href="/admin/nao-conformidades" className="font-aux text-xs font-semibold uppercase text-black/50 hover:text-black">
              Ver todas
            </Link>
          </div>
          <div className="mt-3 border border-black/10 bg-white">
            {openNCs.length === 0 && (
              <p className="p-6 text-center font-aux text-sm text-black/50">Nenhuma ocorrência em aberto.</p>
            )}
            {openNCs.map((nc) => (
              <div key={nc.id} className="flex items-center justify-between border-b border-black/5 px-4 py-3 last:border-0">
                <div>
                  <p className="font-sans text-sm font-semibold text-black">
                    {nc.forklift.code} · {nc.itemLabel}
                  </p>
                  <p className="line-clamp-1 font-aux text-xs text-black/50">{nc.description}</p>
                </div>
                <NonConformityStatusBadge status={nc.status as "ABERTA" | "EM_TRATAMENTO" | "RESOLVIDA" | "CANCELADA"} />
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
