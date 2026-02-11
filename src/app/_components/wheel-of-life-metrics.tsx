export function ScoreIndicator({
  value,
  color,
}: Readonly<{ value: number; color: string }>) {
  return (
    <div
      className="flex items-center gap-2"
      aria-label={`Valoración ${value} de 10`}
    >
      <div className="flex gap-[3px]" aria-hidden="true">
        {Array.from({ length: 10 }, (_, index) => (
          <div
            key={index}
            className="h-2.5 w-[3px] rounded-full transition-all duration-300"
            style={{
              backgroundColor: index < value ? color : "oklch(0.92 0.01 75)",
              opacity: index < value ? 0.85 : 0.35,
              transform: index < value ? "scaleY(1)" : "scaleY(0.7)",
            }}
          />
        ))}
      </div>

      <span
        className="min-w-5 text-right font-mono text-xs font-bold tabular-nums text-warm-700"
        aria-hidden="true"
      >
        {value}
      </span>
    </div>
  );
}

export function AverageScore({
  values,
  fill,
  stroke,
}: Readonly<{ values: readonly number[]; fill: string; stroke: string }>) {
  const total = values.reduce((sum, current) => sum + current, 0);
  const average = values.length > 0 ? total / values.length : 0;
  const roundedAverage = Math.round(average * 10) / 10;

  return (
    <div className="flex items-center justify-between rounded-2xl border border-warm-200/80 bg-linear-to-r from-warm-50/90 to-warm-50/50 p-4 shadow-xs">
      <div className="flex flex-col gap-0.5">
        <span className="text-sm font-semibold tracking-tight text-warm-900">
          Promedio general
        </span>
        <span className="text-[11px] font-medium text-warm-500/80">
          sobre 10
        </span>
      </div>

      <div className="flex items-center gap-4">
        <div
          className="relative h-2.5 w-24 overflow-hidden rounded-full bg-warm-200/50 shadow-[inset_0_1px_2px_rgba(0,0,0,0.05)]"
          aria-hidden
        >
          <div
            className="h-full rounded-full transition-all duration-700 ease-out"
            style={{
              width: `${(average / 10) * 100}%`,
              background: `linear-gradient(90deg, ${fill}, ${stroke})`,
            }}
          />
        </div>

        <span
          className="min-w-12 text-right font-mono text-2xl font-bold tabular-nums tracking-tighter"
          style={{ color: stroke }}
          aria-label={`Promedio ${roundedAverage} sobre 10`}
        >
          {roundedAverage}
        </span>
      </div>
    </div>
  );
}
