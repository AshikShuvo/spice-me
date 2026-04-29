"use client";

import { Link, useRouter } from "@/i18n/navigation";
import { useState } from "react";

import { CreateIngredientTemplateDialog } from "@/components/admin/products/ingredient-templates/create-ingredient-template-dialog";
import { DataTable } from "@/components/admin/data-table";
import { EmptyState } from "@/components/admin/empty-state";
import { PageHeader } from "@/components/admin/page-header";
import { Button } from "@/components/ui/button";
import { TableCell, TableRow } from "@/components/ui/table";
import { useIngredientTemplateService } from "@/lib/services/use-ingredient-template-service";
import { usePlatformCurrency } from "@/components/platform-currency/platform-currency-context";
import type {
  IngredientProfile,
  IngredientTemplateProfile,
} from "@/lib/types/admin-api";

export function IngredientTemplatesListClient({
  initialTemplates,
  ingredients,
}: {
  initialTemplates: IngredientTemplateProfile[];
  ingredients: IngredientProfile[];
}) {
  const router = useRouter();
  const templateService = useIngredientTemplateService();
  const { formatAmount } = usePlatformCurrency();

  const [createOpen, setCreateOpen] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [rowError, setRowError] = useState<{ id: string; msg: string } | null>(
    null,
  );

  async function handleDelete(t: IngredientTemplateProfile) {
    if (!confirm(`Delete template "${t.name}"?`)) return;
    setBusyId(t.id);
    setRowError(null);
    try {
      await templateService.deleteTemplate(t.id);
      router.refresh();
    } catch (e) {
      setRowError({
        id: t.id,
        msg: e instanceof Error ? e.message : "Delete failed",
      });
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Ingredient templates"
        description="Reusable sets of optional extras. Apply to products from the product detail page."
        action={
          <Button
            type="button"
            onClick={() => setCreateOpen(true)}
            disabled={ingredients.length === 0}
          >
            New template
          </Button>
        }
      />

      <p className="text-caption text-neutral-30">
        <Link href="/admin/products/ingredients" className="underline">
          Ingredients catalog
        </Link>
      </p>

      {ingredients.length === 0 && (
        <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-caption text-amber-900">
          Create at least one ingredient before adding templates.
        </p>
      )}

      <CreateIngredientTemplateDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        ingredients={ingredients}
      />

      {initialTemplates.length === 0 ? (
        <EmptyState
          title="No templates yet"
          description="Templates speed up attaching the same extras to many products."
          actionLabel="New template"
          onAction={() => setCreateOpen(true)}
        />
      ) : (
        <DataTable headers={["Name", "Items", "Sort", "Actions"]}>
          {initialTemplates.map((t) => (
            <TableRow key={t.id}>
              <TableCell className="font-medium text-coal">{t.name}</TableCell>
              <TableCell className="text-body text-neutral-30">
                {t.items.length} ingredient{t.items.length === 1 ? "" : "s"}
                <span className="ml-2 text-caption">
                  (
                  {t.items
                    .map((i) => `${i.ingredient.name} ${formatAmount(i.extraPrice)}`)
                    .join(", ")}
                  )
                </span>
              </TableCell>
              <TableCell className="text-body text-neutral-30">
                {t.sortOrder}
              </TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <Button type="button" variant="outline" size="sm" asChild>
                    <Link href={`/admin/products/ingredient-templates/${t.id}`}>
                      Edit
                    </Link>
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={busyId === t.id}
                    onClick={() => void handleDelete(t)}
                  >
                    Delete
                  </Button>
                </div>
                {rowError?.id === t.id && (
                  <p className="mt-1 text-caption text-destructive" role="alert">
                    {rowError.msg}
                  </p>
                )}
              </TableCell>
            </TableRow>
          ))}
        </DataTable>
      )}
    </div>
  );
}
