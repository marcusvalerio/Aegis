"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import { Check, X, Minus, Camera } from "lucide-react";
import { answerItemAction, registerNonConformityAction } from "@/lib/actions/checklist";
import type { AnswerValue, Severity, SnapshotItem } from "@/lib/types";

interface Props {
  checklistId: string;
  categoryName: string;
  item: SnapshotItem;
  currentAnswer?: AnswerValue;
  currentAnswerId?: string;
  existingNonConformity?: {
    description: string;
    severity: Severity;
  };
}

const SEVERITY_OPTIONS: Severity[] = ["BAIXA", "MEDIA", "ALTA", "CRITICA"];

export function ChecklistItemCard({
  checklistId,
  categoryName,
  item,
  currentAnswer,
  currentAnswerId,
  existingNonConformity,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [answer, setAnswer] = useState<AnswerValue | undefined>(currentAnswer);
  const [answerId, setAnswerId] = useState<string | undefined>(currentAnswerId);
  const [showNcForm, setShowNcForm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function selectAnswer(value: AnswerValue) {
    setError(null);
    setAnswer(value);
    startTransition(async () => {
      try {
        const result = await answerItemAction({
          checklistId,
          snapshotItemId: item.snapshotItemId,
          categoryName,
          itemLabel: item.label,
          question: item.question,
          answer: value,
        });
        setAnswerId(result.answerId);
        if (value === "NAO_CONFORME") {
          setShowNcForm(true);
        } else {
          setShowNcForm(false);
          router.refresh();
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "Erro ao registrar resposta.");
      }
    });
  }

  async function submitNonConformity(formData: FormData) {
    setError(null);
    if (!answerId) return;
    formData.set("checklistId", checklistId);
    formData.set("answerId", answerId);
    startTransition(async () => {
      try {
        await registerNonConformityAction(formData);
        setShowNcForm(false);
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Erro ao registrar não conformidade.");
      }
    });
  }

  const isDone = answer === "CONFORME" || answer === "NA" || (answer === "NAO_CONFORME" && !showNcForm);

  return (
    <div className={clsx("border-b border-black/10 py-5", isDone && "opacity-100")}>
      <p className="font-sans text-sm font-semibold text-black">{item.label}</p>
      <p className="mt-1 font-aux text-sm text-black/60">{item.question}</p>

      <div className="mt-3 grid grid-cols-3 gap-2">
        <button
          type="button"
          disabled={isPending}
          onClick={() => selectAnswer("CONFORME")}
          className={clsx(
            "flex items-center justify-center gap-1.5 border py-3 text-xs font-semibold uppercase tracking-wide transition-colors",
            answer === "CONFORME"
              ? "border-green bg-green text-black"
              : "border-black/20 bg-white text-black/70 hover:border-green",
          )}
        >
          <Check size={14} strokeWidth={3} /> Conforme
        </button>
        <button
          type="button"
          disabled={isPending}
          onClick={() => selectAnswer("NAO_CONFORME")}
          className={clsx(
            "flex items-center justify-center gap-1.5 border py-3 text-xs font-semibold uppercase tracking-wide transition-colors",
            answer === "NAO_CONFORME"
              ? "border-red bg-red text-white"
              : "border-black/20 bg-white text-black/70 hover:border-red",
          )}
        >
          <X size={14} strokeWidth={3} /> Não conforme
        </button>
        <button
          type="button"
          disabled={isPending}
          onClick={() => selectAnswer("NA")}
          className={clsx(
            "flex items-center justify-center gap-1.5 border py-3 text-xs font-semibold uppercase tracking-wide transition-colors",
            answer === "NA"
              ? "border-black bg-black text-white"
              : "border-black/20 bg-white text-black/70 hover:border-black",
          )}
        >
          <Minus size={14} strokeWidth={3} /> N/A
        </button>
      </div>

      {error && <p className="mt-2 font-aux text-xs text-red">{error}</p>}

      {answer === "NAO_CONFORME" && !showNcForm && existingNonConformity && (
        <button
          type="button"
          onClick={() => setShowNcForm(true)}
          className="mt-3 flex w-full items-center justify-between border border-red/40 bg-red/5 px-3 py-2 text-left"
        >
          <span className="font-aux text-xs text-black/70 line-clamp-1">
            {existingNonConformity.description}
          </span>
          <span className="font-aux text-[10px] font-semibold uppercase text-red">Editar</span>
        </button>
      )}

      {showNcForm && (
        <form action={submitNonConformity} className="mt-4 border border-red bg-red/5 p-4">
          <p className="font-display text-sm font-bold uppercase text-red">Não conformidade</p>
          <p className="mt-0.5 font-aux text-xs text-black/60">{item.label}</p>

          <label className="mt-3 block font-aux text-xs font-medium text-black/70">
            Descreva o problema {item.requiresNote && <span className="text-red">*</span>}
          </label>
          <textarea
            name="description"
            required={item.requiresNote}
            defaultValue={existingNonConformity?.description}
            rows={3}
            className="mt-1 w-full border border-black/20 bg-white p-2.5 font-aux text-sm outline-none focus:border-black"
            placeholder="Ex.: freio de serviço não responde ao acionamento"
          />

          <p className="mt-3 font-aux text-xs font-medium text-black/70">Gravidade</p>
          <div className="mt-1.5 grid grid-cols-4 gap-1.5">
            {SEVERITY_OPTIONS.map((s) => (
              <label
                key={s}
                className="flex cursor-pointer items-center justify-center border border-black/20 py-2 text-[11px] font-semibold uppercase has-[:checked]:border-black has-[:checked]:bg-black has-[:checked]:text-white"
              >
                <input
                  type="radio"
                  name="severity"
                  value={s}
                  defaultChecked={(existingNonConformity?.severity ?? item.defaultSeverity) === s}
                  className="sr-only"
                />
                {s}
              </label>
            ))}
          </div>

          <label className="mt-3 flex cursor-pointer items-center justify-center gap-2 border border-black/20 bg-white py-3 font-aux text-xs font-medium text-black/70">
            <Camera size={16} />
            {item.requiresPhoto === "OBRIGATORIA_NC" ? "Adicionar foto (obrigatória)" : "Adicionar foto"}
            <input
              type="file"
              name="photo"
              accept="image/*"
              capture="environment"
              required={item.requiresPhoto === "OBRIGATORIA_NC"}
              className="hidden"
            />
          </label>

          <button
            type="submit"
            disabled={isPending}
            className="mt-3 w-full bg-black py-3 font-sans text-xs font-semibold uppercase tracking-wide text-white disabled:opacity-50"
          >
            Registrar
          </button>
        </form>
      )}
    </div>
  );
}
