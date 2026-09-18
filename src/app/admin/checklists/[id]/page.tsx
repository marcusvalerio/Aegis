import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getSnapshot } from "@/lib/checklist-engine";
import { ForkliftStatusBadge, SeverityBadge } from "@/components/ui/StatusBadge";
import { Check, X, Minus } from "lucide-react";
import type { AnswerValue, ForkliftStatus, Severity } from "@/lib/types";
import { requireAdmin } from "@/lib/actions/admin-guard";

export default async function ChecklistDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await requireAdmin();
  const checklist = await db.checklist.findFirst({
    where: { id, organizationId: session.user.organizationId },
    include: {
      forklift: { include: { forkliftType: true, energyType: true } },
      operator: true,
      answers: { include: { nonConformity: { include: { attachments: true } } } },
    },
  });

  if (!checklist) notFound();

  const snapshot = getSnapshot(checklist);
  const answerByItemId = new Map(checklist.answers.map((a) => [a.snapshotItemId, a]));

  return (
    <main className="p-6 md:p-10">
      <p className="font-aux text-xs uppercase tracking-widest text-black/40">
        Checklist #{checklist.id.slice(0, 8).toUpperCase()}
      </p>
      <div className="mt-1 flex flex-wrap items-center gap-4">
        <h1 className="font-display text-2xl font-bold text-black">
          {checklist.forklift.code} — {checklist.forklift.brand} {checklist.forklift.model}
        </h1>
        {checklist.resultStatus && <ForkliftStatusBadge status={checklist.resultStatus as ForkliftStatus} />}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-4 border border-black/10 bg-white p-4 sm:grid-cols-4">
        <Info label="Operador" value={checklist.operator.name} />
        <Info
          label="Data"
          value={checklist.finishedAt?.toLocaleString("pt-BR") ?? "Em andamento"}
        />
        <Info label="Horímetro" value={`${checklist.hourmeter ?? "-"} h`} />
        <Info
          label="Resultado"
          value={`${checklist.conformCount} conf. / ${checklist.nonConformCount} NC / ${checklist.naCount} N/A`}
        />
      </div>

      <Link href={`/admin/empilhadeiras/${checklist.forkliftId}`} className="mt-2 inline-block font-aux text-xs text-black/50 hover:underline">
        Ver histórico completo de {checklist.forklift.code} →
      </Link>

      <div className="mt-8">
        {snapshot.categories.map((category, index) => (
          <section key={category.categoryId} className="mt-6">
            <div className="flex items-baseline gap-3 border-b-2 border-black pb-2">
              <span className="font-display text-xs font-bold text-black/40">
                {String(index + 1).padStart(2, "0")}
              </span>
              <h2 className="font-display text-base font-bold uppercase tracking-wide text-black">
                {category.name}
              </h2>
            </div>
            {category.items.map((item) => {
              const answer = answerByItemId.get(item.snapshotItemId);
              return (
                <div key={item.snapshotItemId} className="border-b border-black/5 py-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-sans text-sm font-semibold text-black">{item.label}</p>
                      <p className="mt-0.5 font-aux text-sm text-black/60">{item.question}</p>
                    </div>
                    <AnswerPill value={answer?.answer as AnswerValue | undefined} />
                  </div>

                  {answer?.nonConformity && (
                    <div className="mt-3 border border-red/30 bg-red/5 p-3">
                      <div className="flex items-center gap-2">
                        <SeverityBadge severity={answer.nonConformity.severity as Severity} />
                        <span className="font-aux text-xs text-black/50">
                          {answer.answeredAt.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                      <p className="mt-2 font-aux text-sm text-black/80">{answer.nonConformity.description}</p>
                      {answer.nonConformity.attachments.length > 0 && (
                        <div className="mt-2 flex gap-2">
                          {answer.nonConformity.attachments.map((att) => (
                            <a key={att.id} href={att.url} target="_blank" rel="noreferrer">
                              <Image
                                src={att.url}
                                alt="Foto da não conformidade"
                                width={80}
                                height={80}
                                unoptimized={/^https?:\/\//.test(att.url)}
                                className="border border-black/10 object-cover"
                              />
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </section>
        ))}
      </div>
    </main>
  );
}

function Info({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="font-aux text-[10px] uppercase tracking-widest text-black/40">{label}</p>
      <p className="mt-0.5 font-sans text-sm font-semibold text-black">{value}</p>
    </div>
  );
}

function AnswerPill({ value }: { value?: AnswerValue }) {
  if (value === "CONFORME")
    return <span className="flex shrink-0 items-center gap-1 bg-green px-2 py-1 text-[11px] font-bold uppercase text-black"><Check size={12} /> Conforme</span>;
  if (value === "NAO_CONFORME")
    return <span className="flex shrink-0 items-center gap-1 bg-red px-2 py-1 text-[11px] font-bold uppercase text-white"><X size={12} /> Não conforme</span>;
  if (value === "NA")
    return <span className="flex shrink-0 items-center gap-1 bg-black px-2 py-1 text-[11px] font-bold uppercase text-white"><Minus size={12} /> N/A</span>;
  return null;
}
