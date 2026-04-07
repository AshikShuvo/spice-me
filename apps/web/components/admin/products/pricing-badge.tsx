import type { ProductProfile } from "@/lib/types/admin-api";
import { ProductPrice } from "@/components/menu/product-price";

interface Props {
  pricing: ProductProfile["pricing"];
}

export function PricingBadge({ pricing }: Props) {
  return <ProductPrice pricing={pricing} />;
}
