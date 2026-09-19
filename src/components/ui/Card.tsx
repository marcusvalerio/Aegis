import clsx from "clsx";

export function MetricRow({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-2 gap-px border-y border-black/10 bg-black/10 md:grid-cols-4">
      {children}
    </div>
  );
}

const METRIC_TONE = {
  black: "text-black",
  green: "text-green",
  red: "text-red",
  yellow: "text-black",
} as const;

export function Metric({
  label,
  value,
  tone = "black",
}: {
  label: string;
  value: React.ReactNode;
  tone?: keyof typeof METRIC_TONE;
}) {
  return (
    <div className="min-w-0 bg-tan px-4 py-5 md:px-6">
      <div className={clsx("font-display text-4xl font-bold tabular-nums lg:text-5xl", METRIC_TONE[tone])}>
        {value}
      </div>
      <div className="mt-1.5 font-aux text-xs font-medium uppercase tracking-widest text-black/50">
        {label}
      </div>
    </div>
  );
}
