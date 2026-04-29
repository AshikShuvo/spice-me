"use client";

import { Link, useRouter } from "@/i18n/navigation";
import { useState } from "react";

import { CreateIngredientDialog } from "@/components/admin/products/ingredients/create-ingredient-dialog";
import { EditIngredientDialog } from "@/components/admin/products/ingredients/edit-ingredient-dialog";
import { DataTable } from "@/components/admin/data-table";
import { EmptyState } from "@/components/admin/empty-state";
import { PageHeader } from "@/components/admin/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TableCell, TableRow } from "@/components/ui/table";
import { useIngredientService } from "@/lib/services/use-ingredient-service";
import type { IngredientProfile } from "@/lib/types/admin-api";

export function IngredientListClient({
  initialData,
}: {
  initialData: IngredientProfile[];
}) {
  const router = useRouter();
  const ingredientService = useIngredientService();

  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<IngredientProfile | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [rowError, setRowError] = useState<{ id: string; msg: string } | null>(
    null,
  );

  function openEdit(item: IngredientProfile) {
    setEditTarget(item);
    setEditOpen(true);
  }

  async function handleDelete(item: IngredientProfile) {
    if (!confirm(`Delete ingredient "${item.name}"?`)) return;
    setBusyId(item.id);
    setRowError(null);
    try {
      await ingredientService.deleteIngredient(item.id);
      router.refresh();
    } catch (e) {
      setRowError({
        id: item.id,
        msg: e instanceof Error ? e.message : "Delete failed",
      });
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Ingredients"
        description="Catalog ingredients for optional extras and templates."
        action={
          <Button type="button" onClick={() => setCreateOpen(true)}>
            New ingredient
          </Button>
        }
      />

      <p className="text-caption text-neutral-30">
        <Link href="/admin/products/ingredient-templates" className="underline">
          Ingredient templates
        </Link>
      </p>

      <CreateIngredientDialog open={createOpen} onOpenChange={setCreateOpen} />
      <EditIngredientDialog
        open={editOpen}
        onOpenChange={(o) => {
          setEditOpen(o);
          if (!o) setEditTarget(null);
        }}
        item={editTarget}
      />

      {initialData.length === 0 ? (
        <EmptyState
          title="No ingredients yet"
          description="Create ingredients to attach extras to products or templates."
          actionLabel="New ingredient"
          onAction={() => setCreateOpen(true)}
        />
      ) : (
        <DataTable headers={["Name", "Description", "Allergen", "Actions"]}>
          {initialData.map((item) => (
            <TableRow key={item.id}>
              <TableCell className="font-medium text-coal">{item.name}</TableCell>
              <TableCell className="max-w-xs truncate text-body text-neutral-30">
                {item.description ?? "—"}
              </TableCell>
              <TableCell>
                {item.isAllergen ? (
                  <Badge variant="secondary">Allergen</Badge>
                ) : (
                  "—"
                )}
              </TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => openEdit(item)}
                  >
                    Edit
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={busyId === item.id}
                    onClick={() => void handleDelete(item)}
                  >
                    Delete
                  </Button>
                </div>
                {rowError?.id === item.id && (
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
