"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useTranslations } from "next-intl";
import { useState } from "react";
import type { CustomWheelConfig } from "./wheel-of-life-model";

type CustomDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  config: CustomWheelConfig;
  onSave: (config: CustomWheelConfig) => void;
};

function validateDraft(
  config: CustomWheelConfig,
  t: (key: string, values?: Record<string, string | number>) => string,
): Record<string, string> {
  const errors: Record<string, string> = {};

  if (!config.title.trim()) {
    errors.title = t("validation.titleRequired");
  }

  const emptyCategoryIndex = config.categories.findIndex(
    (category) => !category.trim(),
  );
  if (emptyCategoryIndex >= 0) {
    errors[`cat-${emptyCategoryIndex}`] = t("validation.categoryEmpty");
  }

  const seenCategories = new Set<string>();
  for (let index = 0; index < config.categories.length; index++) {
    const normalizedCategory = config.categories[index].trim().toLowerCase();
    if (seenCategories.has(normalizedCategory)) {
      errors[`cat-${index}`] = t("validation.categoryDuplicated");
      break;
    }

    seenCategories.add(normalizedCategory);
  }

  return errors;
}

export default function WheelOfLifeCustomDialog({
  open,
  onOpenChange,
  config,
  onSave,
}: Readonly<CustomDialogProps>) {
  const t = useTranslations("WheelCustomDialog");
  const [draft, setDraft] = useState<CustomWheelConfig>(config);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const updateCategory = (index: number, value: string) => {
    setDraft((current) => {
      const nextCategories = [...current.categories];
      nextCategories[index] = value;
      return { ...current, categories: nextCategories };
    });
  };

  const handleSave = () => {
    const validationErrors = validateDraft(draft, t);
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    onSave({
      ...draft,
      title: draft.title.trim(),
      categories: draft.categories.map((category) => category.trim()),
    });

    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-warm-900">{t("title")}</DialogTitle>
          <DialogDescription className="text-warm-500">
            {t("description")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          <Field data-invalid={Boolean(errors.title)}>
            <FieldLabel htmlFor="custom-title">
              {t("wheelTitleLabel")}
            </FieldLabel>
            <Input
              id="custom-title"
              name="custom-title"
              value={draft.title}
              onChange={(event) => {
                setDraft((current) => ({
                  ...current,
                  title: event.target.value,
                }));
              }}
              placeholder={t("wheelTitlePlaceholder")}
              autoComplete="off"
              className="border-warm-200 bg-warm-50/50 focus-visible:border-terracotta focus-visible:ring-terracotta/20"
              aria-invalid={Boolean(errors.title)}
            />

            {errors.title && (
              <p className="text-destructive mt-1 text-xs" aria-live="polite">
                {errors.title}
              </p>
            )}
          </Field>

          <div>
            <div className="flex items-center justify-between">
              <FieldLabel>{t("categoriesLabel")}</FieldLabel>
            </div>

            <div className="mt-2 space-y-2">
              {draft.categories.map((category, index) => {
                const error = errors[`cat-${index}`];

                return (
                  <div key={index} className="flex items-center gap-2">
                    <span className="w-5 text-center text-xs font-mono text-warm-400">
                      {index + 1}
                    </span>

                    <Input
                      name={`custom-category-${index + 1}`}
                      value={category}
                      onChange={(event) => {
                        updateCategory(index, event.target.value);
                      }}
                      placeholder={t("categoryPlaceholder", {
                        index: index + 1,
                      })}
                      autoComplete="off"
                      className="border-warm-200 bg-warm-50/50 focus-visible:border-terracotta focus-visible:ring-terracotta/20"
                      aria-invalid={Boolean(error)}
                    />

                    {error && (
                      <p
                        className="text-destructive whitespace-nowrap text-xs"
                        aria-live="polite"
                      >
                        {error}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              onOpenChange(false);
            }}
            className="border-warm-200 text-warm-600"
          >
            {t("cancel")}
          </Button>

          <Button
            type="button"
            onClick={handleSave}
            className="bg-warm-800 text-warm-50 hover:bg-warm-900"
          >
            {t("save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
