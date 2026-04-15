"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";

import { useSelectedRestaurant } from "@/components/admin/selected-restaurant-context";
import { DataTable } from "@/components/admin/data-table";
import { EmptyState } from "@/components/admin/empty-state";
import { PageHeader } from "@/components/admin/page-header";
import { PricingBadge } from "@/components/admin/products/pricing-badge";
import { AddProductDialog } from "@/components/admin/products/add-product-dialog";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { TableCell, TableRow } from "@/components/ui/table";
import { useRestaurantProductService } from "@/lib/services/use-restaurant-product-service";
import type { RestaurantProductManageRow } from "@/lib/types/admin-api";

export function RestaurantProductsClient() {
  const { data: session } = useSession();
  const role = session?.user?.role;
  const { selectedRestaurant } = useSelectedRestaurant();
  const restaurantProductService = useRestaurantProductService();

  const [rows, setRows] = useState<RestaurantProductManageRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function loadProducts(restaurantId: string) {
    setLoading(true);
    setError(null);
    try {
      const data = await restaurantProductService.getManagedProducts(restaurantId);
      setRows(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load products");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (selectedRestaurant?.id) {
      void loadProducts(selectedRestaurant.id);
    } else {
      setRows([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedRestaurant?.id]);

  async function toggleAvailability(row: RestaurantProductManageRow) {
    if (!selectedRestaurant) return;
    setBusyId(row.id);
    try {
      const updated = await restaurantProductService.updateAvailability(
        selectedRestaurant.id,
        row.productId,
        !row.isAvailable,
      );
      setRows((prev) =>
        prev.map((r) =>
          r.id === row.id ? { ...r, isAvailable: updated.isAvailable } : r,
        ),
      );
    } finally {
      setBusyId(null);
    }
  }

  async function handleRemove(row: RestaurantProductManageRow) {
    if (!selectedRestaurant) return;
    if (!confirm(`Remove "${row.product.title}" from this restaurant?`)) return;
    setBusyId(row.id);
    try {
      await restaurantProductService.removeProduct(
        selectedRestaurant.id,
        row.productId,
      );
      setRows((prev) => prev.filter((r) => r.id !== row.id));
    } finally {
      setBusyId(null);
    }
  }

  function handleProductAdded(newRow: RestaurantProductManageRow) {
    setRows((prev) => [newRow, ...prev]);
  }

  if (!selectedRestaurant) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="My Products"
          description="Manage products available in your restaurant."
        />
        <p className="text-body text-neutral-30">
          {role === "ADMIN"
            ? "No restaurant is available yet, or none could be selected automatically. Create a restaurant under Restaurants — the first one is used for linked products without a sidebar picker."
            : "Select a restaurant from the sidebar to manage its products."}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="My Products"
        description={`Products linked to ${selectedRestaurant.name}.`}
        action={
          <Button type="button" onClick={() => setAddOpen(true)}>
            Add Products
          </Button>
        }
      />

      <AddProductDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        restaurantId={selectedRestaurant.id}
        alreadyAddedIds={rows.map((r) => r.productId)}
        onProductAdded={handleProductAdded}
      />

      {loading && (
        <p className="text-body text-neutral-30">Loading products…</p>
      )}
      {error && (
        <p className="text-body text-destructive" role="alert">
          {error}
        </p>
      )}

      {!loading && !error && rows.length === 0 && (
        <EmptyState
          title="No products yet"
          description="Add published products from the catalog to make them available in this restaurant."
          actionLabel="Add Products"
          onAction={() => setAddOpen(true)}
        />
      )}

      {!loading && rows.length > 0 && (
        <DataTable
          headers={["Image", "Title", "Category", "Pricing", "Available", "Actions"]}
        >
          {rows.map((row) => {
            const p = row.product;
            if (!p) return null;
            return (
            <TableRow key={row.id}>
              <TableCell>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={p.imageUrl}
                  alt={p.title}
                  className="h-10 w-10 rounded object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
              </TableCell>
              <TableCell className="font-medium text-coal">
                {p.title}
              </TableCell>
              <TableCell className="text-body text-neutral-30">
                {p.category.name}
                {p.subCategory ? ` · ${p.subCategory.name}` : ""}
              </TableCell>
              <TableCell>
                <PricingBadge pricing={p.pricing} />
              </TableCell>
              <TableCell>
                <Switch
                  checked={row.isAvailable}
                  disabled={busyId === row.id}
                  onCheckedChange={() => void toggleAvailability(row)}
                  aria-label="Toggle availability"
                />
              </TableCell>
              <TableCell>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={busyId === row.id}
                  onClick={() => void handleRemove(row)}
                >
                  Remove
                </Button>
              </TableCell>
            </TableRow>
            );
          })}
        </DataTable>
      )}
    </div>
  );
}
