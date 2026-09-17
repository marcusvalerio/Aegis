import clsx from "clsx";

export function Card({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={clsx("border border-black/10 bg-white", className)}>{children}</div>
  );
}

export function StatTile({
  label,
  value,
  tone = "black",
}: {
  label: string;
  value: React.ReactNode;
  tone?: "black" | "green" | "red" | "yellow";
}) {
  const toneClass = {
    black: "text-black",
    green: "text-green",
    red: "text-red",
    yellow: "text-black",
  }[tone];

  return (
    <div className="border border-black/10 bg-white p-6">
      <div className={clsx("font-display text-5xl font-bold tabular-nums", toneClass)}>{value}</div>
      <div className="mt-2 font-aux text-xs font-medium uppercase tracking-widest text-black/60">
        {label}
      </div>
    </div>
  );
}
