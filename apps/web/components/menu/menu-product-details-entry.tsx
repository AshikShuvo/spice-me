import { notFound } from "next/navigation";

import { ProductDetailsRouteModal } from "@/components/menu/product-details-route-modal";
import { fetchPlatformSettingsServer } from "@/lib/fetch-platform-settings";
import { fetchProductPublicServer } from "@/lib/fetch-product-public";

type Props = {
  productId: string;
  restaurantCode: string | null;
};

export async function MenuProductDetailsEntry({
  productId,
  restaurantCode,
}: Props) {
  const result = await fetchProductPublicServer(productId);
  if (!result.ok) {
    notFound();
  }
  const settings = await fetchPlatformSettingsServer();
  return (
    <ProductDetailsRouteModal
      product={result.product}
      currencyCode={settings.currencyCode}
      restaurantCode={restaurantCode}
    />
  );
}
