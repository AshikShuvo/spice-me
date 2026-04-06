"use client";

import { useRouter } from "@/i18n/navigation";
import { useState } from "react";

import { CreateCategoryDialog } from "@/components/admin/products/categories/create-category-dialog";
import { EditCategoryDialog } from "@/components/admin/products/categories/edit-category-dialog";
import { DataTable } from "@/components/admin/data-table";
import { EmptyState } from "@/components/admin/empty-state";
import { PageHeader } from "@/components/admin/page-header";
import { StatusBadge } from "@/components/admin/status-badge";
import { Button } from "@/components/ui/button";
import { TableCell, TableRow } from "@/components/ui/table";
import { useCategoryService } from "@/lib/services/use-category-service";
import type { CategoryProfile } from "@/lib/types/admin-api";

export function CategoryListClient({
  initialData,
}: {
  initialData: CategoryProfile[];
}) {
  const router = useRouter();
  const categoryService = useCategoryService();

  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<CategoryProfile | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [rowError, setRowError] = useState<{ id: string; msg: string } | null>(
    null,
  );

  function openEdit(c: CategoryProfile) {
    setEditTarget(c);
    setEditOpen(true);
  }

  async function toggleActive(c: CategoryProfile) {
    setBusyId(c.id);
    setRowError(null);
    try {
      await categoryService.updateCategory(c.id, { isActive: !c.isActive });
      router.refresh();
    } catch (e) {
      setRowError({
        id: c.id,
        msg: e instanceof Error ? e.message : "Update failed",
      });
    } finally {
      setBusyId(null);
    }
  }

  async function handleDelete(c: CategoryProfile) {
    if (
      !confirm(
        `Delete category "${c.name}"? This will fail if any products are using it.`,
      )
    )
      return;
    setBusyId(c.id);
    setRowError(null);
    try {
      await categoryService.deleteCategory(c.id);
      router.refresh();
    } catch (e) {
      setRowError({
        id: c.id,
        msg: e instanceof Error ? e.message : "Delete failed",
      });
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Categories"
        description="Organise products into categories and subcategories."
        action={
          <Button type="button" onClick={() => setCreateOpen(true)}>
            New category
          </Button>
        }
      />

      <CreateCategoryDialog open={createOpen} onOpenChange={setCreateOpen} />
      <EditCategoryDialog
        open={editOpen}
        onOpenChange={(o) => {
          setEditOpen(o);
          if (!o) setEditTarget(null);
        }}
        category={editTarget}
      />

      {initialData.length === 0 ? (
        <EmptyState
          title="No categories yet"
          description="Create your first category to start organising products."
          actionLabel="New category"
          onAction={() => setCreateOpen(true)}
        />
      ) : (
        <DataTable
          headers={[
            "Name",
            "Description",
            "Subcategories",
            "Products",
            "Active",
            "Actions",
          ]}
        >
          {initialData.map((c) => (
            <TableRow key={c.id}>
              <TableCell className="font-medium text-coal">{c.name}</TableCell>
              <TableCell className="max-w-xs truncate text-body text-neutral-30">
                {c.description ?? "—"}
              </TableCell>
              <TableCell className="text-body text-neutral-30">
                {c._count.subCategories}
              </TableCell>
              <TableCell className="text-body text-neutral-30">
                {c._count.products}
              </TableCell>
              <TableCell>
                <StatusBadge isActive={c.isActive} />
              </TableCell>
              <TableCell>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => openEdit(c)}
                  >
                    Edit
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={busyId === c.id}
                    onClick={() => void toggleActive(c)}
                  >
                    {c.isActive ? "Deactivate" : "Activate"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={busyId === c.id}
                    onClick={() => void handleDelete(c)}
                  >
                    Delete
                  </Button>
                </div>
                {rowError?.id === c.id && (
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
