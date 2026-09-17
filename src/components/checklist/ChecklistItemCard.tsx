"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import { Check, X, Minus, Camera, ImageUp } from "lucide-react";
import { answerItemAction, registerNonConformityAction } from "@/lib/actions/checklist";
import { Spinner } from "@/components/ui/Spinner";
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

const SEVERITY_OPTIONS: { value: Severity; label: string }[] = [
  { value: "BAIXA", label: "Baixa" },
  { value: "MEDIA", label: "Média" },
  { value: "ALTA", label: "Alta" },
  { value: "CRITICA", label: "Crítica" },
];

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
  const [photoName, setPhotoName] = useState<string | null>(null);

  async function selectAnswer(value: AnswerValue) {
    setError(null);
    const previous = answer;
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
        setAnswer(previous);
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

  return (
    <div className="border-b border-black/10 py-5">
      <p className="font-sans text-sm font-semibold text-black">{item.label}</p>
      <p className="mt-1 font-aux text-sm leading-relaxed text-black/60">{item.question}</p>

      <div className="mt-3 grid grid-cols-3 gap-2">
        <AnswerButton
          active={answer === "CONFORME"}
          activeClass="border-green bg-green text-black"
          icon={<Check size={16} strokeWidth={3} />}
          label="Conforme"
          disabled={isPending}
          onClick={() => selectAnswer("CONFORME")}
        />
        <AnswerButton
          active={answer === "NAO_CONFORME"}
          activeClass="border-red bg-red text-white"
          icon={<X size={16} strokeWidth={3} />}
          label="Não conforme"
          disabled={isPending}
          onClick={() => selectAnswer("NAO_CONFORME")}
        />
        <AnswerButton
          active={answer === "NA"}
          activeClass="border-black bg-black text-white"
          icon={<Minus size={16} strokeWidth={3} />}
          label="N/A"
          disabled={isPending}
          onClick={() => selectAnswer("NA")}
        />
      </div>

      {error && <p className="mt-2 font-aux text-xs text-red">{error}</p>}

      {answer === "NAO_CONFORME" && !showNcForm && existingNonConformity && (
        <button
          type="button"
          onClick={() => setShowNcForm(true)}
          className="mt-3 flex w-full items-center justify-between border border-red/30 bg-red/5 px-3 py-2.5 text-left transition-colors hover:bg-red/10"
        >
          <span className="font-aux text-xs text-black/70 line-clamp-1">
            {existingNonConformity.description}
          </span>
          <span className="ml-2 shrink-0 font-aux text-[10px] font-semibold uppercase text-red">Editar</span>
        </button>
      )}

      {showNcForm && (
        <form action={submitNonConformity} className="animate-rise-in mt-4 border-l-2 border-red bg-red/[0.04] p-4">
          <p className="font-display text-xs font-bold uppercase tracking-wide text-red">
            Não conformidade
          </p>
          <p className="mt-0.5 font-aux text-xs text-black/50">{item.label}</p>

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
                key={s.value}
                className="flex min-h-[44px] cursor-pointer items-center justify-center border border-black/20 px-1 text-center font-aux text-[11px] font-semibold uppercase leading-tight transition-colors has-[:checked]:border-black has-[:checked]:bg-black has-[:checked]:text-white"
              >
                <input
                  type="radio"
                  name="severity"
                  value={s.value}
                  defaultChecked={(existingNonConformity?.severity ?? item.defaultSeverity) === s.value}
                  className="sr-only"
                />
                {s.label}
              </label>
            ))}
          </div>

          <label className="mt-3 flex min-h-[52px] cursor-pointer items-center justify-center gap-2 border border-black/20 bg-white px-3 py-3 font-aux text-xs font-medium text-black/70 transition-colors hover:border-black/40">
            {photoName ? <ImageUp size={16} className="text-green" /> : <Camera size={16} />}
            <span className="truncate">
              {photoName ??
                (item.requiresPhoto === "OBRIGATORIA_NC" ? "Adicionar foto (obrigatória)" : "Adicionar foto")}
            </span>
            <input
              type="file"
              name="photo"
              accept="image/*"
              capture="environment"
              required={item.requiresPhoto === "OBRIGATORIA_NC"}
              onChange={(e) => setPhotoName(e.target.files?.[0]?.name ?? null)}
              className="hidden"
            />
          </label>

          <button
            type="submit"
            disabled={isPending}
            className="mt-3 flex min-h-[52px] w-full items-center justify-center gap-2 bg-black font-sans text-xs font-semibold uppercase tracking-wide text-white transition-colors hover:bg-black/85 disabled:opacity-50"
          >
            {isPending && <Spinner />}
            {isPending ? "Registrando..." : "Registrar"}
          </button>
        </form>
      )}
    </div>
  );
}

function AnswerButton({
  active,
  activeClass,
  icon,
  label,
  disabled,
  onClick,
}: {
  active: boolean;
  activeClass: string;
  icon: React.ReactNode;
  label: string;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      aria-pressed={active}
      className={clsx(
        "flex min-h-[52px] flex-col items-center justify-center gap-1 border text-[11px] font-semibold uppercase leading-tight tracking-wide transition-all active:scale-[0.97] disabled:opacity-60",
        active ? activeClass : "border-black/20 bg-white text-black/70 hover:border-black/40",
      )}
    >
      {icon}
      {label}
    </button>
  );
}
