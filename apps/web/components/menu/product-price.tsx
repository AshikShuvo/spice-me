import type {
  ProductProfile,
  ProductVariantProfile,
} from "@/lib/types/admin-api";
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
export function resolveDisplayRow(pricing: ProductProfile["pricing"]): {
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
  const active = getActiveVariants(pricing);
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

export function getActiveVariants(
  pricing: ProductProfile["pricing"],
): ProductVariantProfile[] {
  return (pricing.variants ?? []).filter((v) => v.isActive);
}

export function getDefaultActiveVariant(
  pricing: ProductProfile["pricing"],
): ProductVariantProfile | null {
  const active = getActiveVariants(pricing);
  if (active.length === 0) return null;
  return active.find((v) => v.isDefault) ?? active[0]!;
}

/** Effective selling unit price for a variant row (offer if set). */
export function unitPriceFromVariant(v: ProductVariantProfile): number | null {
  const s = v.offerPrice ?? v.regularPrice;
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : null;
}

/** Effective selling unit price from a resolved display row. */
export function unitPriceFromDisplayRow(row: {
  regularPrice: string | null;
  offerPrice: string | null;
}): number | null {
  const s = row.offerPrice ?? row.regularPrice;
  if (s == null || s === "") return null;
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : null;
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
        <span className="font-normal text-neutral-30 line-through decoration-primary decoration-2">
          £{reg}
        </span>
      </span>
    );
  }
  return (
    <span className={cn("text-body text-coal", className)}>£{reg}</span>
  );
}
