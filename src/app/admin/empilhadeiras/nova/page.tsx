import { db } from "@/lib/db";
import { ForkliftForm } from "@/components/admin/ForkliftForm";
import { createForkliftAction } from "@/lib/actions/forklifts";

export default async function NovaEmpilhadeiraPage() {
  const [forkliftTypes, energyTypes] = await Promise.all([
    db.forkliftType.findMany({ where: { active: true }, orderBy: { name: "asc" } }),
    db.energyType.findMany({ where: { active: true }, orderBy: { name: "asc" } }),
  ]);

  return (
    <main className="p-6 md:p-10">
      <h1 className="font-display text-2xl font-bold uppercase tracking-tight text-black">
        Cadastrar empilhadeira
      </h1>
      <p className="mt-1 font-aux text-sm text-black/60">
        Defina tipo e energia — o checklist correto será montado automaticamente para este equipamento.
      </p>
      <div className="mt-6">
        <ForkliftForm
          forkliftTypes={forkliftTypes}
          energyTypes={energyTypes}
          action={createForkliftAction}
          submitLabel="Cadastrar equipamento"
        />
      </div>
    </main>
  );
}
