"use client";

import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PLATFORM_CURRENCY_OPTIONS } from "@/lib/constants/platform-currencies";
import type { PlatformSettingsResponse } from "@/lib/types/platform-settings";
import { useApiClient } from "@/lib/use-api-client";

export function PlatformSettingsForm({
  initial,
}: {
  initial: PlatformSettingsResponse;
}) {
  const t = useTranslations("platform_settings");
  const api = useApiClient();
  const router = useRouter();
  const [foodVatPercent, setFoodVatPercent] = useState(
    Number.parseFloat(initial.foodVatPercent) || 0,
  );
  const [currencyCode, setCurrencyCode] = useState(initial.currencyCode);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await api.patch<PlatformSettingsResponse>("/platform/settings", {
        foodVatPercent,
        currencyCode,
      });
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("save_error"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSave} className="max-w-md space-y-6">
      <div className="space-y-2">
        <Label htmlFor="vat">{t("vat_label")}</Label>
        <Input
          id="vat"
          type="number"
          min={0}
          max={100}
          step={0.01}
          value={Number.isFinite(foodVatPercent) ? foodVatPercent : 0}
          onChange={(e) =>
            setFoodVatPercent(Number.parseFloat(e.target.value) || 0)
          }
        />
        <p className="text-caption text-neutral-30">{t("vat_hint")}</p>
      </div>
      <div className="space-y-2">
        <Label>{t("currency_label")}</Label>
        <Select value={currencyCode} onValueChange={setCurrencyCode}>
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PLATFORM_CURRENCY_OPTIONS.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-caption text-neutral-30">{t("currency_hint")}</p>
      </div>
      {error ? (
        <p className="text-body text-destructive" role="alert">
          {error}
        </p>
      ) : null}
      <Button type="submit" disabled={busy}>
        {busy ? t("saving") : t("save")}
      </Button>
    </form>
  );
}
