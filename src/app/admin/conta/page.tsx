import { requireAdmin } from "@/lib/actions/admin-guard";
import { ChangePasswordForm } from "@/components/admin/ChangePasswordForm";

export default async function ContaPage() {
  const session = await requireAdmin();

  return (
    <main className="p-6 md:p-10">
      <h1 className="font-display text-2xl font-bold uppercase tracking-tight text-black">
        Minha conta
      </h1>
      <p className="mt-1 font-aux text-sm text-black/60">
        {session.user.name} · {session.user.email}
      </p>

      <section className="mt-8">
        <h2 className="border-b border-black/10 pb-3 font-display text-sm font-bold uppercase tracking-wide text-black">
          Alterar senha
        </h2>
        <div className="mt-4">
          <ChangePasswordForm />
        </div>
      </section>
    </main>
  );
}
