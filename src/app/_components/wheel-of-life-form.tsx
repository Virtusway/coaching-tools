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
import { useLocale, useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import WheelOfLifeChart from "./wheel-of-life-chart";
import WheelOfLifeCustomDialog from "./wheel-of-life-custom-dialog";
import { AverageScore, ScoreIndicator } from "./wheel-of-life-metrics";
import {
  createDefaultCustomConfig,
  createDefaultScores,
  createFormSchema,
  createInitialFormValues,
  getWheelLabels,
  getWheelPresentation,
  WHEEL_ICONS,
  WHEEL_TYPES,
  type CustomWheelConfig,
  type FormValues,
  type WheelType,
} from "./wheel-of-life-model";
import WheelScoreGrid from "./wheel-of-life-score-grid";
import {
  createPdfFilename,
  formatDateForLocale,
  getHueFromHsl,
  getWheelColor,
  hslToRgb,
  svgToDataUrl,
} from "./wheel-of-life-utils";

export default function WheelOfLifeForm() {
  const locale = useLocale();
  const t = useTranslations("WheelForm");
  const tModel = useTranslations("WheelModel");

  const chartRef = useRef<HTMLDivElement>(null);
  const previousWheelTypeRef = useRef<WheelType>("personal");

  const [isExporting, setIsExporting] = useState(false);
  const [isCustomDialogOpen, setIsCustomDialogOpen] = useState(false);
  const [isCustomConfigured, setIsCustomConfigured] = useState(false);
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);
  const [customConfig, setCustomConfig] = useState<CustomWheelConfig>(() =>
    createDefaultCustomConfig(tModel),
  );

  const formSchema = useMemo(() => createFormSchema(tModel), [tModel]);
  const initialFormValues = useMemo(
    () => createInitialFormValues(tModel),
    [tModel],
  );
  const wheelLabels = useMemo(() => getWheelLabels(tModel), [tModel]);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    mode: "onChange",
    defaultValues: initialFormValues,
  });

  const wheelType =
    useWatch({ control: form.control, name: "wheelType" }) ?? "personal";
  const values = useWatch({ control: form.control, name: "values" });
  const coacheeName = useWatch({ control: form.control, name: "coacheeName" });

  const wheelPresentation = useMemo(() => {
    return getWheelPresentation(wheelType, customConfig, tModel);
  }, [customConfig, tModel, wheelType]);

  const baseHue = useMemo(
    () => getHueFromHsl(wheelPresentation.colors.fill),
    [wheelPresentation.colors.fill],
  );

  useEffect(() => {
    if (isCustomConfigured) {
      return;
    }

    setCustomConfig(createDefaultCustomConfig(tModel));
  }, [isCustomConfigured, tModel]);

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
    form.reset(createInitialFormValues(tModel));
    setCustomConfig(createDefaultCustomConfig(tModel));
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
      const presentation = getWheelPresentation(
        selectedType,
        customConfig,
        tModel,
      );

      const pdf = new jsPDF("portrait", "mm", "a4");
      const pageWidth = 210;

      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(18);
      pdf.text(presentation.title, pageWidth / 2, 22, { align: "center" });

      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(12);
      pdf.text(`${t("pdf.coachee")}: ${name}`, pageWidth / 2, 32, {
        align: "center",
      });

      pdf.setFontSize(10);
      pdf.text(
        `${t("pdf.date")}: ${formatDateForLocale(locale)}`,
        pageWidth / 2,
        39,
        {
          align: "center",
        },
      );

      if (chartRef.current) {
        try {
          const chartImage = await svgToDataUrl(chartRef.current);
          const chartSize = 130;
          const xOffset = (pageWidth - chartSize) / 2;
          pdf.addImage(chartImage, "PNG", xOffset, 45, chartSize, chartSize);
        } catch {
          pdf.setFontSize(10);
          pdf.setTextColor(150);
          pdf.text(t("pdf.chartCaptureError"), pageWidth / 2, 110, {
            align: "center",
          });
          pdf.setTextColor(0);
        }
      }

      const tableY = 182;
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(12);
      pdf.text(`${t("pdf.ratings")}:`, 25, tableY);

      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(10);

      presentation.categories.forEach((category, index) => {
        const score = values[index] ?? 5;
        const currentY = tableY + 8 + index * 7;
        const { fill } = getWheelColor(
          index,
          presentation.categories.length,
          getHueFromHsl(presentation.colors.fill),
        );

        pdf.text(`${category}:`, 28, currentY);
        pdf.text(`${score}/10`, 120, currentY);

        const barWidth = 50;
        const barX = 130;

        pdf.setDrawColor(200);
        pdf.setFillColor(230, 230, 230);
        pdf.roundedRect(barX, currentY - 3, barWidth, 4, 1, 1, "FD");

        const rgb = hslToRgb(fill);
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
      pdf.text(`${t("pdf.notes")}:`, 25, notesY);

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

      pdf.save(
        createPdfFilename(name, t("pdf.filePrefix"), t("pdf.fileFallback")),
      );
    } finally {
      setIsExporting(false);
    }
  }, [customConfig, form, locale, t, tModel]);

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
          <Card className="border-warm-200/60 bg-card/90 shadow-sm backdrop-blur-sm">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex size-9 items-center justify-center rounded-xl bg-linear-to-br from-warm-100 to-warm-200/60 text-warm-600 shadow-[inset_0_1px_0_rgba(255,255,255,0.5)]">
                  <UserIcon className="size-4" aria-hidden="true" />
                </div>

                <div>
                  <CardTitle className="text-warm-900">
                    {t("coacheeCard.title")}
                  </CardTitle>
                  <CardDescription className="text-warm-500">
                    {t("coacheeCard.description")}
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
                          {t("coacheeCard.nameLabel")}
                        </FieldLabel>

                        <Input
                          {...field}
                          id={field.name}
                          name="coacheeName"
                          aria-invalid={fieldState.invalid}
                          placeholder={t("coacheeCard.namePlaceholder")}
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
                          {t("coacheeCard.wheelTypeLabel")}
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
                              <SelectValue
                                placeholder={t(
                                  "coacheeCard.wheelTypePlaceholder",
                                )}
                              />
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
                                      {wheelLabels[type]}
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
                                  aria-label={t("coacheeCard.editCustomWheel")}
                                >
                                  <PencilIcon
                                    className="size-4"
                                    aria-hidden="true"
                                  />
                                </Button>
                              </TooltipTrigger>

                              <TooltipContent>
                                {t("coacheeCard.editCustomWheel")}
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

          <Card className="border-warm-200/60 bg-card/90 shadow-sm backdrop-blur-sm">
            <CardHeader>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <CardTitle className="text-warm-900">
                    {t("ratingsCard.title")}
                  </CardTitle>
                  <CardDescription className="text-warm-500">
                    {t("ratingsCard.description")}
                  </CardDescription>
                </div>

                <Badge
                  variant="outline"
                  className="border-warm-300/80 bg-warm-50/80 font-mono text-[11px] text-warm-500"
                >
                  {t("ratingsCard.range")}
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

                      const { fill } = getWheelColor(
                        index,
                        wheelPresentation.categories.length,
                        baseHue,
                      );

                      return (
                        <div className="group rounded-xl border border-transparent px-3.5 py-3 transition-all duration-200 hover:border-warm-200/80 hover:bg-warm-50/40 hover:shadow-[0_1px_4px_rgba(0,0,0,0.03)]">
                          <div className="mb-2.5 flex items-center justify-between gap-3">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className="min-w-0 cursor-default text-[13px] font-medium leading-none text-warm-800">
                                  {category}
                                </span>
                              </TooltipTrigger>

                              <TooltipContent>
                                {t("ratingsCard.categoryScore", {
                                  category,
                                  value: currentValue,
                                })}
                              </TooltipContent>
                            </Tooltip>

                            <ScoreIndicator value={currentValue} color={fill} />
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
                                "--slider-color": fill,
                              } as React.CSSProperties
                            }
                            aria-label={t("ratingsCard.sliderAria", {
                              category,
                            })}
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
                  fill={wheelPresentation.colors.fill}
                  stroke={wheelPresentation.colors.stroke}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="border-warm-200/60 bg-card/90 shadow-sm backdrop-blur-sm">
            <CardContent className="pt-6">
              <Controller
                name="notes"
                control={form.control}
                render={({ field }) => (
                  <Field>
                    <FieldLabel htmlFor={field.name}>
                      {t("notes.label")}
                    </FieldLabel>

                    <Textarea
                      {...field}
                      id={field.name}
                      name="notes"
                      placeholder={t("notes.placeholder")}
                      rows={4}
                      autoComplete="off"
                      className="resize-none border-warm-200 bg-warm-50/30 focus-visible:border-terracotta focus-visible:ring-terracotta/20"
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
                      {t("reset.button")}
                    </Button>
                  </AlertDialogTrigger>

                  <AlertDialogContent className="border-warm-200">
                    <AlertDialogHeader>
                      <AlertDialogTitle>
                        {t("reset.dialogTitle")}
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        {t("reset.dialogDescription")}
                      </AlertDialogDescription>
                    </AlertDialogHeader>

                    <AlertDialogFooter>
                      <AlertDialogCancel>{t("reset.cancel")}</AlertDialogCancel>
                      <AlertDialogAction
                        variant="destructive"
                        onClick={resetForm}
                      >
                        {t("reset.confirm")}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col gap-5 lg:sticky lg:top-8">
          <Card className="overflow-hidden border-warm-200/60 bg-card/90 shadow-md backdrop-blur-sm">
            <CardHeader className="items-center border-b border-warm-100/80 bg-linear-to-b from-warm-50/50 to-transparent pb-5">
              <CardTitle className="font-display text-lg tracking-wide text-warm-900">
                {wheelPresentation.title}
              </CardTitle>

              {coacheeName?.trim() && (
                <CardDescription className="text-center text-sm text-warm-500">
                  {coacheeName}
                </CardDescription>
              )}
            </CardHeader>

            <CardContent className="p-4 sm:p-6">
              <div
                ref={chartRef}
                className="mx-auto aspect-square w-full max-w-125 flex items-center justify-center"
              >
                <WheelOfLifeChart data={chartData} baseHue={baseHue} />
              </div>
            </CardContent>
          </Card>

          <WheelScoreGrid
            categories={wheelPresentation.categories}
            values={values ?? []}
            baseHue={baseHue}
          />

          <Button
            size="lg"
            className="w-full cursor-pointer gap-2.5 rounded-xl bg-warm-900 text-warm-50 shadow-[0_2px_8px_rgba(0,0,0,0.12)] transition-all duration-200 hover:bg-warm-800 hover:shadow-[0_4px_16px_rgba(0,0,0,0.16)] hover:-translate-y-px active:translate-y-0 active:shadow-[0_1px_4px_rgba(0,0,0,0.1)] disabled:opacity-40 disabled:hover:translate-y-0"
            onClick={handleExportPdf}
            disabled={!coacheeName?.trim() || isExporting}
          >
            <Download className="size-4" aria-hidden="true" />
            {isExporting ? t("export.generating") : t("export.save")}
          </Button>
        </div>
      </div>
    </TooltipProvider>
  );
}
