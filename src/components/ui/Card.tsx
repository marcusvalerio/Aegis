import clsx from "clsx";

export function MetricRow({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-2 border-y border-black/10 md:grid-cols-4">
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
    <div className="min-w-0 border-black/10 px-4 py-5 first:border-r first:pl-0 [&:nth-child(even)]:border-l [&:nth-child(n+3)]:border-t md:border-t-0 md:px-6 md:first:pl-0 md:[&:nth-child(even)]:border-l md:[&:nth-child(n+3)]:border-l md:[&:nth-child(n+3)]:border-t-0">
      <div className={clsx("font-display text-4xl font-bold tabular-nums lg:text-5xl", METRIC_TONE[tone])}>
        {value}
      </div>
      <div className="mt-1.5 font-aux text-xs font-medium uppercase tracking-widest text-black/50">
        {label}
      </div>
    </div>
  );
}
