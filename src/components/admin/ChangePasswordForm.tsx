"use client";

import { useRef, useState, useTransition } from "react";
import { changeOwnPasswordAction } from "@/lib/actions/account";

export function ChangePasswordForm() {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  function handleSubmit(formData: FormData) {
    setError(null);
    setSuccess(false);
    startTransition(async () => {
      const result = await changeOwnPasswordAction(formData);
      if (result?.error) {
        setError(result.error);
        return;
      }
      setSuccess(true);
      formRef.current?.reset();
    });
  }

  return (
    <form ref={formRef} action={handleSubmit} className="flex max-w-sm flex-col gap-4">
      <div>
        <label className="font-aux text-xs font-medium uppercase tracking-wide text-black/60">
          Senha atual
        </label>
        <input
          type="password"
          name="currentPassword"
          required
          autoComplete="current-password"
          className="input mt-1"
        />
      </div>
      <div>
        <label className="font-aux text-xs font-medium uppercase tracking-wide text-black/60">
          Nova senha
        </label>
        <input
          type="password"
          name="newPassword"
          required
          minLength={12}
          autoComplete="new-password"
          className="input mt-1"
        />
        <p className="mt-1 font-aux text-[11px] text-black/40">Mínimo de 12 caracteres.</p>
      </div>
      <div>
        <label className="font-aux text-xs font-medium uppercase tracking-wide text-black/60">
          Confirmar nova senha
        </label>
        <input
          type="password"
          name="confirmPassword"
          required
          minLength={12}
          autoComplete="new-password"
          className="input mt-1"
        />
      </div>

      {error && <p className="font-aux text-xs text-red">{error}</p>}
      {success && (
        <p className="border-l-2 border-green bg-green/10 px-3 py-2 font-aux text-xs text-black">
          Senha alterada com sucesso.
        </p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="mt-2 bg-black py-3 font-sans text-xs font-bold uppercase tracking-wide text-white transition-colors hover:bg-black/85 disabled:opacity-50"
      >
        {isPending ? "Alterando..." : "Alterar senha"}
      </button>
    </form>
  );
}
