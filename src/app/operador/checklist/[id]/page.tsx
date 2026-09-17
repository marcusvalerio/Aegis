import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getSnapshot, countSnapshotItems } from "@/lib/checklist-engine";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { ChecklistItemCard } from "@/components/checklist/ChecklistItemCard";
import { finalizeChecklistAction } from "@/lib/actions/checklist";
import type { AnswerValue, Severity } from "@/lib/types";

export default async function ChecklistRuntimePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) redirect("/login");

  const checklist = await db.checklist.findUnique({
    where: { id },
    include: {
      forklift: { include: { forkliftType: true, energyType: true } },
      answers: { include: { nonConformity: { include: { attachments: true } } } },
    },
  });

  if (!checklist) notFound();
  if (checklist.operatorId !== session.user.id && session.user.role !== "ADMIN") notFound();

  if (checklist.status === "CONCLUIDO") {
    redirect(`/operador/checklist/${checklist.id}/resultado`);
  }

  const snapshot = getSnapshot(checklist);
  const totalItems = countSnapshotItems(snapshot);
  const answeredCount = checklist.answers.length;

  const answerByItemId = new Map(checklist.answers.map((a) => [a.snapshotItemId, a]));

  return (
    <main className="mx-auto max-w-2xl pb-28">
      <div className="border-b border-black/10 bg-white px-4 py-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-display text-lg font-bold text-black">{checklist.forklift.code}</p>
            <p className="font-aux text-xs text-black/60">
              {checklist.forklift.brand} {checklist.forklift.model} · {snapshot.energyTypeName}
            </p>
          </div>
          <div className="text-right">
            <p className="font-aux text-[11px] uppercase tracking-widest text-black/40">Checklist</p>
            <p className="font-display text-sm font-bold text-black">{totalItems} itens</p>
          </div>
        </div>
        <div className="mt-3">
          <ProgressBar value={answeredCount} total={totalItems} />
        </div>
      </div>

      <div className="px-4">
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
            <div>
              {category.items.map((item) => {
                const existingAnswer = answerByItemId.get(item.snapshotItemId);
                return (
                  <ChecklistItemCard
                    key={item.snapshotItemId}
                    checklistId={checklist.id}
                    categoryName={category.name}
                    item={item}
                    currentAnswer={existingAnswer?.answer as AnswerValue | undefined}
                    currentAnswerId={existingAnswer?.id}
                    existingNonConformity={
                      existingAnswer?.nonConformity
                        ? {
                            description: existingAnswer.nonConformity.description,
                            severity: existingAnswer.nonConformity.severity as Severity,
                          }
                        : undefined
                    }
                  />
                );
              })}
            </div>
          </section>
        ))}
      </div>

      <div className="fixed bottom-0 left-0 right-0 border-t border-black/10 bg-white p-4">
        <form action={finalizeChecklistAction.bind(null, checklist.id)} className="mx-auto max-w-2xl">
          <button
            type="submit"
            disabled={answeredCount < totalItems}
            className="w-full bg-black py-4 font-sans text-sm font-bold uppercase tracking-wide text-white disabled:opacity-30"
          >
            {answeredCount < totalItems
              ? `Responda todos os itens (${answeredCount}/${totalItems})`
              : "Finalizar checklist"}
          </button>
        </form>
      </div>
    </main>
  );
}
