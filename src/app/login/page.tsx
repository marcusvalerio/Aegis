import Link from "next/link";
import { LoginForm } from "@/components/LoginForm";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-black px-6 text-white">
      <div className="w-full max-w-sm">
        <Link href="/" className="font-display text-lg font-extrabold uppercase tracking-tight">
          Aegis
        </Link>
        <h1 className="mt-8 font-display text-2xl font-bold">Acessar o sistema</h1>
        <p className="mt-1 font-aux text-sm text-white/50">
          Use suas credenciais de operador ou administrador.
        </p>

        <div className="mt-8">
          <LoginForm />
        </div>

        {process.env.SHOW_DEMO_CREDENTIALS === "true" && (
          <div className="mt-8 border-t border-white/10 pt-4 font-aux text-[11px] text-white/30">
            Ambiente de demonstração — admin@aegis.com / operador@aegis.com. Senha
            definida por quem rodou o seed (DEMO_PASSWORD).
          </div>
        )}
      </div>
    </main>
  );
}
