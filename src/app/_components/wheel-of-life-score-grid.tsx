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
      <div className="rounded-xl border border-dashed border-warm-300/60 bg-warm-50/40 px-5 py-4 text-center text-sm text-warm-500">
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
            const percentage = (value / 10) * 100;

            return (
              <div
                key={`${category}-${absoluteIndex}`}
                className="group relative min-w-0 overflow-hidden rounded-xl border border-warm-200/70 bg-gradient-to-b from-warm-50/80 to-white px-3 py-3 text-center transition-shadow duration-300 hover:shadow-sm"
              >
                <div className="truncate text-[10px] font-medium tracking-wide text-warm-500 uppercase">
                  {category}
                </div>

                <div
                  className="mt-1 font-mono text-xl font-bold tabular-nums leading-tight"
                  style={{ color: strokeColor }}
                  aria-label={`${category}: ${value} sobre 10`}
                >
                  {value}
                </div>

                <div className="mx-auto mt-2 h-1 w-full overflow-hidden rounded-full bg-warm-200/50">
                  <div
                    className="h-full rounded-full transition-[width,background-color] duration-500 ease-out"
                    style={{
                      width: `${percentage}%`,
                      backgroundColor: strokeColor,
                      opacity: 0.6,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      ))}
    </>
  );
}
