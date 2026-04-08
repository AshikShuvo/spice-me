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
    <article className="flex min-w-0 flex-col gap-1 md:gap-1.5">
      <div className="group relative aspect-square w-full overflow-hidden rounded-md md:rounded-lg">
        {/*
          Native img + suppressHydrationWarning: some browser extensions mutate <img> (e.g. extra classes,
          data attrs, filter) before React hydrates, which would mismatch next/image’s output.
        */}
        {/* eslint-disable-next-line @next/next/no-img-element -- remote catalog URLs; extension-safe hydration */}
        <img
          src={product.imageUrl}
          alt={product.title}
          className="absolute inset-0 h-full w-full origin-center object-cover transition-transform duration-300 ease-out group-hover:scale-105 motion-reduce:transition-none motion-reduce:group-hover:scale-100"
          loading={priority ? "eager" : "lazy"}
          fetchPriority={priority ? "high" : "auto"}
          decoding="async"
          suppressHydrationWarning
        />
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-1 pt-0.5 md:gap-1.5 md:pt-1 lg:gap-2">
        <h3 className="font-ringside-compressed text-lg font-bold leading-tight text-coal md:text-xl lg:text-2xl">
          {product.title}
        </h3>
        <p className="line-clamp-2 text-[0.6875rem] leading-snug text-neutral-30 md:line-clamp-3 md:text-xs lg:text-sm">
          {product.description}
        </p>
        <div className="mt-auto pt-0.5 md:pt-1">
          <ProductPrice
            pricing={product.pricing}
            className="text-base font-bold text-coal md:text-lg lg:text-xl"
            labels={{
              noPrice: t("no_price"),
            }}
          />
        </div>
      </div>
    </article>
  );
}
