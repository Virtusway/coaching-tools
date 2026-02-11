export function ScoreIndicator({
  value,
  color,
}: Readonly<{ value: number; color: string }>) {
  return (
    <div
      className="flex items-center gap-1.5"
      aria-label={`Valoración ${value} de 10`}
    >
      <div className="flex gap-0.5" aria-hidden="true">
        {Array.from({ length: 10 }, (_, index) => (
          <div
            key={index}
            className="h-1.5 w-1 rounded-full transition-[background-color,opacity] duration-300"
            style={{
              backgroundColor: index < value ? color : "oklch(0.92 0.01 75)",
              opacity: index < value ? 1 : 0.5,
            }}
          />
        ))}
      </div>

      <span
        className="min-w-6 text-right font-mono text-xs font-semibold tabular-nums text-warm-700"
        aria-hidden="true"
      >
        {value}
      </span>
    </div>
  );
}

export function AverageScore({
  values,
  color,
}: Readonly<{ values: readonly number[]; color: string }>) {
  const total = values.reduce((sum, current) => sum + current, 0);
  const average = values.length > 0 ? total / values.length : 0;
  const roundedAverage = Math.round(average * 10) / 10;

  return (
    <div className="flex items-center justify-between rounded-xl border border-warm-200 bg-warm-50/60 px-4 py-3">
      <span className="text-sm font-medium text-warm-600">
        Promedio general
      </span>

      <div className="flex items-center gap-2">
        <div
          className="h-2 w-20 overflow-hidden rounded-full bg-warm-200"
          aria-hidden
        >
          <div
            className="h-full rounded-full transition-[width,background-color] duration-500 ease-out"
            style={{
              width: `${(average / 10) * 100}%`,
              backgroundColor: color,
            }}
          />
        </div>

        <span
          className="min-w-8 text-right font-mono text-lg font-bold tabular-nums"
          style={{ color }}
          aria-label={`Promedio ${roundedAverage} sobre 10`}
        >
          {roundedAverage}
        </span>
      </div>
    </div>
  );
}
