export function Skeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="card-dark overflow-hidden">
      <div className="shimmer-bg h-10 border-b border-[hsl(var(--border))]" />
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="shimmer-bg border-b border-[hsl(var(--border))]/50"
          style={{ height: 40, opacity: 1 - i * 0.08 }}
        />
      ))}
    </div>
  );
}
