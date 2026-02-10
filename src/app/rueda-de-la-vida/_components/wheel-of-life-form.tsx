"use client";

import { useRef, useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
} from "recharts";
import { jsPDF } from "jspdf";
import { Download, RotateCcw } from "lucide-react";

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Field,
  FieldLabel,
  FieldError,
  FieldGroup,
} from "@/components/ui/field";
import { Badge } from "@/components/ui/badge";

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

// Category order follows the images (clockwise from top‑left)
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
  personal: { fill: "hsl(172 66% 50%)", stroke: "hsl(172 66% 38%)" },
  pareja: { fill: "hsl(340 75% 55%)", stroke: "hsl(340 75% 42%)" },
  profesional: { fill: "hsl(221 83% 53%)", stroke: "hsl(221 83% 40%)" },
};

// ── Zod schema ──────────────────────────────────────────────────────────

const DEFAULT_VALUES = [5, 5, 5, 5, 5, 5, 5, 5] as const;

const formSchema = z.object({
  coacheeName: z.string().min(1, "El nombre del coachee es obligatorio"),
  wheelType: z.enum(WHEEL_TYPES),
  values: z.array(z.number().min(1).max(10)).length(8),
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
  // Split on "/" or when text > 14 chars
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

  // Copy computed styles for every text node so they survive serialisation
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

  // Add a white background rect
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
      const ctx = c.getContext("2d")!;
      ctx.fillStyle = "#fff";
      ctx.fillRect(0, 0, w, h);
      ctx.drawImage(img, 0, 0, w, h);
      URL.revokeObjectURL(url);
      resolve(c.toDataURL("image/png"));
    };
    img.onerror = reject;
    img.src = url;
  });
}

// ── Main component ──────────────────────────────────────────────────────

export default function WheelOfLifeForm() {
  const chartRef = useRef<HTMLDivElement>(null);
  const prevType = useRef<WheelType>("personal");

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    mode: "onChange",
    defaultValues: {
      coacheeName: "",
      wheelType: "personal",
      values: [...DEFAULT_VALUES],
    },
  });

  const wheelType = form.watch("wheelType");
  const values = form.watch("values");
  const coacheeName = form.watch("coacheeName");
  const categories = WHEEL_CATEGORIES[wheelType];
  const colors = WHEEL_COLORS[wheelType];

  // Reset values when wheel type changes
  useEffect(() => {
    if (prevType.current !== wheelType) {
      form.setValue("values", [...DEFAULT_VALUES]);
      prevType.current = wheelType;
    }
  }, [wheelType, form]);

  // Chart config for ChartContainer
  const chartConfig: ChartConfig = {
    value: {
      label: "Valoración",
      color: colors.fill,
    },
  };

  // Data for the radar chart
  const chartData = categories.map((cat, i) => ({
    category: cat,
    value: values[i] ?? 5,
    fullMark: 10,
  }));

  // ── PDF export handler ────────────────────────────────────────────────

  const handleExportPdf = async () => {
    // Trigger validation
    const valid = await form.trigger();
    if (!valid) return;

    const name = form.getValues("coacheeName");
    const type = form.getValues("wheelType");
    const vals = form.getValues("values");
    const cats = WHEEL_CATEGORIES[type];
    const title = WHEEL_TITLES[type];

    const pdf = new jsPDF("portrait", "mm", "a4");
    const pageW = 210;

    // Title
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(18);
    pdf.text(title, pageW / 2, 22, { align: "center" });

    // Coachee name
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(12);
    pdf.text(`Coachee: ${name}`, pageW / 2, 32, { align: "center" });

    // Date
    pdf.setFontSize(10);
    pdf.text(
      `Fecha: ${new Date().toLocaleDateString("es-ES", { year: "numeric", month: "long", day: "numeric" })}`,
      pageW / 2,
      39,
      { align: "center" },
    );

    // Chart image
    if (chartRef.current) {
      try {
        const imgData = await svgToDataUrl(chartRef.current);
        const chartSize = 130;
        const xOffset = (pageW - chartSize) / 2;
        pdf.addImage(imgData, "PNG", xOffset, 45, chartSize, chartSize);
      } catch {
        // If chart capture fails, continue with text only
        pdf.setFontSize(10);
        pdf.setTextColor(150);
        pdf.text("(No se pudo capturar el gráfico)", pageW / 2, 110, {
          align: "center",
        });
        pdf.setTextColor(0);
      }
    }

    // Values table
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
      // Draw a mini bar
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

    // Notes section
    const notesY = tableY + 8 + cats.length * 7 + 8;
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(12);
    pdf.text("Notas:", 25, notesY);
    pdf.setDrawColor(200);
    for (let i = 0; i < 4; i++) {
      const lY = notesY + 8 + i * 8;
      pdf.line(25, lY, 185, lY);
    }

    pdf.save(`rueda-vida-${name.replaceAll(/\s+/g, "-").toLowerCase()}.pdf`);
  };

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] lg:items-start">
      {/* ── Form column ──────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle>Datos del Coachee</CardTitle>
          <CardDescription>
            Introduce el nombre, selecciona el tipo de rueda y ajusta las
            valoraciones de cada categoría.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-8" onSubmit={(e) => e.preventDefault()}>
            <FieldGroup>
              {/* Name */}
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
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />

              {/* Wheel type */}
              <Controller
                name="wheelType"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="wheelType">Tipo de Rueda</FieldLabel>
                    <Select
                      name={field.name}
                      value={field.value}
                      onValueChange={field.onChange}
                    >
                      <SelectTrigger
                        id="wheelType"
                        className="w-full"
                        aria-invalid={fieldState.invalid}
                      >
                        <SelectValue placeholder="Selecciona un tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        {WHEEL_TYPES.map((t) => (
                          <SelectItem key={t} value={t}>
                            {WHEEL_LABELS[t]}
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

            {/* Category sliders */}
            <div className="space-y-2">
              <h3 className="text-sm font-medium leading-none">
                Valoraciones (1 – 10)
              </h3>
              <p className="text-muted-foreground text-sm">
                Ajusta cada categoría según la situación actual del coachee.
              </p>
              <div className="mt-4 space-y-5">
                {categories.map((cat, index) => (
                  <Controller
                    key={`${wheelType}-${index}`}
                    name={`values.${index}` as const}
                    control={form.control}
                    render={({ field }) => (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="text-sm font-medium leading-none">
                            {cat}
                          </label>
                          <Badge
                            variant="secondary"
                            className="tabular-nums font-mono text-xs"
                          >
                            {field.value}
                          </Badge>
                        </div>
                        <Slider
                          value={[field.value]}
                          onValueChange={([val]) => field.onChange(val)}
                          min={1}
                          max={10}
                          step={1}
                          className="w-full"
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
            </div>

            {/* Reset */}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => form.reset()}
              className="gap-2"
            >
              <RotateCcw className="size-4" />
              Reiniciar
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* ── Chart column ─────────────────────────────────────────── */}
      <div className="flex flex-col gap-4 lg:sticky lg:top-8">
        <Card>
          <CardHeader className="items-center pb-2">
            <CardTitle className="text-center">
              {WHEEL_TITLES[wheelType]}
            </CardTitle>
            {coacheeName && (
              <CardDescription className="text-center">
                {coacheeName}
              </CardDescription>
            )}
          </CardHeader>
          <CardContent>
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
                    fillOpacity={0.25}
                    strokeWidth={2}
                    dot={{
                      r: 4,
                      fill: colors.stroke,
                      strokeWidth: 0,
                    }}
                    animationDuration={600}
                    animationEasing="ease-out"
                  />
                </RadarChart>
              </ChartContainer>
            </div>
          </CardContent>
        </Card>

        <Button
          size="lg"
          className="w-full gap-2"
          onClick={handleExportPdf}
          disabled={!coacheeName}
        >
          <Download className="size-4" />
          Guardar en PDF
        </Button>
      </div>
    </div>
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
