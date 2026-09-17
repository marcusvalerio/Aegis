export function ProgressBar({ value, total }: { value: number; total: number }) {
  const pct = total === 0 ? 0 : Math.round((value / total) * 100);
  return (
    <div>
      <div className="h-2 w-full bg-black/10">
        <div
          className="h-2 bg-yellow transition-all duration-300"
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="mt-1.5 flex justify-between font-aux text-xs text-black/60">
        <span>{value} / {total}</span>
        <span>{pct}%</span>
      </div>
    </div>
  );
}
