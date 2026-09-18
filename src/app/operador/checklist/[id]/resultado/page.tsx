import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { CheckCircle2, AlertTriangle } from "lucide-react";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { ForkliftMedia } from "@/components/ForkliftMedia";
import { ForkliftStatusBadge } from "@/components/ui/StatusBadge";
import type { ForkliftStatus } from "@/lib/types";

export default async function ChecklistResultPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.organizationId) redirect("/login");

  const checklist = await db.checklist.findFirst({
    where: { id, organizationId: session.user.organizationId },
    include: { forklift: { include: { forkliftType: true } }, operator: true },
  });

  if (!checklist) notFound();
  if (checklist.operatorId !== session.user.id && session.user.role !== "ADMIN") notFound();
  if (checklist.status !== "CONCLUIDO") redirect(`/operador/checklist/${checklist.id}`);

  const isClean = checklist.nonConformCount === 0;
  const bg = isClean ? "bg-green" : "bg-red";
  const fg = isClean ? "text-black" : "text-white";

  return (
    <main
      className={`flex min-h-[calc(100vh-52px)] flex-col items-center justify-center px-6 py-12 text-center ${bg} ${fg}`}
    >
      <div className="animate-pop-in">
        {isClean ? (
          <CheckCircle2 size={64} strokeWidth={1.25} />
        ) : (
          <AlertTriangle size={64} strokeWidth={1.25} />
        )}
      </div>

      <p className="animate-fade-in mt-6 font-aux text-xs font-semibold uppercase tracking-[0.3em] opacity-70">
        Checklist concluído
      </p>
      <h1 className="animate-rise-in mt-2 font-display text-3xl font-extrabold uppercase leading-tight tracking-tight sm:text-4xl">
        {isClean ? "Equipamento liberado" : "Não conformidades identificadas"}
      </h1>

      <div className="animate-rise-in mt-8 w-full max-w-sm border border-current/25 bg-black/5 p-6">
        <div className="flex items-center gap-3 border-b border-current/15 pb-4">
          <div className="h-10 w-10 shrink-0 border border-current/20 bg-black/10">
            <ForkliftMedia
              imageUrl={checklist.forklift.imageUrl}
              typeKey={checklist.forklift.forkliftType.key}
              alt={checklist.forklift.code}
              fit="contain"
              className="h-full w-full p-1"
            />
          </div>
          <div className="text-left">
            <p className="font-display text-sm font-bold">{checklist.forklift.code}</p>
            <p className="font-aux text-xs opacity-60">
              {checklist.forklift.brand} {checklist.forklift.model}
            </p>
          </div>
          <p className="ml-auto font-display text-2xl font-bold tabular-nums">
            {checklist.conformCount}/{checklist.totalItems}
          </p>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-3 text-left">
          <div>
            <p className="font-display text-xl font-bold tabular-nums">{checklist.conformCount}</p>
            <p className="font-aux text-[10px] uppercase tracking-wide opacity-60">Conformes</p>
          </div>
          <div>
            <p className="font-display text-xl font-bold tabular-nums">{checklist.nonConformCount}</p>
            <p className="font-aux text-[10px] uppercase tracking-wide opacity-60">Não conf.</p>
          </div>
          <div>
            <p className="font-display text-xl font-bold tabular-nums">{checklist.naCount}</p>
            <p className="font-aux text-[10px] uppercase tracking-wide opacity-60">N/A</p>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between border-t border-current/15 pt-4">
          <span className="font-aux text-xs font-semibold uppercase tracking-widest opacity-70">
            Status do equipamento
          </span>
          <ForkliftStatusBadge status={checklist.resultStatus as ForkliftStatus} />
        </div>
      </div>

      <p className="mt-6 font-aux text-xs opacity-70">
        {new Date(checklist.finishedAt ?? checklist.startedAt).toLocaleString("pt-BR")} ·{" "}
        {checklist.operator.name}
      </p>

      <Link
        href="/operador"
        className="mt-8 border border-current px-6 py-3 font-sans text-xs font-bold uppercase tracking-wide transition-transform hover:-translate-y-0.5"
      >
        Nova inspeção
      </Link>
    </main>
  );
}
