import type { ProductProfile } from "@/lib/types/admin-api";
import { cn } from "@/lib/utils";

export type ProductPriceLabels = {
  noPrice: string;
  variantCount: (count: number) => string;
};

const defaultLabels: ProductPriceLabels = {
  noPrice: "No price",
  variantCount: (count: number) =>
    `${count} variant${count !== 1 ? "s" : ""}`,
};

type Props = {
  pricing: ProductProfile["pricing"];
  className?: string;
  labels?: Partial<ProductPriceLabels>;
};

export function ProductPrice({ pricing, className, labels }: Props) {
  const L = { ...defaultLabels, ...labels };

  if (pricing.hasVariants) {
    const count = pricing.variants.filter((v) => v.isActive).length;
    return (
      <span className={cn("text-body text-neutral-30", className)}>
        {L.variantCount(count)}
      </span>
    );
  }
  if (!pricing.basePrice) {
    return (
      <span className={cn("text-body text-neutral-30/60", className)}>
        {L.noPrice}
      </span>
    );
  }
  if (pricing.salePrice) {
    return (
      <span className={cn("text-body text-coal", className)}>
        £{pricing.salePrice}{" "}
        <span className="line-through text-neutral-30">
          £{pricing.basePrice}
        </span>
      </span>
    );
  }
  return (
    <span className={cn("text-body text-coal", className)}>£{pricing.basePrice}</span>
  );
}
