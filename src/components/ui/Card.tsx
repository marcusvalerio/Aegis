import clsx from "clsx";

export function MetricRow({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-wrap divide-x divide-black/10 border-y border-black/10">{children}</div>;
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
    <div className="flex-1 px-6 py-5 first:pl-0">
      <div className={clsx("font-display text-4xl font-bold tabular-nums lg:text-5xl", METRIC_TONE[tone])}>
        {value}
      </div>
      <div className="mt-1.5 font-aux text-xs font-medium uppercase tracking-widest text-black/50">
        {label}
      </div>
    </div>
  );
}
