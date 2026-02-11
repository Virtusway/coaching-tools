"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { isAppLocale, LOCALE_COOKIE_NAME, LOCALES } from "@/i18n/config";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";

export default function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const t = useTranslations("LanguageSwitcher");

  return (
    <div className="flex items-center justify-center gap-2 sm:justify-end">
      <span className="text-[11px] font-medium tracking-wide text-warm-500 uppercase">
        {t("label")}
      </span>

      <Select
        value={locale}
        onValueChange={(nextLocale) => {
          if (!isAppLocale(nextLocale) || nextLocale === locale) {
            return;
          }

          document.cookie = `${LOCALE_COOKIE_NAME}=${nextLocale}; path=/; max-age=31536000; samesite=lax`;
          router.refresh();
        }}
      >
        <SelectTrigger className="w-32 cursor-pointer border-warm-200 bg-warm-50/50 text-xs">
          <SelectValue />
        </SelectTrigger>

        <SelectContent>
          {LOCALES.map((supportedLocale) => (
            <SelectItem key={supportedLocale} value={supportedLocale}>
              {t(`options.${supportedLocale}`)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
