"use client";

import { useEffect, useState } from "react";

import { CreateSubcategoryDialog } from "@/components/admin/products/subcategories/create-subcategory-dialog";
import { EditSubcategoryDialog } from "@/components/admin/products/subcategories/edit-subcategory-dialog";
import { DataTable } from "@/components/admin/data-table";
import { EmptyState } from "@/components/admin/empty-state";
import { PageHeader } from "@/components/admin/page-header";
import { StatusBadge } from "@/components/admin/status-badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TableCell, TableRow } from "@/components/ui/table";
import { useCategoryService } from "@/lib/services/use-category-service";
import type { CategoryProfile, SubCategoryProfile } from "@/lib/types/admin-api";

export function SubcategoryListClient({
  categories,
}: {
  categories: CategoryProfile[];
}) {
  const categoryService = useCategoryService();

  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(
    null,
  );
  const [subcategories, setSubcategories] = useState<SubCategoryProfile[]>([]);
  const [loadingSubcats, setLoadingSubcats] = useState(false);

  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<SubCategoryProfile | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [rowError, setRowError] = useState<{ id: string; msg: string } | null>(
    null,
  );

  useEffect(() => {
    if (!selectedCategoryId) {
      setSubcategories([]);
      return;
    }
    setLoadingSubcats(true);
    categoryService
      .getCategory(selectedCategoryId)
      .then((cat) => setSubcategories(cat.subCategories ?? []))
      .catch(() => setSubcategories([]))
      .finally(() => setLoadingSubcats(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCategoryId]);

  function refreshSubcats() {
    if (!selectedCategoryId) return;
    setLoadingSubcats(true);
    categoryService
      .getCategory(selectedCategoryId)
      .then((cat) => setSubcategories(cat.subCategories ?? []))
      .catch(() => {})
      .finally(() => setLoadingSubcats(false));
  }

  function openEdit(sub: SubCategoryProfile) {
    setEditTarget(sub);
    setEditOpen(true);
  }

  async function toggleActive(sub: SubCategoryProfile) {
    if (!selectedCategoryId) return;
    setBusyId(sub.id);
    setRowError(null);
    try {
      await categoryService.updateSubcategory(selectedCategoryId, sub.id, {
        isActive: !sub.isActive,
      });
      refreshSubcats();
    } catch (e) {
      setRowError({
        id: sub.id,
        msg: e instanceof Error ? e.message : "Update failed",
      });
    } finally {
      setBusyId(null);
    }
  }

  async function handleDelete(sub: SubCategoryProfile) {
    if (!selectedCategoryId) return;
    if (
      !confirm(
        `Delete subcategory "${sub.name}"? This will fail if any products use it.`,
      )
    )
      return;
    setBusyId(sub.id);
    setRowError(null);
    try {
      await categoryService.deleteSubcategory(selectedCategoryId, sub.id);
      refreshSubcats();
    } catch (e) {
      setRowError({
        id: sub.id,
        msg: e instanceof Error ? e.message : "Delete failed",
      });
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Sub Categories"
        description="Select a category to view and manage its subcategories."
        action={
          <Button
            type="button"
            disabled={!selectedCategoryId}
            onClick={() => setCreateOpen(true)}
          >
            New sub category
          </Button>
        }
      />

      <div className="max-w-xs">
        <Select
          value={selectedCategoryId ?? ""}
          onValueChange={(v) => setSelectedCategoryId(v || null)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select a category" />
          </SelectTrigger>
          <SelectContent>
            {categories.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {selectedCategoryId && (
        <>
          <CreateSubcategoryDialog
            open={createOpen}
            onOpenChange={setCreateOpen}
            categoryId={selectedCategoryId}
            onCreated={refreshSubcats}
          />
          <EditSubcategoryDialog
            open={editOpen}
            onOpenChange={(o) => {
              setEditOpen(o);
              if (!o) setEditTarget(null);
            }}
            categoryId={selectedCategoryId}
            subcategory={editTarget}
            onUpdated={refreshSubcats}
          />

          {loadingSubcats && (
            <p className="text-body text-neutral-30">Loading…</p>
          )}

          {!loadingSubcats && subcategories.length === 0 && (
            <EmptyState
              title="No subcategories yet"
              description="Add subcategories to organise products within this category."
              actionLabel="New sub category"
              onAction={() => setCreateOpen(true)}
            />
          )}

          {!loadingSubcats && subcategories.length > 0 && (
            <DataTable
              headers={["Name", "Description", "Sort Order", "Active", "Actions"]}
            >
              {subcategories.map((sub) => (
                <TableRow key={sub.id}>
                  <TableCell className="font-medium text-coal">
                    {sub.name}
                  </TableCell>
                  <TableCell className="max-w-xs truncate text-body text-neutral-30">
                    {sub.description ?? "—"}
                  </TableCell>
                  <TableCell className="text-body text-neutral-30">
                    {sub.sortOrder}
                  </TableCell>
                  <TableCell>
                    <StatusBadge isActive={sub.isActive} />
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => openEdit(sub)}
                      >
                        Edit
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={busyId === sub.id}
                        onClick={() => void toggleActive(sub)}
                      >
                        {sub.isActive ? "Deactivate" : "Activate"}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={busyId === sub.id}
                        onClick={() => void handleDelete(sub)}
                      >
                        Delete
                      </Button>
                    </div>
                    {rowError?.id === sub.id && (
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
          )}
        </>
      )}
    </div>
  );
}
