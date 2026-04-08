"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useRouter } from "@/i18n/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";

import { AddVariantDialog } from "@/components/admin/products/catalog/add-variant-dialog";
import { EditVariantDialog } from "@/components/admin/products/catalog/edit-variant-dialog";
import { PricingBadge } from "@/components/admin/products/pricing-badge";
import { ProductStatusBadge } from "@/components/admin/products/product-status-badge";
import { DataTable } from "@/components/admin/data-table";
import { StatusBadge } from "@/components/admin/status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useCategoryService } from "@/lib/services/use-category-service";
import { useProductService } from "@/lib/services/use-product-service";
import type {
  AllergyItemProfile,
  CategoryProfile,
  ProductProfile,
  ProductVariantProfile,
  SubCategoryProfile,
} from "@/lib/types/admin-api";
import {
  updateProductSchema,
  type UpdateProductFormValues,
  type UpdateProductInput,
} from "@/lib/validations/product";
import { TableCell, TableRow } from "@/components/ui/table";

interface Props {
  product: ProductProfile;
  categories: CategoryProfile[];
  allAllergyItems: AllergyItemProfile[];
}

function buildProductFormDefaults(p: ProductProfile): UpdateProductFormValues {
  return {
    title: p.title,
    description: p.description,
    imageUrl: p.imageUrl,
    categoryId: p.categoryId,
    subCategoryId: p.subCategoryId ?? undefined,
    regularPrice: p.pricing.regularPrice
      ? Number.parseFloat(p.pricing.regularPrice)
      : undefined,
    offerPrice: p.pricing.offerPrice
      ? Number.parseFloat(p.pricing.offerPrice)
      : undefined,
  };
}

export function ProductDetailClient({
  product: initialProduct,
  categories,
  allAllergyItems,
}: Props) {
  const router = useRouter();
  const productService = useProductService();
  const categoryService = useCategoryService();

  const [product, setProduct] = useState(initialProduct);
  const [subcategories, setSubcategories] = useState<SubCategoryProfile[]>([]);
  const [imagePreviewError, setImagePreviewError] = useState(false);
  const [addVariantOpen, setAddVariantOpen] = useState(false);
  const [editVariantOpen, setEditVariantOpen] = useState(false);
  const [editVariantTarget, setEditVariantTarget] =
    useState<ProductVariantProfile | null>(null);
  const [publishBusy, setPublishBusy] = useState(false);
  const [publishError, setPublishError] = useState<string | null>(null);
  const [variantBusyId, setVariantBusyId] = useState<string | null>(null);
  const [allergyBusyId, setAllergyBusyId] = useState<string | null>(null);

  const hasVariantRows = product.pricing.variants.length > 0;

  const form = useForm<UpdateProductFormValues, unknown, UpdateProductInput>({
    resolver: zodResolver(updateProductSchema),
    defaultValues: buildProductFormDefaults(initialProduct),
  });

  useEffect(() => {
    form.reset(buildProductFormDefaults(product));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product.id]);

  const imageUrl = form.watch("imageUrl");
  useEffect(() => {
    setImagePreviewError(false);
  }, [imageUrl]);

  const watchedCategoryId = form.watch("categoryId");
  useEffect(() => {
    if (!watchedCategoryId) return;
    categoryService
      .getCategory(watchedCategoryId)
      .then((cat) => setSubcategories(cat.subCategories ?? []))
      .catch(() => setSubcategories([]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watchedCategoryId]);

  async function onSaveDetails(values: UpdateProductInput) {
    try {
      const updated = await productService.updateProduct(product.id, values);
      setProduct(updated);
      form.reset(buildProductFormDefaults(updated));
    } catch (err) {
      form.setError("root", {
        message:
          err instanceof Error ? err.message : "Could not save product details",
      });
    }
  }

  async function togglePublish() {
    setPublishBusy(true);
    setPublishError(null);
    try {
      const updated = await productService.setPublished(
        product.id,
        !product.isPublished,
      );
      setProduct(updated);
    } catch (e) {
      setPublishError(e instanceof Error ? e.message : "Failed to update publish status");
    } finally {
      setPublishBusy(false);
    }
  }

  async function handleSetDefaultVariant(variantId: string) {
    setVariantBusyId(variantId);
    try {
      const updated = await productService.updateVariant(
        product.id,
        variantId,
        { isDefault: true },
      );
      setProduct(updated);
    } finally {
      setVariantBusyId(null);
    }
  }

  async function handleRemoveVariant(variant: ProductVariantProfile) {
    if (!confirm(`Remove variant "${variant.name}"?`)) return;
    setVariantBusyId(variant.id);
    try {
      const updated = await productService.removeVariant(
        product.id,
        variant.id,
      );
      setProduct(updated);
    } catch {
      // ignore — variant list is refreshed from returned product; no user-visible error needed
    } finally {
      setVariantBusyId(null);
    }
  }

  async function handleAddAllergyItem(allergyItemId: string) {
    setAllergyBusyId(allergyItemId);
    try {
      const updated = await productService.addAllergyItems(product.id, [
        allergyItemId,
      ]);
      setProduct(updated);
    } finally {
      setAllergyBusyId(null);
    }
  }

  async function handleRemoveAllergyItem(allergyItemId: string) {
    setAllergyBusyId(allergyItemId);
    try {
      const updated = await productService.removeAllergyItem(
        product.id,
        allergyItemId,
      );
      setProduct(updated);
    } finally {
      setAllergyBusyId(null);
    }
  }

  const unlinkedAllergyItems = allAllergyItems.filter(
    (a) => !product.allergyItems.find((pa) => pa.id === a.id),
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link
            href="/admin/products/catalog"
            className="text-caption text-neutral-30 hover:text-coal"
          >
            ← Back to catalog
          </Link>
          <h1 className="mt-1 text-headline font-ringside-compressed text-coal">
            {product.title}
          </h1>
          <div className="mt-1 flex items-center gap-2">
            <ProductStatusBadge
              isPublished={product.isPublished}
              isActive={product.isActive}
            />
            <PricingBadge pricing={product.pricing} />
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={publishBusy || !product.isActive}
            onClick={() => void togglePublish()}
          >
            {product.isPublished ? "Unpublish" : "Publish"}
          </Button>
          <Button
            type="button"
            disabled={publishBusy}
            onClick={() => router.refresh()}
          >
            Refresh
          </Button>
        </div>
      </div>
      {publishError && (
        <p className="text-body text-destructive" role="alert">
          {publishError}
        </p>
      )}

      {/* Details */}
      <div className="rounded-md border border-coal-20 bg-white p-6">
        <h2 className="mb-4 text-subheadline font-ringside-compressed text-coal">
          Details
        </h2>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSaveDetails)}
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input
                      autoComplete="off"
                      {...field}
                      value={field.value ?? ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea rows={3} {...field} value={field.value ?? ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="imageUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Image URL</FormLabel>
                  <FormControl>
                    <Input
                      type="url"
                      placeholder="https://…"
                      autoComplete="off"
                      {...field}
                      value={field.value ?? ""}
                    />
                  </FormControl>
                  {field.value && !imagePreviewError && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={field.value}
                      alt="Preview"
                      className="mt-1 h-20 w-20 rounded object-cover"
                      onError={() => setImagePreviewError(true)}
                    />
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="categoryId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value ?? ""}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categories.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="subCategoryId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sub category (optional)</FormLabel>
                    <Select
                      onValueChange={(v) =>
                        field.onChange(v || undefined)
                      }
                      value={field.value ?? ""}
                      disabled={subcategories.length === 0}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="None" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {subcategories.map((s) => (
                          <SelectItem key={s.id} value={s.id}>
                            {s.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="regularPrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Regular price (£)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        step={0.01}
                        placeholder="0.00"
                        disabled={hasVariantRows}
                        value={field.value ?? ""}
                        onChange={(e) =>
                          field.onChange(
                            e.target.value === ""
                              ? undefined
                              : Number.parseFloat(e.target.value),
                          )
                        }
                      />
                    </FormControl>
                    {hasVariantRows && (
                      <FormDescription className="text-caption">
                        Disabled — pricing is set per variant
                      </FormDescription>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="offerPrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Offer price (£)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        step={0.01}
                        placeholder="0.00"
                        disabled={hasVariantRows}
                        value={field.value ?? ""}
                        onChange={(e) =>
                          field.onChange(
                            e.target.value === ""
                              ? undefined
                              : Number.parseFloat(e.target.value),
                          )
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            {form.formState.errors.root && (
              <p className="text-body text-destructive" role="alert">
                {form.formState.errors.root.message}
              </p>
            )}
            <Button type="submit" disabled={form.formState.isSubmitting}>
              Save changes
            </Button>
          </form>
        </Form>
      </div>

      {/* Variants */}
      <div className="rounded-md border border-coal-20 bg-white p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-subheadline font-ringside-compressed text-coal">
            Pricing &amp; Variants
          </h2>
          <Button
            type="button"
            size="sm"
            onClick={() => setAddVariantOpen(true)}
          >
            Add variant
          </Button>
        </div>
        {!hasVariantRows && (
          <p className="mb-4 text-caption text-neutral-30">
            No variants yet. Add variants to switch to per-variant pricing.
          </p>
        )}
        {product.pricing.variants.length > 0 && (
          <>
            <AddVariantDialog
              open={addVariantOpen}
              onOpenChange={setAddVariantOpen}
              productId={product.id}
              onVariantAdded={setProduct}
            />
            <EditVariantDialog
              open={editVariantOpen}
              onOpenChange={(o) => {
                setEditVariantOpen(o);
                if (!o) setEditVariantTarget(null);
              }}
              productId={product.id}
              variant={editVariantTarget}
              onVariantUpdated={setProduct}
            />
            <DataTable
              headers={[
                "Name",
                "Sort",
                "Regular",
                "Offer",
                "Default",
                "Active",
                "Actions",
              ]}
            >
              {product.pricing.variants.map((v) => (
                <TableRow key={v.id}>
                  <TableCell className="font-medium text-coal">{v.name}</TableCell>
                  <TableCell className="text-body text-neutral-30">
                    {v.sortOrder}
                  </TableCell>
                  <TableCell className="text-body text-coal">
                    £{v.regularPrice}
                  </TableCell>
                  <TableCell className="text-body text-neutral-30">
                    {v.offerPrice ? `£${v.offerPrice}` : "—"}
                  </TableCell>
                  <TableCell>
                    {v.isDefault ? (
                      <Badge variant="secondary">Menu default</Badge>
                    ) : (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-auto px-2 py-1 text-caption"
                        disabled={
                          variantBusyId === v.id || !v.isActive
                        }
                        onClick={() => void handleSetDefaultVariant(v.id)}
                      >
                        Set default
                      </Button>
                    )}
                  </TableCell>
                  <TableCell>
                    <StatusBadge isActive={v.isActive} />
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditVariantTarget(v);
                          setEditVariantOpen(true);
                        }}
                      >
                        Edit
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={variantBusyId === v.id}
                        onClick={() => void handleRemoveVariant(v)}
                      >
                        Remove
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </DataTable>
          </>
        )}
        {product.pricing.variants.length === 0 && (
          <AddVariantDialog
            open={addVariantOpen}
            onOpenChange={setAddVariantOpen}
            productId={product.id}
            onVariantAdded={setProduct}
          />
        )}
      </div>

      {/* Allergy items */}
      <div className="rounded-md border border-coal-20 bg-white p-6">
        <h2 className="mb-4 text-subheadline font-ringside-compressed text-coal">
          Allergy Items
        </h2>
        {product.allergyItems.length === 0 && (
          <p className="mb-4 text-caption text-neutral-30">
            No allergy items linked to this product.
          </p>
        )}
        {product.allergyItems.length > 0 && (
          <div className="mb-4 flex flex-wrap gap-2">
            {product.allergyItems.map((a) => (
              <Badge key={a.id} variant="secondary" className="gap-1">
                {a.name}
                <button
                  type="button"
                  aria-label={`Remove ${a.name}`}
                  disabled={allergyBusyId === a.id}
                  className="ml-1 opacity-60 hover:opacity-100 disabled:opacity-30"
                  onClick={() => void handleRemoveAllergyItem(a.id)}
                >
                  ×
                </button>
              </Badge>
            ))}
          </div>
        )}
        {unlinkedAllergyItems.length > 0 && (
          <div>
            <p className="mb-2 text-caption text-neutral-30">Add allergy item:</p>
            <div className="flex flex-wrap gap-2">
              {unlinkedAllergyItems.map((a) => (
                <button
                  key={a.id}
                  type="button"
                  disabled={allergyBusyId === a.id}
                  className="rounded border border-coal-20 px-2 py-1 text-caption text-coal hover:border-peppes-red disabled:opacity-50"
                  onClick={() => void handleAddAllergyItem(a.id)}
                >
                  + {a.name}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
