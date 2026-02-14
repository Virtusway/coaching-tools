export const LOCALES = ["es", "en", "ca"] as const;

export type AppLocale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: AppLocale = "es";
export const LOCALE_COOKIE_NAME = "NEXT_LOCALE";

export function isAppLocale(value: string): value is AppLocale {
  return LOCALES.includes(value as AppLocale);
}
