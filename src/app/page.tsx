import Link from "next/link";
import { ForkliftMedia } from "@/components/ForkliftMedia";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const featured = await db.forklift.findFirst({
    where: { active: true },
    include: { forkliftType: true, energyType: true },
    orderBy: { code: "asc" },
  });

  return (
    <main className="flex min-h-screen flex-col bg-black text-white">
      <header className="flex items-center justify-between border-b border-white/10 px-6 py-5 md:px-12">
        <span className="font-display text-lg font-extrabold uppercase tracking-tight">
          Aegis
        </span>
        <Link
          href="/login"
          className="font-aux text-xs font-semibold uppercase tracking-widest text-white/50 transition-colors hover:text-yellow"
        >
          Entrar
        </Link>
      </header>

      <div className="grid flex-1 grid-cols-1 md:grid-cols-2">
        <div className="flex flex-col justify-center gap-10 px-6 py-16 md:px-12 lg:px-20">
          <div>
            <p className="font-aux text-xs font-semibold uppercase tracking-[0.35em] text-yellow">
              Sistema de inspeção
            </p>
            <h1 className="mt-5 font-display text-5xl font-extrabold leading-[0.95] tracking-tight sm:text-6xl lg:text-7xl">
              INSPEÇÃO
              <br />
              OPERACIONAL
            </h1>
            <p className="mt-3 font-display text-lg font-semibold uppercase tracking-wide text-white/60">
              Checklist de empilhadeiras
            </p>
            <p className="mt-6 max-w-sm font-aux text-base text-white/50">
              Checklist de empilhadeiras. Registro, rastreabilidade e
              segurança — do operador em campo ao histórico completo de cada
              equipamento.
            </p>
          </div>

          <div>
            <Link
              href="/login"
              className="inline-flex bg-yellow px-8 py-4 font-sans text-sm font-bold uppercase tracking-wide text-black transition-transform hover:-translate-y-0.5"
            >
              Iniciar checklist
            </Link>
            <div className="mt-4">
              <Link
                href="/login"
                className="font-aux text-xs font-semibold uppercase tracking-widest text-white/40 transition-colors hover:text-white/70"
              >
                Acesso administrativo →
              </Link>
            </div>
          </div>

          <dl className="grid max-w-sm grid-cols-3 gap-6 border-t border-white/10 pt-6">
            <div>
              <dt className="font-aux text-[10px] uppercase tracking-widest text-white/30">Registro</dt>
              <dd className="mt-1 font-display text-xl font-bold text-green">100%</dd>
            </div>
            <div>
              <dt className="font-aux text-[10px] uppercase tracking-widest text-white/30">Rastreio</dt>
              <dd className="mt-1 font-display text-xl font-bold text-yellow">Total</dd>
            </div>
            <div>
              <dt className="font-aux text-[10px] uppercase tracking-widest text-white/30">Bloqueios</dt>
              <dd className="mt-1 font-display text-xl font-bold text-red">Auto</dd>
            </div>
          </dl>
        </div>

        <div className="dot-grid-inverse relative hidden border-l border-white/10 bg-black md:block">
          {featured ? (
            <>
              <ForkliftMedia
                imageUrl={featured.imageUrl}
                typeKey={featured.forkliftType.key}
                alt={`${featured.brand} ${featured.model}`}
                fit="contain"
                className="absolute inset-12 text-yellow"
              />
              <div className="absolute bottom-10 left-10 right-10 flex items-end justify-between border-t border-white/10 pt-4">
                <div>
                  <p className="font-display text-sm font-bold uppercase tracking-wide">
                    {featured.code}
                  </p>
                  <p className="font-aux text-xs uppercase tracking-widest text-white/40">
                    {featured.forkliftType.name} · {featured.energyType.name}
                  </p>
                </div>
                <p className="font-aux text-xs uppercase tracking-widest text-white/30">
                  {featured.capacityKg.toLocaleString("pt-BR")} kg
                </p>
              </div>
            </>
          ) : (
            <div className="flex h-full items-center justify-center font-aux text-xs uppercase tracking-widest text-white/30">
              Nenhum equipamento cadastrado
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
