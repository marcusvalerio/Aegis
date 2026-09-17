import Link from "next/link";
import { ForkliftGraphic } from "@/components/ForkliftGraphic";

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col bg-black text-white">
      <header className="flex items-center justify-between border-b border-white/10 px-6 py-5 md:px-12">
        <span className="font-display text-lg font-extrabold uppercase tracking-tight">
          Aegis
        </span>
        <Link
          href="/login"
          className="font-aux text-xs font-semibold uppercase tracking-widest text-white/70 hover:text-yellow"
        >
          Entrar
        </Link>
      </header>

      <div className="grid flex-1 grid-cols-1 md:grid-cols-2">
        <div className="flex flex-col justify-center gap-8 px-6 py-16 md:px-12 lg:px-20">
          <div>
            <p className="font-aux text-xs font-semibold uppercase tracking-[0.3em] text-yellow">
              Checklist de empilhadeiras
            </p>
            <h1 className="mt-4 font-display text-5xl font-extrabold leading-[1.02] tracking-tight lg:text-6xl">
              INSPEÇÃO
              <br />
              OPERACIONAL
            </h1>
            <p className="mt-6 max-w-md font-aux text-base text-white/60">
              Inspecione. Registre. Acompanhe. Um sistema para checklists de
              empilhadeiras com rastreabilidade completa — do operador ao
              histórico de cada equipamento.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/login"
              className="bg-yellow px-6 py-4 font-sans text-sm font-bold uppercase tracking-wide text-black transition-colors hover:bg-yellow/90"
            >
              Iniciar checklist
            </Link>
            <Link
              href="/login"
              className="border border-white/20 px-6 py-4 font-sans text-sm font-bold uppercase tracking-wide text-white transition-colors hover:border-white/50"
            >
              Área administrativa
            </Link>
          </div>

          <dl className="grid max-w-md grid-cols-3 gap-6 border-t border-white/10 pt-6">
            <div>
              <dt className="font-aux text-[11px] uppercase tracking-widest text-white/40">Registro</dt>
              <dd className="mt-1 font-display text-2xl font-bold text-green">100%</dd>
            </div>
            <div>
              <dt className="font-aux text-[11px] uppercase tracking-widest text-white/40">Rastreio</dt>
              <dd className="mt-1 font-display text-2xl font-bold text-yellow">Total</dd>
            </div>
            <div>
              <dt className="font-aux text-[11px] uppercase tracking-widest text-white/40">Bloqueios</dt>
              <dd className="mt-1 font-display text-2xl font-bold text-red">Auto</dd>
            </div>
          </dl>
        </div>

        <div className="dot-grid relative hidden items-center justify-center border-l border-white/10 bg-[#242420] md:flex">
          <div className="w-3/4 max-w-md text-yellow">
            <ForkliftGraphic typeKey="CONTRABALANCADA" />
          </div>
          <div className="absolute bottom-10 left-10 font-aux text-xs uppercase tracking-widest text-white/40">
            EMP-001 · Contrabalançada · GLP
          </div>
        </div>
      </div>
    </main>
  );
}
