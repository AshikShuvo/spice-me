import type { ProductProfile } from "@/lib/types/admin-api";

interface Props {
  pricing: ProductProfile["pricing"];
}

export function PricingBadge({ pricing }: Props) {
  if (pricing.hasVariants) {
    const count = pricing.variants.filter((v) => v.isActive).length;
    return (
      <span className="text-body text-neutral-30">
        {count} variant{count !== 1 ? "s" : ""}
      </span>
    );
  }
  if (!pricing.basePrice) {
    return <span className="text-body text-neutral-30/60">No price</span>;
  }
  if (pricing.salePrice) {
    return (
      <span className="text-body text-coal">
        £{pricing.salePrice}{" "}
        <span className="line-through text-neutral-30">£{pricing.basePrice}</span>
      </span>
    );
  }
  return <span className="text-body text-coal">£{pricing.basePrice}</span>;
}
