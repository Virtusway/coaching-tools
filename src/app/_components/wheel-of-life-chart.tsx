"use client";

import { getWheelColor, splitTickLabel } from "./wheel-of-life-utils";

type WheelOfLifeChartProps = {
  data: Array<{ category: string; value: number }>;
  /** Base hue for color generation - colors will be evenly distributed from this starting hue */
  baseHue?: number;
};

const VIEW_SIZE = 500;
const CENTER = VIEW_SIZE / 2;
const MAX_RADIUS = 180;
const LEVELS = 10;
const LEVEL_STEP = MAX_RADIUS / LEVELS;
const LABEL_OFFSET = 24;
const ANGLE_OFFSET = -Math.PI / 2;
const COORDINATE_PRECISION = 4;

function roundCoordinate(value: number): number {
  return Number(value.toFixed(COORDINATE_PRECISION));
}

function polarToCartesian(
  cx: number,
  cy: number,
  radius: number,
  angleRad: number,
): { x: number; y: number } {
  return {
    x: roundCoordinate(cx + radius * Math.cos(angleRad)),
    y: roundCoordinate(cy + radius * Math.sin(angleRad)),
  };
}

function sectorPath(
  cx: number,
  cy: number,
  radius: number,
  startAngle: number,
  endAngle: number,
): string {
  if (radius <= 0) return "";

  const start = polarToCartesian(cx, cy, radius, startAngle);
  const end = polarToCartesian(cx, cy, radius, endAngle);
  const largeArc = endAngle - startAngle > Math.PI ? 1 : 0;

  return [
    `M ${cx} ${cy}`,
    `L ${start.x} ${start.y}`,
    `A ${radius} ${radius} 0 ${largeArc} 1 ${end.x} ${end.y}`,
    "Z",
  ].join(" ");
}

export default function WheelOfLifeChart({
  data,
  baseHue = 0,
}: Readonly<WheelOfLifeChartProps>) {
  const count = data.length;
  if (count === 0) return null;

  const sectorAngle = (2 * Math.PI) / count;

  return (
    <svg
      viewBox={`0 0 ${VIEW_SIZE} ${VIEW_SIZE}`}
      className="w-full h-full max-w-[500px] max-h-[500px]"
      role="img"
      aria-label="Wheel of Life chart"
    >
      {Array.from({ length: LEVELS }, (_, i) => {
        const r = LEVEL_STEP * (i + 1);
        return (
          <circle
            key={`grid-${i}`}
            cx={CENTER}
            cy={CENTER}
            r={r}
            fill="none"
            stroke="hsl(0, 0%, 82%)"
            strokeWidth={i === LEVELS - 1 ? 1.2 : 0.6}
            strokeDasharray={i === LEVELS - 1 ? undefined : "2 3"}
          />
        );
      })}

      {data.map((_, i) => {
        const angle = ANGLE_OFFSET + i * sectorAngle;
        const end = polarToCartesian(CENTER, CENTER, MAX_RADIUS, angle);
        return (
          <line
            key={`divider-${i}`}
            x1={CENTER}
            y1={CENTER}
            x2={end.x}
            y2={end.y}
            stroke="hsl(0, 0%, 82%)"
            strokeWidth={0.6}
          />
        );
      })}

      {data.map((item, i) => {
        const startAngle = ANGLE_OFFSET + i * sectorAngle;
        const endAngle = startAngle + sectorAngle;
        const radius = (item.value / LEVELS) * MAX_RADIUS;
        const { fill } = getWheelColor(i, count, baseHue);

        const textRadius = Math.max(radius * 0.5, 20);
        const midAngle = startAngle + sectorAngle / 2;
        const textPos = polarToCartesian(CENTER, CENTER, textRadius, midAngle);

        return (
          <g key={`sector-${i}`}>
            <path
              d={sectorPath(CENTER, CENTER, radius, startAngle, endAngle)}
              fill={fill}
              fillOpacity={0.65}
              stroke="white"
              strokeWidth={1.5}
              strokeLinejoin="round"
            >
              <title>{`${item.category}: ${item.value}/10`}</title>
            </path>
            <text
              x={textPos.x}
              y={textPos.y}
              textAnchor="middle"
              dominantBaseline="central"
              className="pointer-events-none fill-warm-900 text-[16px] font-bold"
            >
              {item.value}
            </text>

            <path
              d={sectorPath(CENTER, CENTER, MAX_RADIUS, startAngle, endAngle)}
              fill="transparent"
              stroke="none"
            >
              <title>{`${item.category}: ${item.value}/10`}</title>
            </path>
          </g>
        );
      })}

      {data.map((item, i) => {
        const midAngle = ANGLE_OFFSET + i * sectorAngle + sectorAngle / 2;
        const labelRadius = MAX_RADIUS + LABEL_OFFSET;
        const { x, y } = polarToCartesian(
          CENTER,
          CENTER,
          labelRadius,
          midAngle,
        );
        const lines = splitTickLabel(item.category);

        const cosAngle = Math.cos(midAngle);
        let textAnchor: "start" | "middle" | "end" = "middle";

        if (cosAngle > 0.05) {
          textAnchor = "start";
        } else if (cosAngle < -0.05) {
          textAnchor = "end";
        }

        const lineHeight = 13;
        const totalHeight = lines.length * lineHeight;
        const startY = y - totalHeight / 2 + lineHeight / 2;

        return (
          <text
            key={`label-${i}`}
            x={x}
            y={startY}
            textAnchor={textAnchor}
            dominantBaseline="central"
            className="fill-foreground text-[11px] font-medium select-none"
          >
            {lines.map((line, li) => (
              <tspan key={li} x={x} dy={li === 0 ? 0 : lineHeight}>
                {line}
              </tspan>
            ))}
          </text>
        );
      })}
    </svg>
  );
}
