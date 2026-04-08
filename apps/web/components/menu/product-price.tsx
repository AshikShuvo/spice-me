import type { ProductProfile } from "@/lib/types/admin-api";
import { cn } from "@/lib/utils";

export type ProductPriceLabels = {
  noPrice: string;
};

const defaultLabels: ProductPriceLabels = {
  noPrice: "No price",
};

type Props = {
  pricing: ProductProfile["pricing"];
  className?: string;
  labels?: Partial<ProductPriceLabels>;
};

/** Matches API `toProfile` when `pricing.display` is missing (stale cache / older server). */
function resolveDisplayRow(pricing: ProductProfile["pricing"]): {
  regularPrice: string | null;
  offerPrice: string | null;
} {
  const d = pricing.display;
  if (d != null) {
    return {
      regularPrice: d.regularPrice,
      offerPrice: d.offerPrice,
    };
  }
  const active = (pricing.variants ?? []).filter((v) => v.isActive);
  if (active.length > 0) {
    const def = active.find((v) => v.isDefault) ?? active[0]!;
    return {
      regularPrice: def.regularPrice,
      offerPrice: def.offerPrice,
    };
  }
  return {
    regularPrice: pricing.regularPrice,
    offerPrice: pricing.offerPrice,
  };
}

export function ProductPrice({ pricing, className, labels }: Props) {
  const L = { ...defaultLabels, ...labels };
  const { regularPrice: reg, offerPrice: offer } = resolveDisplayRow(pricing);

  if (!reg) {
    return (
      <span className={cn("text-body text-neutral-30/60", className)}>
        {L.noPrice}
      </span>
    );
  }
  if (offer) {
    return (
      <span className={cn("text-body text-coal", className)}>
        £{offer}{" "}
        <span className="line-through text-neutral-30">£{reg}</span>
      </span>
    );
  }
  return (
    <span className={cn("text-body text-coal", className)}>£{reg}</span>
  );
}
