import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/actions/admin-guard";
import { createOperatorAction } from "@/lib/actions/users";
import { UserActiveToggle } from "@/components/admin/UserActiveToggle";

export default async function UsuariosPage() {
  const session = await requireAdmin();
  const [organization, users] = await Promise.all([
    db.organization.findUnique({ where: { id: session.user.organizationId } }),
    db.user.findMany({
      where: { organizationId: session.user.organizationId },
      orderBy: [{ role: "asc" }, { name: "asc" }],
    }),
  ]);

  return (
    <main className="p-6 md:p-10">
      <p className="font-aux text-xs uppercase tracking-widest text-black/40">Acessos da empresa</p>
      <h1 className="mt-1 font-display text-2xl font-bold uppercase tracking-tight text-black">
        Usuários e acessos
      </h1>
      <p className="mt-1 font-aux text-sm text-black/60">
        {organization?.name ?? "Empresa"} · Administradores e operadores desta empresa.
      </p>

      <div className="mt-8 grid grid-cols-1 gap-8 xl:grid-cols-[1fr_380px]">
        <section className="border border-black/10 bg-white">
          <div className="border-b border-black/10 px-4 py-3">
            <h2 className="font-display text-sm font-bold uppercase tracking-wide text-black">Usuários</h2>
          </div>
          <div className="divide-y divide-black/5">
            {users.map((user) => (
              <div key={user.id} className="flex items-center justify-between gap-4 px-4 py-4">
                <div className="min-w-0">
                  <p className="font-sans text-sm font-semibold text-black">{user.name}</p>
                  <p className="truncate font-aux text-xs text-black/50">{user.email}</p>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <span className="border border-black/15 px-2 py-1 font-aux text-[10px] font-semibold uppercase tracking-wide text-black/60">
                    {user.role === "ADMIN" ? "Administrador" : "Operador"}
                  </span>
                  {user.role === "OPERADOR" ? (
                    <UserActiveToggle id={user.id} active={user.active} />
                  ) : (
                    <span className="font-aux text-[10px] uppercase text-green">Ativo</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="border border-black/10 bg-white p-5">
          <h2 className="font-display text-sm font-bold uppercase tracking-wide text-black">Novo operador</h2>
          <p className="mt-1 font-aux text-xs leading-relaxed text-black/50">
            O operador receberá acesso somente aos equipamentos, inspeções e ocorrências desta empresa.
          </p>
          <form action={createOperatorAction} className="mt-5 flex flex-col gap-4">
            <Field label="Nome">
              <input name="name" required className="input" />
            </Field>
            <Field label="E-mail">
              <input type="email" name="email" required className="input" />
            </Field>
            <Field label="Senha">
              <input type="password" name="password" required minLength={12} autoComplete="new-password" className="input" />
              <p className="mt-1 font-aux text-[11px] text-black/40">Mínimo de 12 caracteres.</p>
            </Field>
            <button type="submit" className="bg-black px-5 py-3 font-sans text-xs font-bold uppercase tracking-wide text-white hover:bg-black/85">
              Criar operador
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="font-aux text-xs font-medium uppercase tracking-wide text-black/60">{label}</label>
      <div className="mt-1">{children}</div>
    </div>
  );
}
