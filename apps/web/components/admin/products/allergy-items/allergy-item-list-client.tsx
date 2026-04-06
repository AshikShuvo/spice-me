"use client";

import { useRouter } from "@/i18n/navigation";
import { useState } from "react";

import { CreateAllergyItemDialog } from "@/components/admin/products/allergy-items/create-allergy-item-dialog";
import { EditAllergyItemDialog } from "@/components/admin/products/allergy-items/edit-allergy-item-dialog";
import { DataTable } from "@/components/admin/data-table";
import { EmptyState } from "@/components/admin/empty-state";
import { PageHeader } from "@/components/admin/page-header";
import { Button } from "@/components/ui/button";
import { TableCell, TableRow } from "@/components/ui/table";
import { useAllergyItemService } from "@/lib/services/use-allergy-item-service";
import type { AllergyItemProfile } from "@/lib/types/admin-api";

export function AllergyItemListClient({
  initialData,
}: {
  initialData: AllergyItemProfile[];
}) {
  const router = useRouter();
  const allergyItemService = useAllergyItemService();

  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<AllergyItemProfile | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [rowError, setRowError] = useState<{ id: string; msg: string } | null>(
    null,
  );

  function openEdit(item: AllergyItemProfile) {
    setEditTarget(item);
    setEditOpen(true);
  }

  async function handleDelete(item: AllergyItemProfile) {
    if (!confirm(`Delete allergy item "${item.name}"?`)) return;
    setBusyId(item.id);
    setRowError(null);
    try {
      await allergyItemService.deleteAllergyItem(item.id);
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
        title="Allergy Items"
        description="Manage the reference list of allergy items linked to products."
        action={
          <Button type="button" onClick={() => setCreateOpen(true)}>
            New allergy item
          </Button>
        }
      />

      <CreateAllergyItemDialog open={createOpen} onOpenChange={setCreateOpen} />
      <EditAllergyItemDialog
        open={editOpen}
        onOpenChange={(o) => {
          setEditOpen(o);
          if (!o) setEditTarget(null);
        }}
        item={editTarget}
      />

      {initialData.length === 0 ? (
        <EmptyState
          title="No allergy items yet"
          description="Create allergy items to link them to products."
          actionLabel="New allergy item"
          onAction={() => setCreateOpen(true)}
        />
      ) : (
        <DataTable headers={["Name", "Description", "Icon URL", "Actions"]}>
          {initialData.map((item) => (
            <TableRow key={item.id}>
              <TableCell className="font-medium text-coal">{item.name}</TableCell>
              <TableCell className="max-w-xs truncate text-body text-neutral-30">
                {item.description ?? "—"}
              </TableCell>
              <TableCell className="max-w-xs truncate text-body text-neutral-30">
                {item.iconUrl ?? "—"}
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
