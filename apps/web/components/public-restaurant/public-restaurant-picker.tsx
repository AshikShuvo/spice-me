"use client";

import * as React from "react";
import { usePathname as useRawPathname } from "next/navigation";
import { useTranslations } from "next-intl";

import { usePublicRestaurant } from "@/components/public-restaurant/public-restaurant-context";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useRouter } from "@/i18n/navigation";
import { fetchRestaurantsBrowseClient } from "@/lib/fetch-restaurants-browse-client";
import type { RestaurantBrowseItem } from "@/lib/fetch-restaurants-browse-client";
import { stripLocalePrefix } from "@/lib/i18n-pathname";

const ALL = "__all__";

export function PublicRestaurantPicker() {
  const t = useTranslations("header");
  const rawPathname = useRawPathname() ?? "/";
  const pathname = stripLocalePrefix(rawPathname);
  const router = useRouter();
  const { restaurantCode, setRestaurantCode } = usePublicRestaurant();
  const [options, setOptions] = React.useState<RestaurantBrowseItem[]>([]);

  React.useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const rows = await fetchRestaurantsBrowseClient();
        if (!cancelled) setOptions(rows);
      } catch {
        if (!cancelled) setOptions([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const value = restaurantCode ?? ALL;

  const onMenuPath = pathname === "/menu" || pathname.startsWith("/menu/");

  function onValueChange(next: string) {
    if (next === ALL) {
      setRestaurantCode(null);
      if (onMenuPath) {
        router.replace("/menu");
      }
      return;
    }
    setRestaurantCode(next);
    if (onMenuPath) {
      router.replace(`/menu/r/${next}`);
    }
  }

  return (
    <div className="flex min-w-0 max-w-[9rem] shrink-0 items-center sm:max-w-[12rem]">
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger aria-label={t("location_aria")} className="h-9 text-xs sm:text-sm">
          <SelectValue placeholder={t("location_placeholder")} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>{t("all_locations")}</SelectItem>
          {options.map((r) => (
            <SelectItem key={r.id} value={r.code}>
              {r.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
