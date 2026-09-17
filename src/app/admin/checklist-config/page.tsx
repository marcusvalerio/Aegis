import { db } from "@/lib/db";
import { createCategoryAction, createItemAction } from "@/lib/actions/templates";
import { ItemActiveToggle, CategoryActiveToggle } from "@/components/admin/TemplateToggles";
import { SeverityBadge } from "@/components/ui/StatusBadge";
import type { Severity } from "@/lib/types";

export default async function ChecklistConfigPage() {
  const [categories, forkliftTypes, energyTypes] = await Promise.all([
    db.checklistCategory.findMany({
      orderBy: { order: "asc" },
      include: {
        items: {
          orderBy: { order: "asc" },
          include: { typeLinks: { include: { forkliftType: true } }, energyLinks: { include: { energyType: true } } },
        },
      },
    }),
    db.forkliftType.findMany({ orderBy: { name: "asc" } }),
    db.energyType.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <main className="p-6 md:p-10">
      <h1 className="font-display text-2xl font-bold uppercase tracking-tight text-black">
        Configuração do checklist
      </h1>
      <p className="mt-1 max-w-2xl font-aux text-sm text-black/60">
        O checklist de cada equipamento é montado automaticamente a partir daqui:{" "}
        <strong className="font-semibold text-black">checklist-base</strong> +{" "}
        <strong className="font-semibold text-black">perguntas personalizadas</strong> +{" "}
        <strong className="font-semibold text-black">regras condicionais</strong> por
        tipo de empilhadeira ou energia. Checklists já finalizados não são afetados
        por mudanças futuras — o snapshot de cada inspeção é preservado.
      </p>

      <div className="mt-8 grid grid-cols-1 gap-8 xl:grid-cols-[1fr_360px]">
        <div>
          {categories.map((category, index) => (
            <section key={category.id} className="mt-6 border border-black/10 bg-white">
              <div className="flex items-center justify-between border-b border-black/10 px-4 py-3">
                <h2 className="font-display text-sm font-bold uppercase tracking-wide text-black">
                  {String(index + 1).padStart(2, "0")} · {category.name}
                </h2>
                <CategoryActiveToggle id={category.id} active={category.active} />
              </div>
              <div className="divide-y divide-black/5">
                {category.items.map((item) => (
                  <div key={item.id} className="flex items-start justify-between gap-4 px-4 py-3">
                    <div>
                      <p className="font-sans text-sm font-semibold text-black">{item.label}</p>
                      <p className="mt-0.5 font-aux text-xs text-black/60">{item.question}</p>
                      <div className="mt-2 flex flex-wrap items-center gap-1.5">
                        <SeverityBadge severity={item.defaultSeverity as Severity} />
                        {item.appliesToAllTypes && item.appliesToAllEnergies ? (
                          <span className="border border-black/15 px-1.5 py-0.5 font-aux text-[10px] font-medium uppercase tracking-wide text-black/40">
                            Todos os equipamentos
                          </span>
                        ) : (
                          <>
                            {!item.appliesToAllTypes &&
                              item.typeLinks.map((l) => (
                                <span
                                  key={l.id}
                                  className="border border-yellow bg-yellow/20 px-1.5 py-0.5 font-aux text-[10px] font-semibold uppercase tracking-wide text-black/80"
                                >
                                  Se tipo = {l.forkliftType.name}
                                </span>
                              ))}
                            {!item.appliesToAllEnergies &&
                              item.energyLinks.map((l) => (
                                <span
                                  key={l.id}
                                  className="border border-yellow bg-yellow/20 px-1.5 py-0.5 font-aux text-[10px] font-semibold uppercase tracking-wide text-black/80"
                                >
                                  Se energia = {l.energyType.name}
                                </span>
                              ))}
                          </>
                        )}
                        {item.requiresPhoto === "OBRIGATORIA_NC" && (
                          <span className="border border-black/15 px-1.5 py-0.5 font-aux text-[10px] uppercase text-black/50">
                            Foto obrigatória em NC
                          </span>
                        )}
                      </div>
                    </div>
                    <ItemActiveToggle id={item.id} active={item.active} />
                  </div>
                ))}
                {category.items.length === 0 && (
                  <p className="px-4 py-4 font-aux text-sm text-black/40">Nenhuma pergunta nesta categoria.</p>
                )}
              </div>
            </section>
          ))}

          <form action={createCategoryAction} className="mt-6 flex gap-2">
            <input name="name" required placeholder="Nova categoria" className="input" />
            <button type="submit" className="shrink-0 bg-black px-4 py-2.5 font-sans text-xs font-bold uppercase text-white">
              Adicionar categoria
            </button>
          </form>
        </div>

        <aside className="sticky top-6 h-fit border border-black/10 bg-white p-5">
          <h2 className="font-display text-sm font-bold uppercase tracking-wide text-black">
            Nova pergunta
          </h2>
          <form action={createItemAction} className="mt-4 flex flex-col gap-3">
            <select name="categoryId" required className="input">
              <option value="">Categoria</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <input name="label" required placeholder="Rótulo (ex.: Cinto de segurança)" className="input" />
            <textarea name="question" required rows={2} placeholder="Pergunta exibida ao operador" className="input" />

            <select name="defaultSeverity" defaultValue="MEDIA" className="input">
              <option value="BAIXA">Gravidade padrão: Baixa</option>
              <option value="MEDIA">Gravidade padrão: Média</option>
              <option value="ALTA">Gravidade padrão: Alta</option>
              <option value="CRITICA">Gravidade padrão: Crítica</option>
            </select>

            <select name="requiresPhoto" defaultValue="OPCIONAL" className="input">
              <option value="NUNCA">Foto: nunca</option>
              <option value="OPCIONAL">Foto: opcional em NC</option>
              <option value="OBRIGATORIA_NC">Foto: obrigatória em NC</option>
            </select>

            <label className="flex items-center gap-2 font-aux text-xs text-black/70">
              <input type="checkbox" name="requiresNote" defaultChecked /> Observação obrigatória em NC
            </label>

            <div>
              <p className="font-aux text-xs font-medium uppercase text-black/60">
                Aplicável a tipos (vazio = todos)
              </p>
              <div className="mt-1.5 flex flex-col gap-1">
                {forkliftTypes.map((t) => (
                  <label key={t.id} className="flex items-center gap-2 font-aux text-xs text-black/70">
                    <input type="checkbox" name="forkliftTypeIds" value={t.id} /> {t.name}
                  </label>
                ))}
              </div>
            </div>

            <div>
              <p className="font-aux text-xs font-medium uppercase text-black/60">
                Aplicável a energias (vazio = todas)
              </p>
              <div className="mt-1.5 flex flex-col gap-1">
                {energyTypes.map((t) => (
                  <label key={t.id} className="flex items-center gap-2 font-aux text-xs text-black/70">
                    <input type="checkbox" name="energyTypeIds" value={t.id} /> {t.name}
                  </label>
                ))}
              </div>
            </div>

            <button type="submit" className="mt-2 bg-yellow py-2.5 font-sans text-xs font-bold uppercase text-black">
              Adicionar pergunta
            </button>
          </form>
        </aside>
      </div>
    </main>
  );
}
