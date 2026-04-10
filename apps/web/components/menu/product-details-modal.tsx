"use client";

import * as React from "react";
import { Minus, Plus } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  getActiveVariants,
  getDefaultActiveVariant,
  resolveDisplayRow,
  unitPriceFromDisplayRow,
  unitPriceFromVariant,
} from "@/components/menu/product-price";
import type {
  ProductProfile,
  ProductVariantProfile,
} from "@/lib/types/admin-api";
import { cn } from "@/lib/utils";

type Props = {
  product: ProductProfile | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

function formatGbpTotal(amount: number): string {
  return `£${amount.toFixed(2)}`;
}

function VariantChipPrice({
  variant,
  selected,
}: {
  variant: ProductVariantProfile;
  selected: boolean;
}) {
  const reg = variant.regularPrice;
  const offer = variant.offerPrice;
  const coal = selected ? "text-white" : "text-coal";
  const muted = selected ? "text-white/80" : "text-neutral-30";
  const strike = selected
    ? "text-white/75 decoration-white/50"
    : "text-neutral-30 decoration-primary";

  /** Matches product card emphasis: bold selling price. */
  const priceClass = cn(
    "tabular-nums text-base font-bold md:text-lg",
    coal,
  );

  if (!reg) {
    return (
      <span className={cn("block w-full text-center text-base font-bold", muted)}>
        —
      </span>
    );
  }
  if (offer) {
    return (
      <span className="flex w-full flex-wrap items-baseline justify-center gap-x-1.5 gap-y-0.5 text-center">
        <span className={priceClass}>£{offer}</span>
        <span
          className={cn(
            "tabular-nums text-sm font-normal line-through decoration-2 md:text-base",
            strike,
          )}
        >
          £{reg}
        </span>
      </span>
    );
  }
  return <span className={cn(priceClass, "block w-full text-center")}>£{reg}</span>;
}

export function ProductDetailsModal({
  product,
  open,
  onOpenChange,
}: Props) {
  const t = useTranslations("menu");

  const activeVariants = React.useMemo(
    () => (product ? getActiveVariants(product.pricing) : []),
    [product],
  );

  const showVariantPicker =
    !!product &&
    product.pricing.hasVariants &&
    activeVariants.length > 1;

  const [selectedVariantId, setSelectedVariantId] = React.useState<
    string | null
  >(null);
  const [quantity, setQuantity] = React.useState(1);

  React.useEffect(() => {
    if (!product) return;
    setQuantity(1);
    const def = getDefaultActiveVariant(product.pricing);
    setSelectedVariantId(def?.id ?? null);
  }, [product]);

  const unitPrice = React.useMemo(() => {
    if (!product) return null;
    if (showVariantPicker && selectedVariantId) {
      const v = activeVariants.find((x) => x.id === selectedVariantId);
      if (v) return unitPriceFromVariant(v);
    }
    return unitPriceFromDisplayRow(resolveDisplayRow(product.pricing));
  }, [product, showVariantPicker, selectedVariantId, activeVariants]);

  const totalPrice =
    unitPrice != null ? unitPrice * Math.max(1, quantity) : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {product ? (
        <DialogContent
          className={cn(
            "flex w-full max-w-5xl flex-col gap-0 overflow-hidden p-0 md:max-h-[min(90vh,800px)]",
            // Mobile: full-viewport sheet sliding up from the bottom (native-style).
            "max-md:fixed max-md:inset-x-0 max-md:bottom-0 max-md:top-0 max-md:!left-0 max-md:!right-0 max-md:!top-0 max-md:!bottom-0 max-md:h-[100dvh] max-md:max-h-[100dvh] max-md:w-full max-md:max-w-none max-md:!translate-x-0 max-md:!translate-y-0 max-md:rounded-none max-md:border-x-0 max-md:border-b-0 max-md:duration-300 max-md:data-[state=closed]:slide-out-to-bottom max-md:data-[state=open]:slide-in-from-bottom max-md:data-[state=closed]:zoom-out-100 max-md:data-[state=open]:zoom-in-100",
            // Desktop: centered dialog (override default sheet positioning).
            "md:max-h-[90vh] md:translate-x-[-50%] md:translate-y-[-50%] sm:rounded-lg md:rounded-lg",
          )}
          aria-describedby={undefined}
        >
          <DialogTitle className="sr-only">{product.title}</DialogTitle>
          <DialogDescription className="sr-only">
            {product.description}
          </DialogDescription>

          {/* Single scroll: image, copy, variants, and cart footer move together */}
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain">
            <div className="flex flex-col md:flex-row">
              {/* Image scrolls away with content; desktop uses aspect ratio in document flow */}
              <div className="w-full shrink-0 bg-muted md:w-1/2 md:max-w-[50%]">
                <div className="relative h-56 min-h-[220px] w-full md:aspect-[3/4] md:h-auto md:min-h-0">
                  {/* eslint-disable-next-line @next/next/no-img-element -- remote catalog URLs; extension-safe hydration */}
                  <img
                    src={product.imageUrl}
                    alt=""
                    className="h-full w-full object-cover md:absolute md:inset-0 md:h-full"
                    suppressHydrationWarning
                  />
                </div>
              </div>

              <div className="flex min-w-0 flex-1 flex-col md:w-1/2 md:max-w-[50%]">
                <div className="space-y-4 p-6">
                  <h2 className="font-ringside-compressed text-xl font-bold leading-tight text-coal md:text-2xl">
                    {product.title}
                  </h2>
                  <p className="text-sm leading-relaxed text-neutral-30 md:text-base">
                    {product.description}
                  </p>

                  {showVariantPicker ? (
                    <div className="space-y-2">
                      <p className="text-xs font-medium uppercase tracking-wide text-neutral-30">
                        {t("choose_variant")}
                      </p>
                      <div className="grid grid-cols-2 gap-2">
                        {activeVariants.map((v, i) => {
                          const selected = v.id === selectedVariantId;
                          const isLastOddFullRow =
                            activeVariants.length % 2 === 1 &&
                            i === activeVariants.length - 1;
                          return (
                            <button
                              key={v.id}
                              type="button"
                              onClick={() => setSelectedVariantId(v.id)}
                              className={cn(
                                "flex min-h-[6.25rem] w-full min-w-0 flex-col items-center justify-center gap-2 rounded-2xl border px-4 py-4 text-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 md:min-h-[6.75rem] md:py-5",
                                selected
                                  ? "border-black bg-black text-white focus-visible:ring-white/45"
                                  : "border-border bg-background text-foreground hover:border-primary/50 focus-visible:ring-primary/40",
                                isLastOddFullRow && "col-span-2",
                              )}
                            >
                              <span
                                className={cn(
                                  "font-ringside-compressed text-base font-bold leading-tight md:text-lg",
                                  selected ? "text-white" : "text-coal",
                                )}
                              >
                                {v.name}
                              </span>
                              <VariantChipPrice
                                variant={v}
                                selected={selected}
                              />
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ) : null}
                </div>

                <div className="border-t border-border p-6 pt-4 max-md:pb-[max(1rem,calc(env(safe-area-inset-bottom)+0.75rem))]">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center justify-center gap-1 sm:justify-start">
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="shrink-0"
                        aria-label={t("quantity_decrease")}
                        disabled={quantity <= 1}
                        onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      >
                        <Minus className="size-4" aria-hidden />
                      </Button>
                      <span
                        className="min-w-[2.5rem] text-center text-base font-semibold tabular-nums text-coal"
                        aria-live="polite"
                      >
                        {quantity}
                      </span>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="shrink-0"
                        aria-label={t("quantity_increase")}
                        onClick={() => setQuantity((q) => q + 1)}
                      >
                        <Plus className="size-4" aria-hidden />
                      </Button>
                    </div>

                    <Button
                      type="button"
                      variant="default"
                      size="lg"
                      className="w-full font-ringside-compressed text-base font-bold sm:w-auto sm:min-w-[12rem]"
                      disabled={totalPrice == null}
                      onClick={() => {
                        console.log("button clicked");
                      }}
                    >
                      {totalPrice != null
                        ? `${t("add_to_cart")} · ${formatGbpTotal(totalPrice)}`
                        : t("no_price")}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      ) : null}
    </Dialog>
  );
}
