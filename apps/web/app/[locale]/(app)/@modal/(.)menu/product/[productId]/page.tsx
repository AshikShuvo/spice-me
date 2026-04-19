import { MenuProductDetailsEntry } from "@/components/menu/menu-product-details-entry";

type Props = {
  params: Promise<{ locale: string; productId: string }>;
  searchParams: Promise<{ restaurantCode?: string }>;
};

export default async function MenuProductInterceptedPage({
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
