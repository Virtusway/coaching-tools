"use client";

import { useState } from "react";
import { splitTickLabel } from "./wheel-of-life-utils";

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

function polarToCartesian(
  cx: number,
  cy: number,
  radius: number,
  angleRad: number,
): { x: number; y: number } {
  return {
    x: cx + radius * Math.cos(angleRad),
    y: cy + radius * Math.sin(angleRad),
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

function getColor(index: number, count: number, baseHue: number) {
  const hue = (baseHue + (index * 360) / count) % 360;
  return {
    fill: `hsl(${hue}, 58%, 54%)`,
    stroke: `hsl(${hue}, 58%, 38%)`,
  };
}

export default function WheelOfLifeChart({
  data,
  baseHue = 0,
}: Readonly<WheelOfLifeChartProps>) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

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
      {/* Concentric grid circles */}
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

      {/* Sector dividing lines */}
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

      {/* Filled wedges */}
      {data.map((item, i) => {
        const startAngle = ANGLE_OFFSET + i * sectorAngle;
        const endAngle = startAngle + sectorAngle;
        const radius = (item.value / LEVELS) * MAX_RADIUS;
        const { fill, stroke } = getColor(i, count, baseHue);
        const isHovered = hoveredIndex === i;

        return (
          <g
            key={`sector-${i}`}
            onMouseEnter={() => setHoveredIndex(i)}
            onMouseLeave={() => setHoveredIndex(null)}
            className="transition-opacity"
          >
            <path
              d={sectorPath(CENTER, CENTER, radius, startAngle, endAngle)}
              fill={fill}
              fillOpacity={isHovered ? 0.85 : 0.65}
              stroke="white"
              strokeWidth={1.5}
              strokeLinejoin="round"
            >
              <title>{`${item.category}: ${item.value}/10`}</title>
            </path>
            {/* Invisible full-radius sector for hover hit area */}
            <path
              d={sectorPath(CENTER, CENTER, MAX_RADIUS, startAngle, endAngle)}
              fill="transparent"
              stroke="none"
            >
              <title>{`${item.category}: ${item.value}/10`}</title>
            </path>
            {/* Highlight stroke on hover */}
            {isHovered && radius > 0 && (
              <path
                d={sectorPath(CENTER, CENTER, radius, startAngle, endAngle)}
                fill="none"
                stroke={stroke}
                strokeWidth={2.5}
                strokeLinejoin="round"
                pointerEvents="none"
              />
            )}
          </g>
        );
      })}

      {/* Category labels */}
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

        // Determine text-anchor based on position
        // Determine text-anchor based on horizontal position (cosine of angle)
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

      {/* Hover tooltip badge */}
      {hoveredIndex !== null &&
        hoveredIndex < data.length &&
        (() => {
          const item = data[hoveredIndex];
          if (!item) return null;
          const midAngle =
            ANGLE_OFFSET + hoveredIndex * sectorAngle + sectorAngle / 2;
          const tipRadius = Math.min(
            (item.value / LEVELS) * MAX_RADIUS * 0.5 + 20,
            MAX_RADIUS * 0.65,
          );
          const { x: tx, y: ty } = polarToCartesian(
            CENTER,
            CENTER,
            tipRadius,
            midAngle,
          );
          const { fill } = getColor(hoveredIndex, count, baseHue);

          return (
            <g pointerEvents="none">
              <rect
                x={tx - 20}
                y={ty - 14}
                width={40}
                height={28}
                rx={6}
                fill="white"
                fillOpacity={0.95}
                stroke={fill}
                strokeWidth={1.5}
                filter="drop-shadow(0 1px 3px rgba(0,0,0,0.15))"
              />
              <text
                x={tx}
                y={ty}
                textAnchor="middle"
                dominantBaseline="central"
                className="text-[13px] font-bold"
                fill={fill}
              >
                {item.value}
              </text>
            </g>
          );
        })()}
    </svg>
  );
}
