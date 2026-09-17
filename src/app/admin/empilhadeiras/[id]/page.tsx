import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { ForkliftGraphic } from "@/components/ForkliftGraphic";
import { ForkliftStatusBadge } from "@/components/ui/StatusBadge";
import { StatTile } from "@/components/ui/Card";
import { ForkliftForm } from "@/components/admin/ForkliftForm";
import { updateForkliftAction } from "@/lib/actions/forklifts";
import type { ForkliftStatus } from "@/lib/types";

export default async function ForkliftDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const forklift = await db.forklift.findUnique({
    where: { id },
    include: {
      forkliftType: true,
      energyType: true,
      checklists: {
        where: { status: "CONCLUIDO" },
        orderBy: { finishedAt: "desc" },
        include: { operator: true },
      },
      nonConformities: true,
      maintenanceOccurrences: true,
    },
  });

  if (!forklift) notFound();

  const [forkliftTypes, energyTypes] = await Promise.all([
    db.forkliftType.findMany({ orderBy: { name: "asc" } }),
    db.energyType.findMany({ orderBy: { name: "asc" } }),
  ]);

  const totalChecklists = forklift.checklists.length;
  const totalNCs = forklift.nonConformities.length;
  const totalBloqueios = forklift.checklists.filter((c) => c.resultStatus === "BLOQUEADA").length;

  return (
    <main className="p-6 md:p-10">
      <div className="flex flex-col gap-6 lg:flex-row">
        <div className="flex-1">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 shrink-0 bg-tan p-2 text-black">
              <ForkliftGraphic typeKey={forklift.forkliftType.key} />
            </div>
            <div>
              <h1 className="font-display text-2xl font-bold text-black">{forklift.code}</h1>
              <p className="font-aux text-sm text-black/60">{forklift.brand} {forklift.model}</p>
            </div>
            <div className="ml-auto">
              <ForkliftStatusBadge status={forklift.status as ForkliftStatus} />
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2 font-aux text-xs uppercase tracking-wide text-black/60">
            <span className="border border-black/15 px-2 py-1">{forklift.forkliftType.name}</span>
            <span className="border border-black/15 px-2 py-1">{forklift.energyType.name}</span>
            <span className="border border-black/15 px-2 py-1">{forklift.capacityKg.toLocaleString("pt-BR")} kg</span>
            <span className="border border-black/15 px-2 py-1">{forklift.hourmeter.toLocaleString("pt-BR")} h</span>
          </div>

          <div className="mt-6 grid grid-cols-3 gap-3">
            <StatTile label="Checklists" value={totalChecklists} />
            <StatTile label="Não conf." value={totalNCs} tone="red" />
            <StatTile label="Bloqueios" value={totalBloqueios} tone="red" />
          </div>

          <h2 className="mt-8 font-display text-sm font-bold uppercase tracking-wide text-black">
            Histórico de checklists
          </h2>
          <div className="mt-3 border border-black/10 bg-white">
            {forklift.checklists.length === 0 && (
              <p className="p-6 text-center font-aux text-sm text-black/50">Nenhum checklist realizado ainda.</p>
            )}
            {forklift.checklists.map((c) => (
              <Link
                key={c.id}
                href={`/admin/checklists/${c.id}`}
                className="flex items-center justify-between border-b border-black/5 px-4 py-3 last:border-0 hover:bg-tan/40"
              >
                <div>
                  <p className="font-sans text-sm font-semibold text-black">
                    {c.finishedAt?.toLocaleDateString("pt-BR")}
                  </p>
                  <p className="font-aux text-xs text-black/50">
                    {c.operator.name} · {c.nonConformCount} NC
                  </p>
                </div>
                <ForkliftStatusBadge status={c.resultStatus as ForkliftStatus} />
              </Link>
            ))}
          </div>
        </div>

        <div className="lg:w-[420px]">
          <h2 className="font-display text-sm font-bold uppercase tracking-wide text-black">
            Editar cadastro
          </h2>
          <div className="mt-3">
            <ForkliftForm
              forklift={forklift}
              forkliftTypes={forkliftTypes}
              energyTypes={energyTypes}
              action={updateForkliftAction.bind(null, forklift.id)}
              submitLabel="Salvar alterações"
            />
          </div>
        </div>
      </div>
    </main>
  );
}
