import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { ForkliftMedia } from "@/components/ForkliftMedia";
import { resolveForkliftImageUrl } from "@/lib/supabase-storage";
import { ForkliftStatusBadge, SeverityBadge, NonConformityStatusBadge } from "@/components/ui/StatusBadge";
import { Metric, MetricRow } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { ForkliftForm } from "@/components/admin/ForkliftForm";
import { updateForkliftAction } from "@/lib/actions/forklifts";
import { Settings2 } from "lucide-react";
import type { ForkliftStatus, NonConformityStatus, Severity } from "@/lib/types";
import { requireAdmin } from "@/lib/actions/admin-guard";

export default async function ForkliftDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await requireAdmin();
  const forklift = await db.forklift.findFirst({
    where: { id, organizationId: session.user.organizationId },
    include: {
      forkliftType: true,
      energyType: true,
      checklists: {
        where: { status: "CONCLUIDO" },
        orderBy: { finishedAt: "desc" },
        include: { operator: true },
      },
      nonConformities: { orderBy: { createdAt: "desc" } },
      maintenanceOccurrences: { orderBy: { createdAt: "desc" } },
    },
  });

  if (!forklift) notFound();

  const resolvedImageUrl = await resolveForkliftImageUrl(
    forklift.imageUrl,
    session.user.organizationId,
  );

  const [forkliftTypes, energyTypes] = await Promise.all([
    db.forkliftType.findMany({ orderBy: { name: "asc" } }),
    db.energyType.findMany({ orderBy: { name: "asc" } }),
  ]);

  const totalChecklists = forklift.checklists.length;
  const totalNCs = forklift.nonConformities.length;
  const totalBloqueios = forklift.checklists.filter((c) => c.resultStatus === "BLOQUEADA").length;
  const lastChecklist = forklift.checklists[0];

  return (
    <main className="p-6 md:p-10">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
        <div className="flex flex-1 items-center gap-4">
          <div className="h-20 w-20 shrink-0 border border-black/10 bg-tan">
            <ForkliftMedia
              imageUrl={forklift.imageUrl}
              typeKey={forklift.forkliftType.key}
              alt={`${forklift.brand} ${forklift.model}`}
              fit="contain"
              className="h-full w-full p-2 text-black/70"
            />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold text-black">{forklift.code}</h1>
            <p className="font-aux text-sm text-black/60">{forklift.brand} {forklift.model}</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              <span className="border border-black/15 px-2 py-0.5 font-aux text-[10px] font-medium uppercase tracking-wide text-black/60">
                {forklift.forkliftType.name}
              </span>
              <span className="border border-black/15 px-2 py-0.5 font-aux text-[10px] font-medium uppercase tracking-wide text-black/60">
                {forklift.energyType.name}
              </span>
              <span className="border border-black/15 px-2 py-0.5 font-aux text-[10px] font-medium uppercase tracking-wide text-black/60">
                {forklift.capacityKg.toLocaleString("pt-BR")} kg
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <ForkliftStatusBadge status={forklift.status as ForkliftStatus} />
          <details className="group relative">
            <summary className="flex cursor-pointer list-none items-center gap-2 border border-black/20 px-3 py-2 font-aux text-xs font-semibold uppercase text-black/70 hover:border-black/40">
              <Settings2 size={14} aria-hidden="true" /> Editar cadastro
            </summary>
            <div className="absolute right-0 z-20 mt-2 w-[380px] border border-black/10 bg-white p-5 shadow-lg">
              <ForkliftForm
                forklift={forklift}
                forkliftTypes={forkliftTypes}
                energyTypes={energyTypes}
                action={updateForkliftAction.bind(null, forklift.id)}
                submitLabel="Salvar alterações"
              />
            </div>
          </details>
        </div>
      </div>

      <div className="mt-8">
        <MetricRow>
          <Metric label="Checklists" value={totalChecklists} />
          <Metric label="Não conformidades" value={totalNCs} tone={totalNCs > 0 ? "red" : "black"} />
          <Metric label="Bloqueios" value={totalBloqueios} tone={totalBloqueios > 0 ? "red" : "black"} />
          <Metric label="Horímetro" value={`${forklift.hourmeter.toLocaleString("pt-BR")}h`} />
        </MetricRow>
      </div>

      <section className="mt-10">
        <h2 className="border-b border-black/10 pb-3 font-display text-sm font-bold uppercase tracking-wide text-black">
          Último checklist
        </h2>
        {lastChecklist ? (
          <Link
            href={`/admin/checklists/${lastChecklist.id}`}
            className="mt-4 flex items-center justify-between gap-4 border border-black/10 bg-white p-4 transition-colors hover:bg-tan/30"
          >
            <div>
              <p className="font-sans text-sm font-semibold text-black">
                {lastChecklist.finishedAt?.toLocaleString("pt-BR")}
              </p>
              <p className="font-aux text-xs text-black/50">
                {lastChecklist.operator.name} · {lastChecklist.conformCount}/{lastChecklist.totalItems} conformes
              </p>
            </div>
            <ForkliftStatusBadge status={lastChecklist.resultStatus as ForkliftStatus} />
          </Link>
        ) : (
          <div className="mt-4">
            <EmptyState title="Nenhum checklist realizado ainda" />
          </div>
        )}
      </section>

      <section className="mt-10">
        <h2 className="border-b border-black/10 pb-3 font-display text-sm font-bold uppercase tracking-wide text-black">
          Histórico de checklists
        </h2>
        {forklift.checklists.length === 0 ? (
          <div className="mt-4">
            <EmptyState title="Sem histórico" description="Os checklists finalizados aparecerão aqui." />
          </div>
        ) : (
          <div className="mt-2">
            {forklift.checklists.map((c) => (
              <Link
                key={c.id}
                href={`/admin/checklists/${c.id}`}
                className="flex items-center gap-3 border-b border-black/5 py-3 transition-colors hover:bg-tan/40"
              >
                <span className="font-aux text-xs tabular-nums text-black/40">
                  {c.finishedAt?.toLocaleDateString("pt-BR")}
                </span>
                <span className="font-aux text-xs text-black/50">{c.operator.name}</span>
                <span className="font-aux text-xs text-black/50">{c.nonConformCount} NC</span>
                <ForkliftStatusBadge status={c.resultStatus as ForkliftStatus} />
              </Link>
            ))}
          </div>
        )}
      </section>

      <section className="mt-10">
        <h2 className="border-b border-black/10 pb-3 font-display text-sm font-bold uppercase tracking-wide text-black">
          Não conformidades
        </h2>
        {forklift.nonConformities.length === 0 ? (
          <div className="mt-4">
            <EmptyState title="Nenhuma não conformidade registrada" />
          </div>
        ) : (
          <div className="mt-2">
            {forklift.nonConformities.map((nc) => (
              <div key={nc.id} className="flex items-center gap-3 border-b border-black/5 py-3">
                <span className="font-aux text-xs tabular-nums text-black/40">
                  {nc.createdAt.toLocaleDateString("pt-BR")}
                </span>
                <span className="flex-1 truncate font-sans text-sm text-black/80">{nc.itemLabel}</span>
                <SeverityBadge severity={nc.severity as Severity} />
                <NonConformityStatusBadge status={nc.status as NonConformityStatus} />
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="mt-10">
        <h2 className="border-b border-black/10 pb-3 font-display text-sm font-bold uppercase tracking-wide text-black">
          Manutenção
        </h2>
        {forklift.maintenanceOccurrences.length === 0 ? (
          <div className="mt-4">
            <EmptyState
              title="Nenhuma ocorrência de manutenção"
              description="Ocorrências críticas ou de alta gravidade geram um registro aqui automaticamente."
            />
          </div>
        ) : (
          <div className="mt-2">
            {forklift.maintenanceOccurrences.map((m) => (
              <div key={m.id} className="flex items-center gap-3 border-b border-black/5 py-3">
                <span className="font-aux text-xs tabular-nums text-black/40">
                  {m.createdAt.toLocaleDateString("pt-BR")}
                </span>
                <span className="flex-1 truncate font-sans text-sm text-black/80">{m.description}</span>
                <span className="font-aux text-[10px] font-semibold uppercase text-black/50">{m.status}</span>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
