export function ProgressBar({
  value,
  total,
  compact = false,
}: {
  value: number;
  total: number;
  compact?: boolean;
}) {
  const pct = total === 0 ? 0 : Math.round((value / total) * 100);
  return (
    <div>
      <div className="h-1.5 w-full bg-black/10">
        <div
          className="h-1.5 bg-yellow transition-[width] duration-300 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
      {!compact && (
        <div className="mt-1.5 flex justify-between font-aux text-xs text-black/60">
          <span>{value} / {total}</span>
          <span className="tabular-nums">{pct}%</span>
        </div>
      )}
    </div>
  );
}
