"use client";

import { useRouter } from "@/i18n/navigation";
import { useState } from "react";

import { CreateRestaurantAdminDialog } from "@/components/admin/restaurant-admins/create-restaurant-admin-dialog";
import { DataTable } from "@/components/admin/data-table";
import { EmptyState } from "@/components/admin/empty-state";
import { PageHeader } from "@/components/admin/page-header";
import { StatusBadge } from "@/components/admin/status-badge";
import { Button } from "@/components/ui/button";
import { TableCell, TableRow } from "@/components/ui/table";
import { useUserService } from "@/lib/services/use-user-service";
import type { UserProfile } from "@/lib/types/admin-api";

export function RestaurantAdminListClient({
  initialAdmins,
}: {
  initialAdmins: UserProfile[];
}) {
  const router = useRouter();
  const userService = useUserService();
  const [createOpen, setCreateOpen] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function deactivate(user: UserProfile) {
    if (!confirm(`Deactivate ${user.name}? They will lose access and assignments.`)) {
      return;
    }
    setBusyId(user.id);
    try {
      await userService.softDeleteUser(user.id);
      router.refresh();
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Restaurant admins"
        description="Create accounts with the restaurant admin role, then assign them to restaurants."
        action={
          <Button type="button" onClick={() => setCreateOpen(true)}>
            New restaurant admin
          </Button>
        }
      />

      <CreateRestaurantAdminDialog open={createOpen} onOpenChange={setCreateOpen} />

      {initialAdmins.length === 0 ? (
        <EmptyState
          title="No restaurant admins"
          description="Create a user with the restaurant admin role. You can then assign them from each restaurant’s page."
          actionLabel="New restaurant admin"
          onAction={() => setCreateOpen(true)}
        />
      ) : (
        <DataTable headers={["Name", "Email", "Status", "Created", "Actions"]}>
          {initialAdmins.map((u) => (
            <TableRow key={u.id}>
              <TableCell className="font-medium text-coal">{u.name}</TableCell>
              <TableCell className="text-body text-neutral-30">{u.email}</TableCell>
              <TableCell>
                <StatusBadge isActive={u.isActive} />
              </TableCell>
              <TableCell className="text-body text-neutral-30">
                {new Date(u.createdAt).toLocaleDateString()}
              </TableCell>
              <TableCell>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={!u.isActive || busyId === u.id}
                  onClick={() => void deactivate(u)}
                >
                  Deactivate
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </DataTable>
      )}
    </div>
  );
}
