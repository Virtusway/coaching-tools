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

const DEFAULT_CUSTOM_CATEGORIES = [
  "Categoría 1",
  "Categoría 2",
  "Categoría 3",
  "Categoría 4",
  "Categoría 5",
  "Categoría 6",
  "Categoría 7",
  "Categoría 8",
];

export function createDefaultCustomConfig(): CustomWheelConfig {
  return {
    title: "Mi Rueda Personalizada",
    categories: [...DEFAULT_CUSTOM_CATEGORIES],
    colorIndex: 0,
  };
}

export const WHEEL_LABELS: Record<WheelType, string> = {
  personal: "Personal",
  pareja: "De Pareja",
  profesional: "Profesional",
  personalizada: "Personalizada",
};

export const WHEEL_TITLES: Record<WheelType, string> = {
  personal: "RUEDA DE LA VIDA PERSONAL",
  pareja: "RUEDA DE LA VIDA DE PAREJA",
  profesional: "RUEDA DE LA VIDA PROFESIONAL",
  personalizada: "RUEDA DE LA VIDA PERSONALIZADA",
};

export const WHEEL_ICONS: Record<WheelType, LucideIcon> = {
  personal: PersonStandingIcon,
  pareja: HeartIcon,
  profesional: BriefcaseIcon,
  personalizada: SettingsIcon,
};

export const WHEEL_CATEGORIES: Record<PresetWheelType, readonly string[]> = {
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

export const COLOR_PRESETS = [
  { name: "Terracota", fill: "hsl(20 60% 55%)", stroke: "hsl(20 65% 42%)" },
  { name: "Teal", fill: "hsl(172 50% 45%)", stroke: "hsl(172 55% 35%)" },
  { name: "Rosa", fill: "hsl(350 60% 55%)", stroke: "hsl(350 65% 42%)" },
  { name: "Azul", fill: "hsl(221 65% 50%)", stroke: "hsl(221 70% 38%)" },
  { name: "Violeta", fill: "hsl(270 55% 55%)", stroke: "hsl(270 60% 42%)" },
  { name: "Ámbar", fill: "hsl(38 70% 50%)", stroke: "hsl(38 75% 38%)" },
  {
    name: "Esmeralda",
    fill: "hsl(155 55% 42%)",
    stroke: "hsl(155 60% 32%)",
  },
  { name: "Índigo", fill: "hsl(240 55% 55%)", stroke: "hsl(240 60% 42%)" },
] as const;

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
): WheelPresentation {
  if (wheelType === "personalizada") {
    return {
      isCustom: true,
      title:
        customConfig.title.trim().toUpperCase() || WHEEL_TITLES.personalizada,
      categories: customConfig.categories,
      colors: getColorFromPreset(customConfig.colorIndex),
    };
  }

  return {
    isCustom: false,
    title: WHEEL_TITLES[wheelType],
    categories: WHEEL_CATEGORIES[wheelType],
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

export const formSchema = z.object({
  coacheeName: z.string().min(1, "El nombre del coachee es obligatorio"),
  wheelType: z.enum(WHEEL_TYPES),
  values: z
    .array(z.number().min(1).max(10))
    .min(MIN_CATEGORIES)
    .max(MAX_CATEGORIES),
  notes: z.string().optional(),
});

export type FormValues = z.infer<typeof formSchema>;

export function createInitialFormValues(): FormValues {
  return {
    coacheeName: "",
    wheelType: "personal",
    values: createDefaultScores(WHEEL_CATEGORIES.personal.length),
    notes: "",
  };
}
