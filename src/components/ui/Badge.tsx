import clsx from "clsx";

type Tone = "neutral" | "yellow" | "green" | "red" | "black";

const TONE_CLASSES: Record<Tone, string> = {
  neutral: "bg-tan text-black border border-black/15",
  yellow: "bg-yellow text-black",
  green: "bg-green text-black",
  red: "bg-red text-white",
  black: "bg-black text-white",
};

export function Badge({
  tone = "neutral",
  children,
  className,
}: {
  tone?: Tone;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider",
        TONE_CLASSES[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
