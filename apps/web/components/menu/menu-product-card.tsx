"use client";

import { useTranslations } from "next-intl";

import { ProductPrice } from "@/components/menu/product-price";
import type { ProductProfile } from "@/lib/types/admin-api";

type Props = {
  product: ProductProfile;
  /** First visible grid images: eager load for LCP (2-col mobile often shows two above the fold). */
  priority?: boolean;
};

export function MenuProductCard({ product, priority = false }: Props) {
  const t = useTranslations("menu");

  return (
    <article className="flex min-w-0 flex-col overflow-hidden rounded-md border border-coal-20 bg-background shadow-sm md:rounded-lg">
      <div className="relative aspect-square w-full bg-background md:aspect-[4/3]">
        {/*
          Native img + suppressHydrationWarning: some browser extensions mutate <img> (e.g. extra classes,
          data attrs, filter) before React hydrates, which would mismatch next/image’s output.
        */}
        {/* eslint-disable-next-line @next/next/no-img-element -- remote catalog URLs; extension-safe hydration */}
        <img
          src={product.imageUrl}
          alt={product.title}
          className="absolute inset-0 h-full w-full object-cover"
          loading={priority ? "eager" : "lazy"}
          fetchPriority={priority ? "high" : "auto"}
          decoding="async"
          suppressHydrationWarning
        />
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-1 p-2 md:gap-1.5 md:p-3 lg:gap-2 lg:p-4">
        <h3 className="font-ringside-compressed text-[0.8125rem] font-semibold leading-tight text-coal md:text-base lg:text-lg">
          {product.title}
        </h3>
        <p className="line-clamp-2 text-[0.6875rem] leading-snug text-neutral-30 md:line-clamp-3 md:text-xs lg:text-sm">
          {product.description}
        </p>
        <div className="mt-auto pt-0.5 md:pt-1">
          <ProductPrice
            pricing={product.pricing}
            className="text-[0.6875rem] font-medium md:text-xs lg:text-sm"
            labels={{
              noPrice: t("no_price"),
            }}
          />
        </div>
      </div>
    </article>
  );
}
