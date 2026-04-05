"use client";

import { Link, useRouter } from "@/i18n/navigation";
import { useState } from "react";

import { CreateRestaurantDialog } from "@/components/admin/restaurants/create-restaurant-dialog";
import { EditRestaurantDialog } from "@/components/admin/restaurants/edit-restaurant-dialog";
import { DataTable } from "@/components/admin/data-table";
import { EmptyState } from "@/components/admin/empty-state";
import { PageHeader } from "@/components/admin/page-header";
import { StatusBadge } from "@/components/admin/status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TableCell, TableRow } from "@/components/ui/table";
import { useRestaurantService } from "@/lib/services/use-restaurant-service";
import type { RestaurantProfile } from "@/lib/types/admin-api";

export function RestaurantListClient({
  initialData,
  page,
  limit,
  total,
}: {
  initialData: RestaurantProfile[];
  page: number;
  limit: number;
  total: number;
}) {
  const router = useRouter();
  const restaurantService = useRestaurantService();
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<RestaurantProfile | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const totalPages = Math.max(1, Math.ceil(total / limit));

  function openEdit(r: RestaurantProfile) {
    setEditing(r);
    setEditOpen(true);
  }

  async function toggleStatus(r: RestaurantProfile) {
    setBusyId(r.id);
    try {
      await restaurantService.updateRestaurantStatus(r.id, !r.isActive);
      router.refresh();
    } finally {
      setBusyId(null);
    }
  }

  async function setDefault(r: RestaurantProfile) {
    setBusyId(r.id);
    try {
      await restaurantService.setDefaultRestaurant(r.id);
      router.refresh();
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Restaurants"
        description="Create restaurants, set opening hours (UTC), and manage the default location."
        action={
          <Button type="button" onClick={() => setCreateOpen(true)}>
            New restaurant
          </Button>
        }
      />

      <CreateRestaurantDialog open={createOpen} onOpenChange={setCreateOpen} />
      <EditRestaurantDialog
        open={editOpen}
        onOpenChange={(o) => {
          setEditOpen(o);
          if (!o) setEditing(null);
        }}
        restaurant={editing}
      />

      {initialData.length === 0 ? (
        <EmptyState
          title="No restaurants yet"
          description="Create your first restaurant to assign admins and set a default for the menu."
          actionLabel="New restaurant"
          onAction={() => setCreateOpen(true)}
        />
      ) : (
        <>
          <DataTable
            headers={[
              "Name",
              "Code",
              "Status",
              "Default",
              "Hours (UTC)",
              "Actions",
            ]}
          >
            {initialData.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="font-medium text-coal">{r.name}</TableCell>
                <TableCell className="text-body text-neutral-30">{r.code}</TableCell>
                <TableCell>
                  <StatusBadge isActive={r.isActive} />
                </TableCell>
                <TableCell>
                  {r.isDefault ? (
                    <Badge variant="secondary" className="bg-peppes-red/10 text-peppes-red">
                      Default
                    </Badge>
                  ) : (
                    <span className="text-body text-neutral-30">—</span>
                  )}
                </TableCell>
                <TableCell className="text-body text-neutral-30">
                  {r.openingTime} – {r.closingTime}
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-2">
                    <Button type="button" variant="outline" size="sm" asChild>
                      <Link href={`/admin/restaurants/${r.id}`}>View</Link>
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => openEdit(r)}
                    >
                      Edit
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={busyId === r.id}
                      onClick={() => void toggleStatus(r)}
                    >
                      {r.isActive ? "Deactivate" : "Activate"}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={busyId === r.id || r.isDefault}
                      onClick={() => void setDefault(r)}
                    >
                      Set default
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </DataTable>

          <div className="flex items-center justify-between gap-4">
            <p className="text-caption text-neutral-30">
              Page {page} of {totalPages} · {total} restaurants
            </p>
            <div className="flex gap-2">
              {page <= 1 ? (
                <Button type="button" variant="outline" size="sm" disabled>
                  Previous
                </Button>
              ) : (
                <Button type="button" variant="outline" size="sm" asChild>
                  <Link href={`/admin/restaurants?page=${page - 1}`}>Previous</Link>
                </Button>
              )}
              {page >= totalPages ? (
                <Button type="button" variant="outline" size="sm" disabled>
                  Next
                </Button>
              ) : (
                <Button type="button" variant="outline" size="sm" asChild>
                  <Link href={`/admin/restaurants?page=${page + 1}`}>Next</Link>
                </Button>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
