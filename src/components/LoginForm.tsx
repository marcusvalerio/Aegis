"use client";

import { useState, useTransition } from "react";
import { loginAction } from "@/lib/actions/auth";

export function LoginForm() {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await loginAction(formData);
      if (result?.error) setError(result.error);
    });
  }

  return (
    <form action={handleSubmit} className="flex flex-col gap-4">
      <div>
        <label className="font-aux text-xs font-semibold uppercase tracking-widest text-white/50">
          E-mail
        </label>
        <input
          type="email"
          name="email"
          required
          autoComplete="username"
          className="mt-2 w-full border border-white/20 bg-transparent px-4 py-3 font-aux text-sm text-white outline-none focus:border-yellow"
          placeholder="voce@empresa.com"
        />
      </div>
      <div>
        <label className="font-aux text-xs font-semibold uppercase tracking-widest text-white/50">
          Senha
        </label>
        <input
          type="password"
          name="password"
          required
          autoComplete="current-password"
          className="mt-2 w-full border border-white/20 bg-transparent px-4 py-3 font-aux text-sm text-white outline-none focus:border-yellow"
          placeholder="••••••••"
        />
      </div>

      {error && <p className="font-aux text-xs text-red">{error}</p>}

      <button
        type="submit"
        disabled={isPending}
        className="mt-2 bg-yellow py-3.5 font-sans text-sm font-bold uppercase tracking-wide text-black transition-colors hover:bg-yellow/90 disabled:opacity-50"
      >
        {isPending ? "Entrando..." : "Entrar"}
      </button>
    </form>
  );
}
