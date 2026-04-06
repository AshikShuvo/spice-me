"use client";

import { Link, useRouter } from "@/i18n/navigation";
import { useState } from "react";

import { CreateProductDialog } from "@/components/admin/products/catalog/create-product-dialog";
import { PricingBadge } from "@/components/admin/products/pricing-badge";
import { ProductStatusBadge } from "@/components/admin/products/product-status-badge";
import { DataTable } from "@/components/admin/data-table";
import { EmptyState } from "@/components/admin/empty-state";
import { PageHeader } from "@/components/admin/page-header";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TableCell, TableRow } from "@/components/ui/table";
import { useProductService } from "@/lib/services/use-product-service";
import type { CategoryProfile, ProductProfile } from "@/lib/types/admin-api";

interface Props {
  initialData: ProductProfile[];
  categories: CategoryProfile[];
  page: number;
  limit: number;
  total: number;
  currentCategoryId?: string;
}

export function ProductListClient({
  initialData,
  categories,
  page,
  limit,
  total,
  currentCategoryId,
}: Props) {
  const router = useRouter();
  const productService = useProductService();

  const [createOpen, setCreateOpen] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [rowError, setRowError] = useState<{ id: string; msg: string } | null>(
    null,
  );

  const totalPages = Math.max(1, Math.ceil(total / limit));

  function buildUrl(overrides: Record<string, string | undefined>) {
    const params = new URLSearchParams();
    if (currentCategoryId) params.set("categoryId", currentCategoryId);
    for (const [k, v] of Object.entries(overrides)) {
      if (v) params.set(k, v);
      else params.delete(k);
    }
    return `/admin/products/catalog?${params.toString()}`;
  }

  const ALL_CATEGORIES = "__all__";

  function handleCategoryChange(value: string) {
    router.push(
      buildUrl({ categoryId: value === ALL_CATEGORIES ? undefined : value, page: "1" }),
    );
  }

  async function togglePublish(p: ProductProfile) {
    setBusyId(p.id);
    setRowError(null);
    try {
      await productService.setPublished(p.id, !p.isPublished);
      router.refresh();
    } catch (e) {
      setRowError({
        id: p.id,
        msg: e instanceof Error ? e.message : "Publish failed",
      });
    } finally {
      setBusyId(null);
    }
  }

  async function handleDelete(p: ProductProfile) {
    if (!confirm(`Delete product "${p.title}"? This will unpublish and deactivate it.`))
      return;
    setBusyId(p.id);
    setRowError(null);
    try {
      await productService.deleteProduct(p.id);
      router.refresh();
    } catch (e) {
      setRowError({
        id: p.id,
        msg: e instanceof Error ? e.message : "Delete failed",
      });
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Products"
        description="Manage the global product catalog. Publish products to make them available to restaurant admins."
        action={
          <Button type="button" onClick={() => setCreateOpen(true)}>
            New product
          </Button>
        }
      />

      <CreateProductDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        categories={categories}
      />

      <div className="flex items-center gap-3">
        <div className="w-56">
          <Select
            value={currentCategoryId ?? ALL_CATEGORIES}
            onValueChange={handleCategoryChange}
          >
            <SelectTrigger>
              <SelectValue placeholder="All categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_CATEGORIES}>All categories</SelectItem>
              {categories.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {currentCategoryId && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => router.push("/admin/products/catalog")}
          >
            Clear filters
          </Button>
        )}
        <p className="ml-auto text-caption text-neutral-30">
          {total} product{total !== 1 ? "s" : ""}
        </p>
      </div>

      {initialData.length === 0 ? (
        <EmptyState
          title="No products yet"
          description="Create your first product. Add variants and allergy info, then publish it."
          actionLabel="New product"
          onAction={() => setCreateOpen(true)}
        />
      ) : (
        <>
          <DataTable
            headers={[
              "Image",
              "Title",
              "Category",
              "Sub Category",
              "Status",
              "Pricing",
              "Actions",
            ]}
          >
            {initialData.map((p) => (
              <TableRow key={p.id}>
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
                  <Link
                    href={`/admin/products/catalog/${p.id}`}
                    className="hover:text-peppes-red"
                  >
                    {p.title}
                  </Link>
                </TableCell>
                <TableCell className="text-body text-neutral-30">
                  {p.category.name}
                </TableCell>
                <TableCell className="text-body text-neutral-30">
                  {p.subCategory?.name ?? "—"}
                </TableCell>
                <TableCell>
                  <ProductStatusBadge
                    isPublished={p.isPublished}
                    isActive={p.isActive}
                  />
                </TableCell>
                <TableCell>
                  <PricingBadge pricing={p.pricing} />
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-2">
                    <Button type="button" variant="outline" size="sm" asChild>
                      <Link href={`/admin/products/catalog/${p.id}`}>Edit</Link>
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={busyId === p.id || !p.isActive}
                      onClick={() => void togglePublish(p)}
                    >
                      {p.isPublished ? "Unpublish" : "Publish"}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={busyId === p.id}
                      onClick={() => void handleDelete(p)}
                    >
                      Delete
                    </Button>
                  </div>
                  {rowError?.id === p.id && (
                    <p
                      className="mt-1 text-caption text-destructive"
                      role="alert"
                    >
                      {rowError.msg}
                    </p>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </DataTable>

          <div className="flex items-center justify-between gap-4">
            <p className="text-caption text-neutral-30">
              Page {page} of {totalPages} · {total} products
            </p>
            <div className="flex gap-2">
              {page <= 1 ? (
                <Button type="button" variant="outline" size="sm" disabled>
                  Previous
                </Button>
              ) : (
                <Button type="button" variant="outline" size="sm" asChild>
                  <Link href={buildUrl({ page: String(page - 1) })}>
                    Previous
                  </Link>
                </Button>
              )}
              {page >= totalPages ? (
                <Button type="button" variant="outline" size="sm" disabled>
                  Next
                </Button>
              ) : (
                <Button type="button" variant="outline" size="sm" asChild>
                  <Link href={buildUrl({ page: String(page + 1) })}>Next</Link>
                </Button>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
