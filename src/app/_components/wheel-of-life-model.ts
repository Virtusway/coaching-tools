import type { LucideIcon } from "lucide-react";
import {
  BriefcaseIcon,
  HeartIcon,
  PersonStandingIcon,
  SettingsIcon,
} from "lucide-react";
import * as z from "zod";

export const PRESET_WHEEL_TYPES = [
  "personal",
  "pareja",
  "profesional",
] as const;
export const WHEEL_TYPES = [...PRESET_WHEEL_TYPES, "personalizada"] as const;

export type PresetWheelType = (typeof PRESET_WHEEL_TYPES)[number];
export type WheelType = (typeof WHEEL_TYPES)[number];

export type WheelColor = {
  fill: string;
  stroke: string;
};

export interface CustomWheelConfig {
  title: string;
  categories: string[];
  colorIndex: number;
}

export const MIN_CATEGORIES = 4;
export const MAX_CATEGORIES = 12;

type ModelTranslator = (
  key: string,
  values?: Record<string, string | number>,
) => string;

const DEFAULT_CUSTOM_CATEGORY_COUNT = 8;

export function createDefaultCustomConfig(t: ModelTranslator): CustomWheelConfig {
  return {
    title: t("custom.defaultTitle"),
    categories: Array.from(
      { length: DEFAULT_CUSTOM_CATEGORY_COUNT },
      (_, index) => t("custom.defaultCategory", { index: index + 1 }),
    ),
    colorIndex: 0,
  };
}

export function getWheelLabels(t: ModelTranslator): Record<WheelType, string> {
  return {
    personal: t("labels.personal"),
    pareja: t("labels.pareja"),
    profesional: t("labels.profesional"),
    personalizada: t("labels.personalizada"),
  };
}

function getWheelTitles(t: ModelTranslator): Record<WheelType, string> {
  return {
    personal: t("titles.personal"),
    pareja: t("titles.pareja"),
    profesional: t("titles.profesional"),
    personalizada: t("titles.personalizada"),
  };
}

export const WHEEL_ICONS: Record<WheelType, LucideIcon> = {
  personal: PersonStandingIcon,
  pareja: HeartIcon,
  profesional: BriefcaseIcon,
  personalizada: SettingsIcon,
};

function getPresetWheelCategories(
  t: ModelTranslator,
): Record<PresetWheelType, readonly string[]> {
  return {
    personal: [
      t("categories.personal.leisure"),
      t("categories.personal.work"),
      t("categories.personal.mind"),
      t("categories.personal.friends"),
      t("categories.personal.physical"),
      t("categories.personal.finances"),
      t("categories.personal.ethics"),
      t("categories.personal.familyPartner"),
    ],
    pareja: [
      t("categories.pareja.leisure"),
      t("categories.pareja.living"),
      t("categories.pareja.projects"),
      t("categories.pareja.sexuality"),
      t("categories.pareja.environment"),
      t("categories.pareja.finances"),
      t("categories.pareja.family"),
      t("categories.pareja.affectionCommunication"),
    ],
    profesional: [
      t("categories.profesional.teamRelations"),
      t("categories.profesional.innerLeadership"),
      t("categories.profesional.leadingOthers"),
      t("categories.profesional.finances"),
      t("categories.profesional.longTermVision"),
      t("categories.profesional.effectiveCommunication"),
      t("categories.profesional.productEvaluation"),
      t("categories.profesional.customerService"),
    ],
  };
}

export const COLOR_PRESETS = [
  {
    id: "terracotta",
    fill: "hsl(20 60% 55%)",
    stroke: "hsl(20 65% 42%)",
  },
  { id: "teal", fill: "hsl(172 50% 45%)", stroke: "hsl(172 55% 35%)" },
  { id: "pink", fill: "hsl(350 60% 55%)", stroke: "hsl(350 65% 42%)" },
  { id: "blue", fill: "hsl(221 65% 50%)", stroke: "hsl(221 70% 38%)" },
  {
    id: "violet",
    fill: "hsl(270 55% 55%)",
    stroke: "hsl(270 60% 42%)",
  },
  { id: "amber", fill: "hsl(38 70% 50%)", stroke: "hsl(38 75% 38%)" },
  {
    id: "emerald",
    fill: "hsl(155 55% 42%)",
    stroke: "hsl(155 60% 32%)",
  },
  {
    id: "indigo",
    fill: "hsl(240 55% 55%)",
    stroke: "hsl(240 60% 42%)",
  },
] as const;

export function getColorPresetLabel(
  presetId: (typeof COLOR_PRESETS)[number]["id"],
  t: ModelTranslator,
): string {
  return t(`colors.${presetId}`);
}

function getColorFromPreset(colorIndex: number): WheelColor {
  const preset = COLOR_PRESETS[colorIndex] ?? COLOR_PRESETS[0];
  return { fill: preset.fill, stroke: preset.stroke };
}

export const WHEEL_COLORS: Record<WheelType, WheelColor> = {
  personal: { fill: "hsl(172 50% 45%)", stroke: "hsl(172 55% 35%)" },
  pareja: { fill: "hsl(350 60% 55%)", stroke: "hsl(350 65% 42%)" },
  profesional: { fill: "hsl(221 65% 50%)", stroke: "hsl(221 70% 38%)" },
  personalizada: getColorFromPreset(0),
};

export type WheelPresentation = {
  isCustom: boolean;
  title: string;
  categories: readonly string[];
  colors: WheelColor;
};

export function getWheelPresentation(
  wheelType: WheelType,
  customConfig: CustomWheelConfig,
  t: ModelTranslator,
): WheelPresentation {
  const wheelTitles = getWheelTitles(t);

  if (wheelType === "personalizada") {
    return {
      isCustom: true,
      title: customConfig.title.trim().toLocaleUpperCase() || wheelTitles.personalizada,
      categories: customConfig.categories,
      colors: getColorFromPreset(customConfig.colorIndex),
    };
  }

  const presetWheelCategories = getPresetWheelCategories(t);

  return {
    isCustom: false,
    title: wheelTitles[wheelType],
    categories: presetWheelCategories[wheelType],
    colors: WHEEL_COLORS[wheelType],
  };
}

export function createDefaultScores(
  categoriesCount: number,
  previousScores?: readonly number[],
): number[] {
  return Array.from({ length: categoriesCount }, (_, index) => {
    return previousScores?.[index] ?? 5;
  });
}

export function createFormSchema(t: ModelTranslator) {
  return z.object({
    coacheeName: z.string().min(1, t("validation.coacheeNameRequired")),
    wheelType: z.enum(WHEEL_TYPES),
    values: z
      .array(z.number().min(1).max(10))
      .min(MIN_CATEGORIES)
      .max(MAX_CATEGORIES),
    notes: z.string().optional(),
  });
}

export type FormValues = z.infer<ReturnType<typeof createFormSchema>>;

export function createInitialFormValues(t: ModelTranslator): FormValues {
  const presetWheelCategories = getPresetWheelCategories(t);

  return {
    coacheeName: "",
    wheelType: "personal",
    values: createDefaultScores(presetWheelCategories.personal.length),
    notes: "",
  };
}
