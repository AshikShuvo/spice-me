"use client";

import * as React from "react";
import { useLocale, useTranslations } from "next-intl";

import { MenuProductCard } from "@/components/menu/menu-product-card";
import { usePublicRestaurant } from "@/components/public-restaurant/public-restaurant-context";
import { fetchMenuPublicClient } from "@/lib/fetch-menu-public-client";
import { menuProductPath } from "@/lib/menu-product-paths";
import { formatMenuCurrencyAmount } from "@/lib/money/format-currency";
import type { MenuCategoryItem, MenuResponse } from "@/lib/types/menu-api";
import type { ProductProfile } from "@/lib/types/admin-api";
import { cn } from "@/lib/utils";

type Props = {
  menu: MenuResponse;
};

type SubFilter = "all" | string;

const menuTabBase =
  "shrink-0 cursor-pointer border-b-[3px] bg-transparent px-3 py-2.5 font-ringside-compressed text-lg font-bold leading-tight tracking-tight transition-colors md:text-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2";

function buildSections(
  products: ProductProfile[],
  subCategories: MenuCategoryItem["subCategories"],
  selectedSub: SubFilter,
  otherTitle: string,
): Array<{ key: string; title: string; items: ProductProfile[] }> {
  if (selectedSub !== "all") {
    const items = products.filter((p) => p.subCategoryId === selectedSub);
    const sub = subCategories.find((s) => s.id === selectedSub);
    return [{ key: selectedSub, title: sub?.name ?? "", items }];
  }

  const bySub = new Map<string | null, ProductProfile[]>();
  for (const p of products) {
    const k = p.subCategoryId;
    const list = bySub.get(k) ?? [];
    list.push(p);
    bySub.set(k, list);
  }

  const sections: Array<{ key: string; title: string; items: ProductProfile[] }> =
    [];

  for (const sub of subCategories) {
    const items = bySub.get(sub.id);
    if (items?.length) {
      sections.push({ key: sub.id, title: sub.name, items });
    }
  }

  const uncategorized = bySub.get(null);
  if (uncategorized?.length) {
    sections.push({
      key: "other",
      title: otherTitle,
      items: uncategorized,
    });
  }

  return sections;
}

export function MenuBrowseClient({ menu }: Props) {
  const t = useTranslations("menu");
  const locale = useLocale();
  const ctx = usePublicRestaurant();
  const [menuState, setMenuState] = React.useState(menu);
  const menuStateRef = React.useRef(menuState);
  menuStateRef.current = menuState;

  React.useEffect(() => {
    const want = ctx.restaurantCode ?? null;

    const matches = (m: MenuResponse) =>
      (want === null && m.scope === "global") ||
      (want !== null &&
        m.scope === "restaurant" &&
        m.restaurant?.code === want);

    if (matches(menu)) {
      setMenuState(menu);
      return;
    }

    if (matches(menuStateRef.current)) {
      return;
    }

    let cancelled = false;
    void (async () => {
      try {
        const data = await fetchMenuPublicClient(want ?? undefined);
        if (!cancelled) setMenuState(data);
      } catch {
        if (!cancelled) setMenuState(menu);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [ctx.restaurantCode, menu]);

  const { categories, products } = menuState;

  const formatMenuAmount = React.useCallback(
    (amount: string | number) =>
      formatMenuCurrencyAmount(amount, menuState.currencyCode, locale),
    [menuState.currencyCode, locale],
  );

  const [selectedCategoryId, setSelectedCategoryId] = React.useState<
    string | null
  >(() => categories[0]?.id ?? null);
  const [selectedSub, setSelectedSub] = React.useState<SubFilter>("all");

  React.useEffect(() => {
    if (
      selectedCategoryId &&
      !categories.some((c) => c.id === selectedCategoryId)
    ) {
      setSelectedCategoryId(categories[0]?.id ?? null);
      setSelectedSub("all");
    }
  }, [categories, selectedCategoryId]);

  const selectedCategory = categories.find((c) => c.id === selectedCategoryId);

  const productsForCategory = React.useMemo(
    () =>
      selectedCategoryId
        ? products.filter((p) => p.categoryId === selectedCategoryId)
        : [],
    [products, selectedCategoryId],
  );

  const sections = React.useMemo(
    () =>
      selectedCategory
        ? buildSections(
            productsForCategory,
            selectedCategory.subCategories,
            selectedSub,
            t("other_section"),
          )
        : [],
    [productsForCategory, selectedCategory, selectedSub, t],
  );

  /** First two products in DOM order (2-col grid): mark for eager LCP load. */
  const lcpPriorityIds = React.useMemo(() => {
    const ids: string[] = [];
    for (const sec of sections) {
      for (const p of sec.items) {
        ids.push(p.id);
        if (ids.length >= 2) return new Set(ids);
      }
    }
    return new Set(ids);
  }, [sections]);

  function onSelectCategory(id: string) {
    setSelectedCategoryId(id);
    setSelectedSub("all");
  }

  if (categories.length === 0) {
    return (
      <p className="text-center text-body text-neutral-30">{t("empty")}</p>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <div className="-mx-1 overflow-x-auto pb-0.5">
          <div className="flex w-max min-w-full justify-center gap-1 sm:gap-4">
            {categories.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => onSelectCategory(c.id)}
                className={cn(
                  menuTabBase,
                  selectedCategoryId === c.id
                    ? "border-primary text-coal"
                    : "border-transparent text-neutral-30 hover:text-coal",
                )}
              >
                {c.name}
              </button>
            ))}
          </div>
        </div>

        {selectedCategory ? (
          <div className="-mx-1 overflow-x-auto pb-0.5">
            <div className="flex w-max min-w-full justify-center gap-2">
              <button
                type="button"
                onClick={() => setSelectedSub("all")}
                className={cn(
                  "shrink-0 rounded-full border px-4 py-2 text-sm font-medium transition-colors",
                  selectedSub === "all"
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-background text-foreground hover:border-primary/50",
                )}
              >
                {t("all")}
              </button>
              {selectedCategory.subCategories.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setSelectedSub(s.id)}
                  className={cn(
                    "shrink-0 rounded-full border px-4 py-2 text-sm font-medium transition-colors",
                    selectedSub === s.id
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-background text-foreground hover:border-primary/50",
                  )}
                >
                  {s.name}
                </button>
              ))}
            </div>
          </div>
        ) : null}
      </div>

      {selectedCategory && productsForCategory.length === 0 ? (
        <p className="text-center text-body text-neutral-30">
          {t("no_products_category")}
        </p>
      ) : null}

      <div className="space-y-10">
        {sections.map((section) =>
          section.items.length === 0 ? null : (
            <section key={section.key} className="space-y-3">
              <h2 className="text-center text-sm font-medium tracking-wide text-neutral-30 sm:text-left">
                {section.title}
              </h2>
              <div className="grid grid-cols-2 gap-2 sm:gap-3 md:grid-cols-3 md:gap-4 lg:gap-5 xl:grid-cols-4 xl:gap-6">
                {section.items.map((p) => (
                  <MenuProductCard
                    key={p.id}
                    product={p}
                    formatAmount={formatMenuAmount}
                    priority={lcpPriorityIds.has(p.id)}
                    href={menuProductPath(p.id, ctx.restaurantCode)}
                  />
                ))}
              </div>
            </section>
          ),
        )}
      </div>
    </div>
  );
}
