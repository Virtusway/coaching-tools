"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
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
import { Download, PencilIcon, RotateCcw, UserIcon } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
} from "recharts";
import WheelOfLifeCustomDialog from "./wheel-of-life-custom-dialog";
import { AverageScore, ScoreIndicator } from "./wheel-of-life-metrics";
import {
  createDefaultCustomConfig,
  createDefaultScores,
  createInitialFormValues,
  formSchema,
  getWheelPresentation,
  WHEEL_ICONS,
  WHEEL_LABELS,
  WHEEL_TYPES,
  type CustomWheelConfig,
  type FormValues,
  type WheelType,
} from "./wheel-of-life-model";
import WheelScoreGrid from "./wheel-of-life-score-grid";
import {
  createPdfFilename,
  formatSpanishDate,
  hslToRgb,
  splitTickLabel,
  svgToDataUrl,
} from "./wheel-of-life-utils";

type CustomAngleTickProps = Readonly<{
  x: number;
  y: number;
  payload: { value: string };
  textAnchor: "start" | "middle" | "end";
}>;

function CustomAngleTick({
  x,
  y,
  payload,
  textAnchor,
}: Readonly<CustomAngleTickProps>) {
  const lines = splitTickLabel(payload.value);
  const lineHeight = 14;
  const yOffset = -((lines.length - 1) * lineHeight) / 2;

  return (
    <g transform={`translate(${x},${y})`}>
      {lines.map((line, index) => (
        <text
          key={`${line}-${index}`}
          x={0}
          y={yOffset + index * lineHeight}
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

export default function WheelOfLifeForm() {
  const chartRef = useRef<HTMLDivElement>(null);
  const previousWheelTypeRef = useRef<WheelType>("personal");

  const [isExporting, setIsExporting] = useState(false);
  const [isCustomDialogOpen, setIsCustomDialogOpen] = useState(false);
  const [isCustomConfigured, setIsCustomConfigured] = useState(false);
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);
  const [customConfig, setCustomConfig] = useState(createDefaultCustomConfig);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    mode: "onChange",
    defaultValues: createInitialFormValues(),
  });

  const wheelType =
    useWatch({ control: form.control, name: "wheelType" }) ?? "personal";
  const values = useWatch({ control: form.control, name: "values" });
  const coacheeName = useWatch({ control: form.control, name: "coacheeName" });

  const wheelPresentation = useMemo(() => {
    return getWheelPresentation(wheelType, customConfig);
  }, [customConfig, wheelType]);

  const chartConfig: ChartConfig = useMemo(() => {
    return {
      value: {
        label: "Valoración",
        color: wheelPresentation.colors.fill,
      },
    };
  }, [wheelPresentation.colors.fill]);

  const chartData = useMemo(() => {
    const scores = values ?? [];

    return wheelPresentation.categories.map((category, index) => {
      return {
        category,
        value: scores[index] ?? 5,
        fullMark: 10,
      };
    });
  }, [wheelPresentation.categories, values]);

  useEffect(() => {
    if (previousWheelTypeRef.current === wheelType) {
      return;
    }

    form.setValue(
      "values",
      createDefaultScores(wheelPresentation.categories.length),
    );
    previousWheelTypeRef.current = wheelType;
  }, [form, wheelPresentation.categories.length, wheelType]);

  const handleWheelTypeChange = (
    value: WheelType,
    onChange: (value: WheelType) => void,
  ) => {
    if (value === "personalizada" && !isCustomConfigured) {
      setIsCustomDialogOpen(true);
    }

    onChange(value);
  };

  const handleSaveCustomConfig = useCallback(
    (nextConfig: CustomWheelConfig) => {
      const previousCategoryCount = customConfig.categories.length;
      const nextCategoryCount = nextConfig.categories.length;

      setCustomConfig(nextConfig);
      setIsCustomConfigured(true);

      if (
        wheelType === "personalizada" &&
        previousCategoryCount !== nextCategoryCount
      ) {
        form.setValue("values", createDefaultScores(nextCategoryCount, values));
        return;
      }

      if (wheelType !== "personalizada") {
        form.setValue("wheelType", "personalizada");
        form.setValue("values", createDefaultScores(nextCategoryCount));
        previousWheelTypeRef.current = "personalizada";
      }
    },
    [customConfig.categories.length, form, values, wheelType],
  );

  const resetForm = () => {
    form.reset(createInitialFormValues());
    setCustomConfig(createDefaultCustomConfig());
    setIsCustomConfigured(false);
    setIsCustomDialogOpen(false);
    previousWheelTypeRef.current = "personal";
    setIsResetDialogOpen(false);
  };

  const handleExportPdf = useCallback(async () => {
    const isValid = await form.trigger();
    if (!isValid) {
      return;
    }

    setIsExporting(true);

    try {
      const {
        coacheeName: name,
        wheelType: selectedType,
        values,
        notes,
      } = form.getValues();
      const presentation = getWheelPresentation(selectedType, customConfig);

      const pdf = new jsPDF("portrait", "mm", "a4");
      const pageWidth = 210;

      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(18);
      pdf.text(presentation.title, pageWidth / 2, 22, { align: "center" });

      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(12);
      pdf.text(`Coachee: ${name}`, pageWidth / 2, 32, { align: "center" });

      pdf.setFontSize(10);
      pdf.text(`Fecha: ${formatSpanishDate()}`, pageWidth / 2, 39, {
        align: "center",
      });

      if (chartRef.current) {
        try {
          const chartImage = await svgToDataUrl(chartRef.current);
          const chartSize = 130;
          const xOffset = (pageWidth - chartSize) / 2;
          pdf.addImage(chartImage, "PNG", xOffset, 45, chartSize, chartSize);
        } catch {
          pdf.setFontSize(10);
          pdf.setTextColor(150);
          pdf.text("(No se pudo capturar el gráfico)", pageWidth / 2, 110, {
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

      presentation.categories.forEach((category, index) => {
        const score = values[index] ?? 5;
        const currentY = tableY + 8 + index * 7;

        pdf.text(`${category}:`, 28, currentY);
        pdf.text(`${score}/10`, 120, currentY);

        const barWidth = 50;
        const barX = 130;

        pdf.setDrawColor(200);
        pdf.setFillColor(230, 230, 230);
        pdf.roundedRect(barX, currentY - 3, barWidth, 4, 1, 1, "FD");

        const rgb = hslToRgb(presentation.colors.fill);
        pdf.setFillColor(rgb.r, rgb.g, rgb.b);
        pdf.roundedRect(
          barX,
          currentY - 3,
          (barWidth * score) / 10,
          4,
          1,
          1,
          "F",
        );
      });

      const notesY = tableY + 8 + presentation.categories.length * 7 + 8;
      const notesValue = (notes ?? "").trim();

      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(12);
      pdf.text("Notas:", 25, notesY);

      if (notesValue) {
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(10);
        const wrappedLines = pdf.splitTextToSize(notesValue, 160);
        pdf.text(wrappedLines, 25, notesY + 8);
      } else {
        pdf.setDrawColor(200);
        for (let index = 0; index < 4; index++) {
          const lineY = notesY + 8 + index * 8;
          pdf.line(25, lineY, 185, lineY);
        }
      }

      pdf.save(createPdfFilename(name));
    } finally {
      setIsExporting(false);
    }
  }, [customConfig, form]);

  return (
    <TooltipProvider>
      <WheelOfLifeCustomDialog
        key={`${isCustomDialogOpen}-${customConfig.title}-${customConfig.colorIndex}-${customConfig.categories.length}`}
        open={isCustomDialogOpen}
        onOpenChange={setIsCustomDialogOpen}
        config={customConfig}
        onSave={handleSaveCustomConfig}
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] lg:items-start lg:gap-8">
        <div className="space-y-5">
          <Card className="border-warm-200/80 bg-card/80 shadow-sm backdrop-blur-sm">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex size-9 items-center justify-center rounded-lg bg-warm-100 text-warm-600">
                  <UserIcon className="size-4" aria-hidden="true" />
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
              <form
                className="space-y-6"
                onSubmit={(event) => event.preventDefault()}
              >
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
                          name="coacheeName"
                          aria-invalid={fieldState.invalid}
                          placeholder="Ej: María García…"
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

                        <div className="flex gap-2">
                          <Select
                            name={field.name}
                            value={field.value}
                            onValueChange={(value) => {
                              handleWheelTypeChange(
                                value as WheelType,
                                field.onChange,
                              );
                            }}
                          >
                            <SelectTrigger
                              id="wheelType"
                              className="w-full cursor-pointer border-warm-200 bg-warm-50/50"
                              aria-invalid={fieldState.invalid}
                            >
                              <SelectValue placeholder="Selecciona un tipo" />
                            </SelectTrigger>

                            <SelectContent>
                              {WHEEL_TYPES.map((type) => {
                                const WheelIcon = WHEEL_ICONS[type];

                                return (
                                  <SelectItem key={type} value={type}>
                                    <span className="flex items-center gap-2">
                                      <WheelIcon
                                        className="size-4"
                                        aria-hidden="true"
                                      />
                                      {WHEEL_LABELS[type]}
                                    </span>
                                  </SelectItem>
                                );
                              })}
                            </SelectContent>
                          </Select>

                          {wheelPresentation.isCustom && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="icon"
                                  onClick={() => {
                                    setIsCustomDialogOpen(true);
                                  }}
                                  className="touch-manipulation shrink-0 border-warm-200 text-warm-500 hover:border-warm-300 hover:text-warm-700"
                                  aria-label="Editar rueda personalizada"
                                >
                                  <PencilIcon
                                    className="size-4"
                                    aria-hidden="true"
                                  />
                                </Button>
                              </TooltipTrigger>

                              <TooltipContent>
                                Editar rueda personalizada
                              </TooltipContent>
                            </Tooltip>
                          )}
                        </div>

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

          <Card className="border-warm-200/80 bg-card/80 shadow-sm backdrop-blur-sm">
            <CardHeader>
              <div className="flex items-center justify-between gap-4">
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
                  1 - 10
                </Badge>
              </div>
            </CardHeader>

            <CardContent>
              <div className="space-y-4">
                {wheelPresentation.categories.map((category, index) => (
                  <Controller
                    key={`${wheelType}-${index}`}
                    name={`values.${index}` as const}
                    control={form.control}
                    render={({ field }) => {
                      const currentValue =
                        typeof field.value === "number" ? field.value : 5;

                      return (
                        <div className="group rounded-lg border border-transparent px-3 py-2.5 transition-colors hover:border-warm-200 hover:bg-warm-50/50">
                          <div className="mb-2 flex items-center justify-between gap-3">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className="min-w-0 cursor-default text-sm font-medium leading-none text-warm-800">
                                  {category}
                                </span>
                              </TooltipTrigger>

                              <TooltipContent>
                                {category}: {currentValue}/10
                              </TooltipContent>
                            </Tooltip>

                            <ScoreIndicator
                              value={currentValue}
                              color={wheelPresentation.colors.fill}
                            />
                          </div>

                          <Slider
                            value={[currentValue]}
                            onValueChange={([nextValue = 5]) => {
                              field.onChange(nextValue);
                            }}
                            min={1}
                            max={10}
                            step={1}
                            className="w-full cursor-pointer"
                            style={
                              {
                                "--slider-color": wheelPresentation.colors.fill,
                              } as React.CSSProperties
                            }
                            aria-label={`Valoración para ${category}`}
                          />
                        </div>
                      );
                    }}
                  />
                ))}
              </div>

              <div className="mt-5">
                <AverageScore
                  values={values ?? []}
                  color={wheelPresentation.colors.fill}
                />
              </div>
            </CardContent>
          </Card>

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
                      name="notes"
                      placeholder="Observaciones, reflexiones o comentarios sobre la sesión…"
                      rows={4}
                      autoComplete="off"
                      className="resize-none border-warm-200 bg-warm-50/50 focus-visible:border-terracotta focus-visible:ring-terracotta/20"
                    />
                  </Field>
                )}
              />

              <div className="mt-4 flex justify-end">
                <AlertDialog
                  open={isResetDialogOpen}
                  onOpenChange={setIsResetDialogOpen}
                >
                  <AlertDialogTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="touch-manipulation gap-2 text-warm-500 hover:bg-warm-100 hover:text-warm-700"
                    >
                      <RotateCcw className="size-3.5" aria-hidden="true" />
                      Reiniciar Todo
                    </Button>
                  </AlertDialogTrigger>

                  <AlertDialogContent className="border-warm-200">
                    <AlertDialogHeader>
                      <AlertDialogTitle>
                        Reiniciar la sesión actual
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        Vas a borrar el nombre, las valoraciones, las notas y la
                        configuración personalizada. Esta acción no se puede
                        deshacer.
                      </AlertDialogDescription>
                    </AlertDialogHeader>

                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction
                        variant="destructive"
                        onClick={resetForm}
                      >
                        Reiniciar Todo
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col gap-5 lg:sticky lg:top-8">
          <Card className="overflow-hidden border-warm-200/80 bg-card/80 shadow-sm backdrop-blur-sm">
            <CardHeader className="items-center border-b border-warm-100 bg-warm-50/30 pb-4">
              <CardTitle className="font-display text-lg tracking-wide text-warm-900">
                {wheelPresentation.title}
              </CardTitle>

              {coacheeName?.trim() && (
                <CardDescription className="text-center text-warm-500">
                  {coacheeName}
                </CardDescription>
              )}
            </CardHeader>

            <CardContent className="p-4 sm:p-6">
              <div ref={chartRef}>
                <ChartContainer
                  config={chartConfig}
                  className="mx-auto aspect-square w-full max-w-125"
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
                      stroke={wheelPresentation.colors.stroke}
                      fill={wheelPresentation.colors.fill}
                      fillOpacity={0.2}
                      strokeWidth={2.5}
                      dot={{
                        r: 4.5,
                        fill: wheelPresentation.colors.stroke,
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

          <WheelScoreGrid
            categories={wheelPresentation.categories}
            values={values ?? []}
            strokeColor={wheelPresentation.colors.stroke}
          />

          <Button
            size="lg"
            className="w-full cursor-pointer gap-2.5 bg-warm-800 text-warm-50 shadow-md transition-[background-color,box-shadow,transform] hover:bg-warm-900 hover:shadow-lg active:scale-[0.98] disabled:opacity-40"
            onClick={handleExportPdf}
            disabled={!coacheeName?.trim() || isExporting}
          >
            <Download className="size-4" aria-hidden="true" />
            {isExporting ? "Generando PDF…" : "Guardar en PDF"}
          </Button>
        </div>
      </div>
    </TooltipProvider>
  );
}
