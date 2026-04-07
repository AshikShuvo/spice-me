"use client";

import * as React from "react";
import { useTranslations } from "next-intl";

import { MenuProductCard } from "@/components/menu/menu-product-card";
import type { MenuCategoryItem, MenuResponse } from "@/lib/types/menu-api";
import type { ProductProfile } from "@/lib/types/admin-api";
import { cn } from "@/lib/utils";

type Props = {
  menu: MenuResponse;
};

type SubFilter = "all" | string;

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
  const { categories, products } = menu;

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
      {menu.restaurant ? (
        <p className="text-center text-caption text-neutral-30">
          {menu.restaurant.name}
          <span className="ml-1 text-neutral-30/80">
            ({menu.restaurant.code})
          </span>
        </p>
      ) : null}

      <div className="flex flex-col gap-2">
        <div className="-mx-1 overflow-x-auto pb-0.5">
          <div className="flex w-max min-w-full justify-center gap-2">
            {categories.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => onSelectCategory(c.id)}
                className={cn(
                  "shrink-0 rounded-full border px-4 py-2 text-sm font-medium transition-colors",
                  selectedCategoryId === c.id
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-background text-foreground hover:border-primary/50",
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
                    priority={lcpPriorityIds.has(p.id)}
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
