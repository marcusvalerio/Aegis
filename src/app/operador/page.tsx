import { db } from "@/lib/db";
import { requireTenantSession } from "@/lib/tenant";
import { ForkliftMedia } from "@/components/ForkliftMedia";
import { resolveForkliftImageUrl } from "@/lib/supabase-storage";
import { ForkliftStatusBadge } from "@/components/ui/StatusBadge";
import { startChecklistAction } from "@/lib/actions/checklist";
import { QrCode } from "lucide-react";
import type { ForkliftStatus } from "@/lib/types";

export default async function SelecionarEquipamentoPage() {
  const session = await requireTenantSession();
  const forklifts = await db.forklift.findMany({
    where: { active: true, organizationId: session.user.organizationId },
    include: { forkliftType: true, energyType: true },
    orderBy: { code: "asc" },
  });

  const forkliftsWithImages = await Promise.all(
    forklifts.map(async (forklift) => ({
      ...forklift,
      imageUrl: await resolveForkliftImageUrl(forklift.imageUrl, session.user.organizationId),
    })),
  );

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold uppercase tracking-tight text-black">
            Selecione o equipamento
          </h1>
          <p className="mt-1 font-aux text-sm text-black/60">
            Toque em um equipamento para iniciar a inspeção.
          </p>
        </div>
        <button
          disabled
          title="Disponível em breve"
          aria-disabled="true"
          className="flex shrink-0 items-center gap-1.5 border border-black/15 px-3 py-2 font-aux text-xs font-semibold uppercase text-black/40"
        >
          <QrCode size={14} aria-hidden="true" /> QR Code
        </button>
      </div>

      {forklifts.length === 0 ? (
        <div className="mt-10 border border-dashed border-black/20 p-12 text-center">
          <p className="font-display text-lg font-semibold text-black">Nenhum equipamento disponível</p>
          <p className="mt-1 font-aux text-sm text-black/50">
            Fale com a administração para cadastrar uma empilhadeira.
          </p>
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {forkliftsWithImages.map((f) => (
            <div key={f.id} className="animate-rise-in flex flex-col border border-black/10 bg-white">
              <div className="relative h-40 bg-tan">
                <ForkliftMedia
                  imageUrl={
                    f.imageUrl ??
                    (f.code === "EMP-001"
                      ? "https://media-live2.prod.scw.jungheinrichcloud.com/resource/image/103962/portrait_ratio1x1/750/750/92932f3f2fdd70eafea033ced146f9d5/614761D0CD0B84A6661542C60285F007/stage-etv-etm-214-216.jpg"
                      : null)
                  }
                  typeKey={f.forkliftType.key}
                  alt={`${f.brand} ${f.model}`}
                  fit="contain"
                  className="absolute inset-4 text-black/80"
                />
              </div>
              <div className="flex flex-1 flex-col p-4">
                <span className="font-display text-xl font-extrabold tracking-tight text-black">
                  {f.code}
                </span>
                <p className="mt-0.5 font-sans text-sm font-semibold uppercase text-black/70">
                  {f.brand} {f.model}
                </p>

                <div className="mt-3 flex flex-wrap gap-1.5">
                  <span className="border border-black/15 px-2 py-0.5 font-aux text-[10px] font-medium uppercase tracking-wide text-black/60">
                    {f.forkliftType.name}
                  </span>
                  <span className="border border-black/15 px-2 py-0.5 font-aux text-[10px] font-medium uppercase tracking-wide text-black/60">
                    {f.energyType.name}
                  </span>
                </div>

                <p className="mt-3 font-display text-lg font-bold text-black">
                  {f.capacityKg.toLocaleString("pt-BR")} <span className="text-sm font-semibold text-black/50">kg</span>
                </p>

                <div className="mt-auto flex items-center justify-between gap-3 pt-4">
                  <ForkliftStatusBadge status={f.status as ForkliftStatus} />
                  <form action={startChecklistAction.bind(null, f.id)}>
                    <button
                      type="submit"
                      className="bg-yellow px-5 py-3 font-sans text-xs font-bold uppercase tracking-wide text-black transition-transform hover:-translate-y-0.5"
                    >
                      Selecionar
                    </button>
                  </form>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
