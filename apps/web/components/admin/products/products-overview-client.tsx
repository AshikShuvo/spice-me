"use client";

import { Link } from "@/i18n/navigation";

import { DataTable } from "@/components/admin/data-table";
import { PageHeader } from "@/components/admin/page-header";
import { PricingBadge } from "@/components/admin/products/pricing-badge";
import { ProductStatusBadge } from "@/components/admin/products/product-status-badge";
import { Button } from "@/components/ui/button";
import { TableCell, TableRow } from "@/components/ui/table";
import type {
  AllergyItemProfile,
  CategoryProfile,
  ProductProfile,
} from "@/lib/types/admin-api";

interface Props {
  initialCategories: CategoryProfile[];
  recentProducts: ProductProfile[];
  totalProducts: number;
  allergyItems: AllergyItemProfile[];
}

export function ProductsOverviewClient({
  initialCategories,
  recentProducts,
  totalProducts,
  allergyItems,
}: Props) {
  const activeCategories = initialCategories.filter((c) => c.isActive).length;
  const totalSubcategories = initialCategories.reduce(
    (sum, c) => sum + c._count.subCategories,
    0,
  );

  const stats = [
    {
      label: "Categories",
      value: initialCategories.length,
      sub: `${activeCategories} active`,
      href: "/admin/products/categories",
    },
    {
      label: "Subcategories",
      value: totalSubcategories,
      sub: "across all categories",
      href: "/admin/products/subcategories",
    },
    {
      label: "Products",
      value: totalProducts,
      sub: "in catalog",
      href: "/admin/products/catalog",
    },
    {
      label: "Allergy Items",
      value: allergyItems.length,
      sub: "in reference list",
      href: "/admin/products/allergy-items",
    },
  ];

  return (
    <div className="space-y-8">
      <PageHeader
        title="Products"
        description="Manage the global product catalog, categories, and allergy information."
        action={
          <Button type="button" asChild>
            <Link href="/admin/products/catalog">View catalog</Link>
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((s) => (
          <Link
            key={s.label}
            href={s.href}
            className="block rounded-md border border-coal-20 bg-white p-4 hover:border-peppes-red/40 transition-colors"
          >
            <p className="text-label text-neutral-30">{s.label}</p>
            <p className="mt-1 text-3xl font-ringside-compressed text-coal">
              {s.value}
            </p>
            <p className="text-caption text-neutral-30">{s.sub}</p>
          </Link>
        ))}
      </div>

      {recentProducts.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-subheadline font-ringside-compressed text-coal">
              Recent products
            </h2>
            <Button type="button" variant="outline" size="sm" asChild>
              <Link href="/admin/products/catalog">View all</Link>
            </Button>
          </div>
          <DataTable headers={["Title", "Category", "Status", "Pricing"]}>
            {recentProducts.map((p) => (
              <TableRow key={p.id}>
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
                <TableCell>
                  <ProductStatusBadge
                    isPublished={p.isPublished}
                    isActive={p.isActive}
                  />
                </TableCell>
                <TableCell>
                  <PricingBadge pricing={p.pricing} />
                </TableCell>
              </TableRow>
            ))}
          </DataTable>
        </div>
      )}
    </div>
  );
}
