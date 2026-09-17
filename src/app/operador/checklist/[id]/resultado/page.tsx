import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { CheckCircle2, AlertTriangle } from "lucide-react";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { ForkliftStatusBadge } from "@/components/ui/StatusBadge";
import type { ForkliftStatus } from "@/lib/types";

export default async function ChecklistResultPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) redirect("/login");

  const checklist = await db.checklist.findUnique({
    where: { id },
    include: { forklift: true, operator: true },
  });

  if (!checklist) notFound();
  if (checklist.operatorId !== session.user.id && session.user.role !== "ADMIN") notFound();
  if (checklist.status !== "CONCLUIDO") redirect(`/operador/checklist/${checklist.id}`);

  const isClean = checklist.nonConformCount === 0;
  const bg = isClean ? "bg-green" : "bg-red";
  const fg = isClean ? "text-black" : "text-white";

  return (
    <main className={`flex min-h-[calc(100vh-52px)] flex-col items-center justify-center px-6 py-12 text-center ${bg} ${fg}`}>
      {isClean ? <CheckCircle2 size={56} strokeWidth={1.5} /> : <AlertTriangle size={56} strokeWidth={1.5} />}

      <h1 className="mt-6 font-display text-3xl font-extrabold uppercase tracking-tight">
        Checklist concluído
      </h1>
      <p className="mt-2 font-aux text-sm opacity-80">
        {isClean ? "Equipamento liberado" : "Não conformidades identificadas"}
      </p>

      <div className="mt-8 w-full max-w-sm border border-current/20 bg-black/5 p-6">
        <p className="font-display text-4xl font-bold">
          {checklist.conformCount} / {checklist.totalItems}
        </p>
        <p className="font-aux text-xs uppercase tracking-widest opacity-70">itens conformes</p>

        <div className="mt-4 grid grid-cols-3 gap-3 border-t border-current/20 pt-4 text-left">
          <div>
            <p className="font-display text-xl font-bold">{checklist.conformCount}</p>
            <p className="font-aux text-[10px] uppercase tracking-wide opacity-70">Conformes</p>
          </div>
          <div>
            <p className="font-display text-xl font-bold">{checklist.nonConformCount}</p>
            <p className="font-aux text-[10px] uppercase tracking-wide opacity-70">Não conf.</p>
          </div>
          <div>
            <p className="font-display text-xl font-bold">{checklist.naCount}</p>
            <p className="font-aux text-[10px] uppercase tracking-wide opacity-70">N/A</p>
          </div>
        </div>
      </div>

      <div className="mt-6 flex items-center gap-2 font-aux text-xs uppercase tracking-widest opacity-80">
        Status do equipamento
        <ForkliftStatusBadge status={checklist.resultStatus as ForkliftStatus} />
      </div>

      <p className="mt-6 font-aux text-xs opacity-70">
        {checklist.forklift.code} · {new Date(checklist.finishedAt ?? checklist.startedAt).toLocaleString("pt-BR")}
        <br />
        Operador: {checklist.operator.name}
      </p>

      <Link
        href="/operador"
        className="mt-8 border border-current px-6 py-3 font-sans text-xs font-bold uppercase tracking-wide"
      >
        Finalizar
      </Link>
    </main>
  );
}
