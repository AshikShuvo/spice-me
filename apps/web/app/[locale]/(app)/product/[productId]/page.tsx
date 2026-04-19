import { MenuProductDetailsEntry } from "@/components/menu/menu-product-details-entry";

type Props = {
  params: Promise<{ locale: string; productId: string }>;
  searchParams: Promise<{ restaurantCode?: string }>;
};

/** Standalone product URL (`/product/:id`); same modal shell as `/menu/product/:id`. */
export default async function StandaloneProductPage({
  params,
  searchParams,
}: Props) {
  const { productId } = await params;
  const sp = await searchParams;
  const restaurantCode = sp.restaurantCode?.trim() || null;

  return (
    <MenuProductDetailsEntry
      productId={productId}
      restaurantCode={restaurantCode}
    />
  );
}
