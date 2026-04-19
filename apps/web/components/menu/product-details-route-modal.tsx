"use client";

import * as React from "react";
import { useLocale } from "next-intl";

import { ProductDetailsModal } from "@/components/menu/product-details-modal";
import { usePathname, useRouter } from "@/i18n/navigation";
import { menuListingPath } from "@/lib/menu-product-paths";
import { formatMenuCurrencyAmount } from "@/lib/money/format-currency";
import type { ProductProfile } from "@/lib/types/admin-api";

type Props = {
  product: ProductProfile;
  currencyCode: string;
  /** From `?restaurantCode=` so closing returns to the correct menu listing. */
  restaurantCode: string | null;
};

export function ProductDetailsRouteModal({
  product,
  currencyCode,
  restaurantCode,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const locale = useLocale();
  /** Radix Dialog is controlled; must go false on dismiss or `open={true}` keeps it open after `router.replace`. */
  const [open, setOpen] = React.useState(true);

  React.useEffect(() => {
    setOpen(true);
  }, [product.id]);

  const formatAmount = React.useCallback(
    (amount: string | number) =>
      formatMenuCurrencyAmount(amount, currencyCode, locale),
    [currencyCode, locale],
  );

  const onOpenChange = React.useCallback(
    (next: boolean) => {
      if (!next) {
        setOpen(false);
        const path = pathname ?? "";
        if (path.startsWith("/menu/product/")) {
          router.replace(menuListingPath(restaurantCode));
        } else if (path.startsWith("/product/")) {
          router.replace("/");
        } else {
          router.replace(menuListingPath(restaurantCode));
        }
      }
    },
    [router, restaurantCode, pathname],
  );

  return (
    <ProductDetailsModal
      product={product}
      formatAmount={formatAmount}
      open={open}
      onOpenChange={onOpenChange}
    />
  );
}
