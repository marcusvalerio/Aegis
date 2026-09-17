export function EmptyState({ title, description }: { title: string; description?: string }) {
  return (
    <div className="border border-dashed border-black/20 p-10 text-center">
      <p className="font-display text-lg font-semibold text-black">{title}</p>
      {description && <p className="mt-1 font-aux text-sm text-black/60">{description}</p>}
    </div>
  );
}
