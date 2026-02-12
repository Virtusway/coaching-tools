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
import { PlusIcon, TrashIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import type { CustomWheelConfig } from "./wheel-of-life-model";
import { MAX_CATEGORIES, MIN_CATEGORIES } from "./wheel-of-life-model";

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
  const tModel = useTranslations("WheelModel");
  const [draft, setDraft] = useState<CustomWheelConfig>(config);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const updateCategory = (index: number, value: string) => {
    setDraft((current) => {
      const nextCategories = [...current.categories];
      nextCategories[index] = value;
      return { ...current, categories: nextCategories };
    });
  };

  const handleAddCategory = () => {
    if (draft.categories.length >= MAX_CATEGORIES) {
      return;
    }

    setDraft((current) => ({
      ...current,
      categories: [
        ...current.categories,
        tModel("custom.defaultCategory", {
          index: current.categories.length + 1,
        }),
      ],
    }));
  };

  const handleRemoveCategory = (index: number) => {
    if (draft.categories.length <= MIN_CATEGORIES) {
      return;
    }

    setDraft((current) => ({
      ...current,
      categories: current.categories.filter((_, currentIndex) => {
        return currentIndex !== index;
      }),
    }));
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
            {t("description", { min: MIN_CATEGORIES, max: MAX_CATEGORIES })}
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
              <FieldLabel>
                {t("categoriesLabel", {
                  current: draft.categories.length,
                  max: MAX_CATEGORIES,
                })}
              </FieldLabel>

              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleAddCategory}
                disabled={draft.categories.length >= MAX_CATEGORIES}
                className="touch-manipulation gap-1 text-warm-500 hover:text-warm-700"
              >
                <PlusIcon className="size-3.5" aria-hidden="true" />
                {t("addCategory")}
              </Button>
            </div>

            <div className="mt-2 space-y-2">
              {draft.categories.map((category, index) => {
                const error = errors[`cat-${index}`];

                return (
                  <div key={category} className="flex items-center gap-2">
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

                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        handleRemoveCategory(index);
                      }}
                      disabled={draft.categories.length <= MIN_CATEGORIES}
                      className="touch-manipulation size-8 shrink-0 text-warm-400 hover:text-destructive"
                      aria-label={t("removeCategoryAria", { index: index + 1 })}
                    >
                      <TrashIcon className="size-3.5" aria-hidden="true" />
                    </Button>

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
