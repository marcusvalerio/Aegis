import { db } from "@/lib/db";
import { ForkliftGraphic } from "@/components/ForkliftGraphic";
import { ForkliftStatusBadge } from "@/components/ui/StatusBadge";
import { startChecklistAction } from "@/lib/actions/checklist";
import { QrCode } from "lucide-react";
import type { ForkliftStatus } from "@/lib/types";

export default async function SelecionarEquipamentoPage() {
  const forklifts = await db.forklift.findMany({
    where: { active: true },
    include: { forkliftType: true, energyType: true },
    orderBy: { code: "asc" },
  });

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold uppercase tracking-tight text-black">
          Selecione o equipamento
        </h1>
        <button
          disabled
          title="Disponível em breve"
          className="flex items-center gap-1.5 border border-black/20 px-3 py-2 font-aux text-xs font-semibold uppercase text-black/40"
        >
          <QrCode size={14} /> Escanear QR Code
        </button>
      </div>
      <p className="mt-1 font-aux text-sm text-black/60">
        Toque em um equipamento para iniciar a inspeção.
      </p>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {forklifts.map((f) => (
          <div key={f.id} className="flex flex-col border border-black/10 bg-white">
            <div className="flex h-32 items-center justify-center bg-tan p-4">
              <div className="h-full w-full text-black">
                <ForkliftGraphic typeKey={f.forkliftType.key} />
              </div>
            </div>
            <div className="flex flex-1 flex-col p-4">
              <div className="flex items-start justify-between">
                <span className="font-display text-lg font-bold text-black">{f.code}</span>
                <ForkliftStatusBadge status={f.status as ForkliftStatus} />
              </div>
              <p className="mt-0.5 font-aux text-sm text-black/70">
                {f.brand} {f.model}
              </p>
              <p className="mt-2 font-aux text-xs uppercase tracking-wide text-black/50">
                {f.forkliftType.name}
              </p>
              <p className="font-aux text-xs uppercase tracking-wide text-black/50">
                {f.energyType.name}
              </p>
              <p className="mt-2 font-display text-sm font-bold text-black">
                {f.capacityKg.toLocaleString("pt-BR")} KG
              </p>

              <form action={startChecklistAction.bind(null, f.id)} className="mt-4">
                <button
                  type="submit"
                  className="w-full bg-yellow py-3 font-sans text-xs font-bold uppercase tracking-wide text-black hover:bg-yellow/90"
                >
                  Selecionar
                </button>
              </form>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
