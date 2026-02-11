"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { zodResolver } from "@hookform/resolvers/zod";
import { jsPDF } from "jspdf";
import {
  BriefcaseIcon,
  Download,
  HeartIcon,
  PersonStandingIcon,
  RotateCcw,
  UserIcon,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
} from "recharts";
import * as z from "zod";

// ── Wheel type definitions ──────────────────────────────────────────────

const WHEEL_TYPES = ["personal", "pareja", "profesional"] as const;
type WheelType = (typeof WHEEL_TYPES)[number];

const WHEEL_LABELS: Record<WheelType, string> = {
  personal: "Personal",
  pareja: "De Pareja",
  profesional: "Profesional",
};

const WHEEL_TITLES: Record<WheelType, string> = {
  personal: "RUEDA DE LA VIDA PERSONAL",
  pareja: "RUEDA DE LA VIDA DE PAREJA",
  profesional: "RUEDA DE LA VIDA PROFESIONAL",
};

const WHEEL_ICONS: Record<WheelType, React.ReactNode> = {
  personal: <PersonStandingIcon className="size-4" />,
  pareja: <HeartIcon className="size-4" />,
  profesional: <BriefcaseIcon className="size-4" />,
};

const WHEEL_CATEGORIES: Record<WheelType, readonly string[]> = {
  personal: [
    "Ocio",
    "Trabajo",
    "Mente",
    "Amigos",
    "Físico",
    "Finanzas",
    "Ética/crecimiento espiritual",
    "Familia/Pareja",
  ],
  pareja: [
    "Ocio",
    "Convivencia",
    "Proyectos en común",
    "Sexualidad",
    "Entorno",
    "Finanzas",
    "Familia (hijos/padres)",
    "Afectividad/Comunicación",
  ],
  profesional: [
    "Relaciones equipo",
    "Liderazgo interior",
    "Liderazgo de otros",
    "Finanzas",
    "Visión/objetivos a largo plazo",
    "Comunicación efectiva",
    "Evaluación productos",
    "Servicios atención cliente",
  ],
};

const WHEEL_COLORS: Record<WheelType, { fill: string; stroke: string }> = {
  personal: { fill: "hsl(172 50% 45%)", stroke: "hsl(172 55% 35%)" },
  pareja: { fill: "hsl(350 60% 55%)", stroke: "hsl(350 65% 42%)" },
  profesional: { fill: "hsl(221 65% 50%)", stroke: "hsl(221 70% 38%)" },
};

// ── Zod schema ──────────────────────────────────────────────────────────

const DEFAULT_VALUES = [5, 5, 5, 5, 5, 5, 5, 5] as const;

const formSchema = z.object({
  coacheeName: z.string().min(1, "El nombre del coachee es obligatorio"),
  wheelType: z.enum(WHEEL_TYPES),
  values: z.array(z.number().min(1).max(10)).length(8),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

// ── Custom radar tick (handles multi‑line labels) ───────────────────────

function CustomAngleTick(
  props: Readonly<{
    x: number;
    y: number;
    payload: { value: string };
    textAnchor: "start" | "middle" | "end";
  }>,
) {
  const { x, y, payload, textAnchor } = props;
  const raw = payload.value;
  const parts = raw.split("/").flatMap((part) => {
    const trimmed = part.trim();
    if (trimmed.length <= 14) return [trimmed];
    const words = trimmed.split(" ");
    const lines: string[] = [];
    let cur = "";
    for (const w of words) {
      if (cur && (cur + " " + w).length > 14) {
        lines.push(cur);
        cur = w;
      } else {
        cur = cur ? cur + " " + w : w;
      }
    }
    if (cur) lines.push(cur);
    return lines;
  });

  const lineH = 14;
  const yOff = -((parts.length - 1) * lineH) / 2;

  return (
    <g transform={`translate(${x},${y})`}>
      {parts.map((line, lineIdx) => (
        <text
          key={`${line}-${lineIdx}`}
          x={0}
          y={yOff + lineIdx * lineH}
          textAnchor={textAnchor}
          fontSize={11}
          fontWeight={500}
          fill="currentColor"
          dominantBaseline="central"
        >
          {line}
        </text>
      ))}
    </g>
  );
}

// ── SVG‑to‑image helper (for PDF) ──────────────────────────────────────

async function svgToDataUrl(container: HTMLElement): Promise<string> {
  const svg = container.querySelector("svg");
  if (!svg) throw new Error("No SVG found");

  const bbox = svg.getBoundingClientRect();
  const scale = 3;
  const w = bbox.width * scale;
  const h = bbox.height * scale;

  const clone = svg.cloneNode(true) as SVGSVGElement;
  clone.setAttribute("width", String(w));
  clone.setAttribute("height", String(h));
  clone.setAttribute("viewBox", `0 0 ${bbox.width} ${bbox.height}`);

  const origTexts = svg.querySelectorAll("text, tspan");
  const cloneTexts = clone.querySelectorAll("text, tspan");
  origTexts.forEach((el, i) => {
    const cs = globalThis.getComputedStyle(el);
    const ct = cloneTexts[i] as SVGElement | undefined;
    if (!ct) return;
    ct.setAttribute(
      "style",
      `font-family:${cs.fontFamily};font-size:${cs.fontSize};font-weight:${cs.fontWeight};fill:${cs.fill || cs.color}`,
    );
  });

  const bgRect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
  bgRect.setAttribute("width", "100%");
  bgRect.setAttribute("height", "100%");
  bgRect.setAttribute("fill", "#ffffff");
  clone.insertBefore(bgRect, clone.firstChild);

  const blob = new Blob([new XMLSerializer().serializeToString(clone)], {
    type: "image/svg+xml;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const c = document.createElement("canvas");
      c.width = w;
      c.height = h;
      const ctx = c.getContext("2d");
      if (!ctx) {
        URL.revokeObjectURL(url);
        reject(new Error("Failed to get canvas 2D context"));
        return;
      }
      ctx.fillStyle = "#fff";
      ctx.fillRect(0, 0, w, h);
      ctx.drawImage(img, 0, 0, w, h);
      URL.revokeObjectURL(url);
      resolve(c.toDataURL("image/png"));
    };
    img.onerror = (err) => {
      URL.revokeObjectURL(url);
      reject(err);
    };
    img.src = url;
  });
}

// ── Score indicator component ───────────────────────────────────────────

function ScoreIndicator({
  value,
  color,
}: Readonly<{ value: number; color: string }>) {
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex gap-0.5">
        {Array.from({ length: 10 }, (_, i) => (
          <div
            key={i}
            className="h-1.5 w-1 rounded-full transition-all duration-300"
            style={{
              backgroundColor: i < value ? color : "oklch(0.92 0.01 75)",
              opacity: i < value ? 1 : 0.5,
            }}
          />
        ))}
      </div>
      <span className="min-w-6 text-right font-mono text-xs font-semibold tabular-nums text-warm-700">
        {value}
      </span>
    </div>
  );
}

// ── Average score component ─────────────────────────────────────────────

function AverageScore({
  values,
  color,
}: Readonly<{ values: number[]; color: string }>) {
  const avg = values.reduce((a, b) => a + b, 0) / values.length;
  const rounded = Math.round(avg * 10) / 10;

  return (
    <div className="flex items-center justify-between rounded-xl border border-warm-200 bg-warm-50/60 px-4 py-3">
      <span className="text-sm font-medium text-warm-600">
        Promedio general
      </span>
      <div className="flex items-center gap-2">
        <div className="h-2 w-20 overflow-hidden rounded-full bg-warm-200">
          <div
            className="h-full rounded-full transition-all duration-500 ease-out"
            style={{
              width: `${(avg / 10) * 100}%`,
              backgroundColor: color,
            }}
          />
        </div>
        <span
          className="min-w-8 text-right font-mono text-lg font-bold tabular-nums"
          style={{ color }}
        >
          {rounded}
        </span>
      </div>
    </div>
  );
}

// ── Main component ──────────────────────────────────────────────────────

export default function WheelOfLifeForm() {
  const chartRef = useRef<HTMLDivElement>(null);
  const prevType = useRef<WheelType>("personal");
  const [isExporting, setIsExporting] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    mode: "onChange",
    defaultValues: {
      coacheeName: "",
      wheelType: "personal",
      values: [...DEFAULT_VALUES],
      notes: "",
    },
  });

  const wheelType = form.watch("wheelType");
  const values = form.watch("values");
  const coacheeName = form.watch("coacheeName");
  const categories = WHEEL_CATEGORIES[wheelType];
  const colors = WHEEL_COLORS[wheelType];

  useEffect(() => {
    if (prevType.current !== wheelType) {
      form.setValue("values", [...DEFAULT_VALUES]);
      prevType.current = wheelType;
    }
  }, [wheelType, form]);

  const chartConfig: ChartConfig = {
    value: {
      label: "Valoración",
      color: colors.fill,
    },
  };

  const chartData = categories.map((cat, i) => ({
    category: cat,
    value: values[i] ?? 5,
    fullMark: 10,
  }));

  // ── PDF export handler ────────────────────────────────────────────────

  const handleExportPdf = useCallback(async () => {
    const valid = await form.trigger();
    if (!valid) return;

    setIsExporting(true);

    try {
      const name = form.getValues("coacheeName");
      const type = form.getValues("wheelType");
      const vals = form.getValues("values");
      const notes = form.getValues("notes") ?? "";
      const cats = WHEEL_CATEGORIES[type];
      const title = WHEEL_TITLES[type];

      const pdf = new jsPDF("portrait", "mm", "a4");
      const pageW = 210;

      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(18);
      pdf.text(title, pageW / 2, 22, { align: "center" });

      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(12);
      pdf.text(`Coachee: ${name}`, pageW / 2, 32, { align: "center" });

      pdf.setFontSize(10);
      pdf.text(
        `Fecha: ${new Date().toLocaleDateString("es-ES", { year: "numeric", month: "long", day: "numeric" })}`,
        pageW / 2,
        39,
        { align: "center" },
      );

      if (chartRef.current) {
        try {
          const imgData = await svgToDataUrl(chartRef.current);
          const chartSize = 130;
          const xOffset = (pageW - chartSize) / 2;
          pdf.addImage(imgData, "PNG", xOffset, 45, chartSize, chartSize);
        } catch {
          pdf.setFontSize(10);
          pdf.setTextColor(150);
          pdf.text("(No se pudo capturar el gráfico)", pageW / 2, 110, {
            align: "center",
          });
          pdf.setTextColor(0);
        }
      }

      const tableY = 182;
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(12);
      pdf.text("Valoraciones:", 25, tableY);

      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(10);
      cats.forEach((cat, i) => {
        const y = tableY + 8 + i * 7;
        pdf.text(`${cat}:`, 28, y);
        pdf.text(`${vals[i]}/10`, 120, y);
        const barW = 50;
        const barX = 130;
        pdf.setDrawColor(200);
        pdf.setFillColor(230, 230, 230);
        pdf.roundedRect(barX, y - 3, barW, 4, 1, 1, "FD");
        const col = WHEEL_COLORS[type];
        const rgb = hslToRgb(col.fill);
        pdf.setFillColor(rgb.r, rgb.g, rgb.b);
        pdf.roundedRect(barX, y - 3, (barW * vals[i]) / 10, 4, 1, 1, "F");
      });

      const notesY = tableY + 8 + cats.length * 7 + 8;
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(12);
      pdf.text("Notas:", 25, notesY);

      if (notes.trim()) {
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(10);
        const wrappedLines = pdf.splitTextToSize(notes, 160);
        pdf.text(wrappedLines, 25, notesY + 8);
      } else {
        pdf.setDrawColor(200);
        for (let i = 0; i < 4; i++) {
          const lY = notesY + 8 + i * 8;
          pdf.line(25, lY, 185, lY);
        }
      }

      pdf.save(`rueda-vida-${name.replaceAll(/\s+/g, "-").toLowerCase()}.pdf`);
    } finally {
      setIsExporting(false);
    }
  }, [form]);

  return (
    <TooltipProvider>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] lg:items-start lg:gap-8">
        {/* ── Form column ──────────────────────────────────────────── */}
        <div className="space-y-5">
          <Card className="border-warm-200/80 bg-card/80 shadow-sm backdrop-blur-sm">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex size-9 items-center justify-center rounded-lg bg-warm-100 text-warm-600">
                  <UserIcon className="size-4" />
                </div>
                <div>
                  <CardTitle className="text-warm-900">
                    Datos del Coachee
                  </CardTitle>
                  <CardDescription className="text-warm-500">
                    Nombre y tipo de rueda a evaluar.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
                <FieldGroup>
                  <Controller
                    name="coacheeName"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel htmlFor={field.name}>
                          Nombre del Coachee
                        </FieldLabel>
                        <Input
                          {...field}
                          id={field.name}
                          aria-invalid={fieldState.invalid}
                          placeholder="Ej: María García"
                          autoComplete="off"
                          className="border-warm-200 bg-warm-50/50 focus-visible:border-terracotta focus-visible:ring-terracotta/20"
                        />
                        {fieldState.invalid && (
                          <FieldError errors={[fieldState.error]} />
                        )}
                      </Field>
                    )}
                  />

                  <Controller
                    name="wheelType"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel htmlFor="wheelType">
                          Tipo de Rueda
                        </FieldLabel>
                        <Select
                          name={field.name}
                          value={field.value}
                          onValueChange={field.onChange}
                        >
                          <SelectTrigger
                            id="wheelType"
                            className="w-full cursor-pointer border-warm-200 bg-warm-50/50"
                            aria-invalid={fieldState.invalid}
                          >
                            <SelectValue placeholder="Selecciona un tipo" />
                          </SelectTrigger>
                          <SelectContent>
                            {WHEEL_TYPES.map((t) => (
                              <SelectItem key={t} value={t}>
                                <span className="flex items-center gap-2">
                                  {WHEEL_ICONS[t]}
                                  {WHEEL_LABELS[t]}
                                </span>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {fieldState.invalid && (
                          <FieldError errors={[fieldState.error]} />
                        )}
                      </Field>
                    )}
                  />
                </FieldGroup>
              </form>
            </CardContent>
          </Card>

          {/* Category sliders card */}
          <Card className="border-warm-200/80 bg-card/80 shadow-sm backdrop-blur-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-warm-900">Valoraciones</CardTitle>
                  <CardDescription className="text-warm-500">
                    Ajusta cada categoría del 1 al 10.
                  </CardDescription>
                </div>
                <Badge
                  variant="outline"
                  className="border-warm-300 bg-warm-50 font-mono text-warm-600"
                >
                  1 – 10
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {categories.map((cat, index) => (
                  <Controller
                    key={`${wheelType}-${index}`}
                    name={`values.${index}` as const}
                    control={form.control}
                    render={({ field }) => (
                      <div className="group rounded-lg border border-transparent px-3 py-2.5 transition-colors hover:border-warm-200 hover:bg-warm-50/50">
                        <div className="mb-2 flex items-center justify-between">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <label className="cursor-default text-sm font-medium leading-none text-warm-800">
                                {cat}
                              </label>
                            </TooltipTrigger>
                            <TooltipContent>
                              {cat}: {field.value}/10
                            </TooltipContent>
                          </Tooltip>
                          <ScoreIndicator
                            value={field.value}
                            color={colors.fill}
                          />
                        </div>
                        <Slider
                          value={[field.value]}
                          onValueChange={([val]) => field.onChange(val)}
                          min={1}
                          max={10}
                          step={1}
                          className="w-full cursor-pointer"
                          style={
                            {
                              "--slider-color": colors.fill,
                            } as React.CSSProperties
                          }
                        />
                      </div>
                    )}
                  />
                ))}
              </div>

              <div className="mt-5">
                <AverageScore values={values} color={colors.fill} />
              </div>
            </CardContent>
          </Card>

          {/* Notes card */}
          <Card className="border-warm-200/80 bg-card/80 shadow-sm backdrop-blur-sm">
            <CardContent className="pt-6">
              <Controller
                name="notes"
                control={form.control}
                render={({ field }) => (
                  <Field>
                    <FieldLabel htmlFor={field.name}>
                      Notas de la sesión
                    </FieldLabel>
                    <Textarea
                      {...field}
                      id={field.name}
                      placeholder="Observaciones, reflexiones o comentarios sobre la sesión…"
                      rows={4}
                      className="resize-none border-warm-200 bg-warm-50/50 focus-visible:border-terracotta focus-visible:ring-terracotta/20"
                    />
                  </Field>
                )}
              />

              <div className="mt-4 flex justify-end">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => form.reset()}
                  className="gap-2 text-warm-500 hover:bg-warm-100 hover:text-warm-700"
                >
                  <RotateCcw className="size-3.5" />
                  Reiniciar todo
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ── Chart column ─────────────────────────────────────────── */}
        <div className="flex flex-col gap-5 lg:sticky lg:top-8">
          <Card className="overflow-hidden border-warm-200/80 bg-card/80 shadow-sm backdrop-blur-sm">
            <CardHeader className="items-center border-b border-warm-100 bg-warm-50/30 pb-4">
              <CardTitle className="font-display text-lg tracking-wide text-warm-900">
                {WHEEL_TITLES[wheelType]}
              </CardTitle>
              {coacheeName && (
                <CardDescription className="text-center text-warm-500">
                  {coacheeName}
                </CardDescription>
              )}
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              <div ref={chartRef}>
                <ChartContainer
                  config={chartConfig}
                  className="mx-auto aspect-square w-full max-w-[500px]"
                >
                  <RadarChart data={chartData} outerRadius="70%">
                    <PolarGrid gridType="circle" />
                    <PolarAngleAxis
                      dataKey="category"
                      tick={(tickProps: Record<string, unknown>) => (
                        <CustomAngleTick
                          {...(tickProps as Parameters<
                            typeof CustomAngleTick
                          >[0])}
                        />
                      )}
                      tickLine={false}
                    />
                    <PolarRadiusAxis
                      domain={[0, 10]}
                      tickCount={11}
                      tick={false}
                      axisLine={false}
                    />
                    <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                    <Radar
                      name="Valoración"
                      dataKey="value"
                      stroke={colors.stroke}
                      fill={colors.fill}
                      fillOpacity={0.2}
                      strokeWidth={2.5}
                      dot={{
                        r: 4.5,
                        fill: colors.stroke,
                        strokeWidth: 2,
                        stroke: "#fff",
                      }}
                      animationDuration={600}
                      animationEasing="ease-out"
                    />
                  </RadarChart>
                </ChartContainer>
              </div>
            </CardContent>
          </Card>

          {/* Score summary strip */}
          <div className="grid grid-cols-4 gap-2 sm:grid-cols-4">
            {categories.slice(0, 4).map((cat, i) => (
              <div
                key={cat}
                className="rounded-lg border border-warm-200/70 bg-warm-50/60 px-3 py-2.5 text-center"
              >
                <div className="truncate text-[10px] font-medium text-warm-500">
                  {cat}
                </div>
                <div
                  className="mt-0.5 font-mono text-lg font-bold tabular-nums"
                  style={{ color: colors.stroke }}
                >
                  {values[i]}
                </div>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-4 gap-2 sm:grid-cols-4">
            {categories.slice(4).map((cat, i) => (
              <div
                key={cat}
                className="rounded-lg border border-warm-200/70 bg-warm-50/60 px-3 py-2.5 text-center"
              >
                <div className="truncate text-[10px] font-medium text-warm-500">
                  {cat}
                </div>
                <div
                  className="mt-0.5 font-mono text-lg font-bold tabular-nums"
                  style={{ color: colors.stroke }}
                >
                  {values[i + 4]}
                </div>
              </div>
            ))}
          </div>

          <Button
            size="lg"
            className="w-full cursor-pointer gap-2.5 bg-warm-800 text-warm-50 shadow-md transition-all hover:bg-warm-900 hover:shadow-lg active:scale-[0.98] disabled:opacity-40"
            onClick={handleExportPdf}
            disabled={!coacheeName || isExporting}
          >
            <Download className="size-4" />
            {isExporting ? "Generando PDF…" : "Guardar en PDF"}
          </Button>
        </div>
      </div>
    </TooltipProvider>
  );
}

// ── Utility: parse HSL string to RGB ────────────────────────────────────

function hslToRgb(hslStr: string): { r: number; g: number; b: number } {
  const match =
    /hsl\((\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)%\s+(\d+(?:\.\d+)?)%\)/.exec(hslStr);
  if (!match) return { r: 100, g: 100, b: 100 };
  const h = Number.parseFloat(match[1]) / 360;
  const s = Number.parseFloat(match[2]) / 100;
  const l = Number.parseFloat(match[3]) / 100;

  const hue2rgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };

  let r: number, g: number, b: number;
  if (s === 0) {
    r = g = b = l;
  } else {
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }

  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255),
  };
}
