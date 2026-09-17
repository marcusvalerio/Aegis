import { auth } from "@/lib/auth";
import { logoutAction } from "@/lib/actions/auth";

export default async function OperadorLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  return (
    <div className="min-h-screen bg-tan">
      <header className="flex items-center justify-between border-b border-black/10 bg-black px-4 py-3 text-white">
        <span className="font-display text-sm font-extrabold uppercase tracking-tight">Aegis</span>
        <div className="flex items-center gap-3">
          <span className="font-aux text-xs text-white/60">{session?.user?.name}</span>
          <form action={logoutAction}>
            <button className="font-aux text-xs font-semibold uppercase tracking-wide text-white/60 hover:text-yellow">
              Sair
            </button>
          </form>
        </div>
      </header>
      {children}
    </div>
  );
}
