"use client";

import { useEffect, useState } from "react";

import { PricingBadge } from "@/components/admin/products/pricing-badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useProductService } from "@/lib/services/use-product-service";
import { useRestaurantProductService } from "@/lib/services/use-restaurant-product-service";
import type { ProductProfile, RestaurantProductManageRow } from "@/lib/types/admin-api";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  restaurantId: string;
  alreadyAddedIds: string[];
  onProductAdded: (row: RestaurantProductManageRow) => void;
}

export function AddProductDialog({
  open,
  onOpenChange,
  restaurantId,
  alreadyAddedIds,
  onProductAdded,
}: Props) {
  const productService = useProductService();
  const restaurantProductService = useRestaurantProductService();

  const [products, setProducts] = useState<ProductProfile[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    setError(null);
    productService
      .getPublishedProducts({ limit: 100 })
      .then((res) => setProducts(res.data))
      .catch((e) =>
        setError(e instanceof Error ? e.message : "Failed to load products"),
      )
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const filtered = products.filter((p) => {
    const q = search.toLowerCase();
    return (
      p.title.toLowerCase().includes(q) ||
      p.category.name.toLowerCase().includes(q)
    );
  });

  async function handleAdd(product: ProductProfile) {
    setBusyId(product.id);
    setError(null);
    try {
      const row = await restaurantProductService.addProduct(
        restaurantId,
        product.id,
      );
      onProductAdded(row);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to add product");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add Products to Restaurant</DialogTitle>
          <DialogDescription>
            Browse published products and add them to this restaurant.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <Input
            placeholder="Search by title or category…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            autoComplete="off"
          />
          {error && (
            <p className="text-body text-destructive" role="alert">
              {error}
            </p>
          )}
          {loading && (
            <p className="text-body text-neutral-30">Loading catalog…</p>
          )}
          {!loading && filtered.length === 0 && (
            <p className="text-body text-neutral-30">
              {search ? "No matching products." : "No published products found."}
            </p>
          )}
          {!loading && (
            <div className="divide-y divide-coal-20">
              {filtered.map((product) => {
                const alreadyAdded = alreadyAddedIds.includes(product.id);
                return (
                  <div
                    key={product.id}
                    className="flex items-center gap-3 py-3"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={product.imageUrl}
                      alt={product.title}
                      className="h-10 w-10 flex-shrink-0 rounded object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-body font-medium text-coal">
                        {product.title}
                      </p>
                      <p className="text-caption text-neutral-30">
                        {product.category.name}
                        {product.subCategory
                          ? ` · ${product.subCategory.name}`
                          : ""}
                      </p>
                    </div>
                    <PricingBadge pricing={product.pricing} />
                    <Button
                      type="button"
                      size="sm"
                      variant={alreadyAdded ? "secondary" : "default"}
                      disabled={alreadyAdded || busyId === product.id}
                      onClick={() => void handleAdd(product)}
                    >
                      {alreadyAdded ? "Added" : "Add"}
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
