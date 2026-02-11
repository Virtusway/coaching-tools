type WheelScoreGridProps = {
  categories: readonly string[];
  values: readonly number[];
  strokeColor: string;
};

function getColumns(count: number): number {
  return Math.max(1, Math.min(count, 4));
}

export default function WheelScoreGrid({
  categories,
  values,
  strokeColor,
}: Readonly<WheelScoreGridProps>) {
  if (categories.length === 0) {
    return (
      <div className="rounded-lg border border-warm-200/70 bg-warm-50/60 px-4 py-3 text-sm text-warm-600">
        No hay categorías disponibles para mostrar.
      </div>
    );
  }

  const splitIndex = Math.ceil(categories.length / 2);
  const rows = [
    { items: categories.slice(0, splitIndex), offset: 0 },
    { items: categories.slice(splitIndex), offset: splitIndex },
  ].filter((row) => row.items.length > 0);

  return (
    <>
      {rows.map((row) => (
        <div
          key={`row-${row.offset}`}
          className="grid gap-2"
          style={{
            gridTemplateColumns: `repeat(${getColumns(row.items.length)}, minmax(0, 1fr))`,
          }}
        >
          {row.items.map((category, index) => {
            const absoluteIndex = row.offset + index;
            const value = values[absoluteIndex] ?? 0;

            return (
              <div
                key={`${category}-${absoluteIndex}`}
                className="min-w-0 rounded-lg border border-warm-200/70 bg-warm-50/60 px-3 py-2.5 text-center"
              >
                <div className="truncate text-[10px] font-medium text-warm-500">
                  {category}
                </div>

                <div
                  className="mt-0.5 font-mono text-lg font-bold tabular-nums"
                  style={{ color: strokeColor }}
                  aria-label={`${category}: ${value} sobre 10`}
                >
                  {value}
                </div>
              </div>
            );
          })}
        </div>
      ))}
    </>
  );
}
