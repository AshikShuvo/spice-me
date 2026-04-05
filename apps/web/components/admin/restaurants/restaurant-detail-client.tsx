"use client";

import { useRouter } from "@/i18n/navigation";
import { useMemo, useState } from "react";

import { AssignAdminDialog } from "@/components/admin/restaurants/assign-admin-dialog";
import { EditRestaurantDialog } from "@/components/admin/restaurants/edit-restaurant-dialog";
import { DataTable } from "@/components/admin/data-table";
import { PageHeader } from "@/components/admin/page-header";
import { StatusBadge } from "@/components/admin/status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { TableCell, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useRestaurantService } from "@/lib/services/use-restaurant-service";
import type {
  RestaurantAdminAssignmentRow,
  RestaurantProfile,
} from "@/lib/types/admin-api";

export function RestaurantDetailClient({
  restaurant: initialRestaurant,
  assignments: initialAssignments,
}: {
  restaurant: RestaurantProfile;
  assignments: RestaurantAdminAssignmentRow[];
}) {
  const router = useRouter();
  const restaurantService = useRestaurantService();
  const [editOpen, setEditOpen] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const [busyUserId, setBusyUserId] = useState<string | null>(null);

  const restaurant = initialRestaurant;
  const assignments = initialAssignments;
  const excludeUserIds = useMemo(
    () => assignments.map((a) => a.user.id),
    [assignments],
  );

  async function removeAdmin(userId: string) {
    if (!confirm("Remove this admin from the restaurant?")) return;
    setBusyUserId(userId);
    try {
      await restaurantService.removeAdmin(restaurant.id, userId);
      router.refresh();
    } finally {
      setBusyUserId(null);
    }
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title={restaurant.name}
        description={`Code ${restaurant.code} · ${restaurant.timezone}`}
        action={
          <Button type="button" variant="outline" onClick={() => setEditOpen(true)}>
            Edit details
          </Button>
        }
      />

      <EditRestaurantDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        restaurant={restaurant}
      />

      <AssignAdminDialog
        restaurantId={restaurant.id}
        open={assignOpen}
        onOpenChange={setAssignOpen}
        excludeUserIds={excludeUserIds}
      />

      <Tabs defaultValue="details" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="admins">Admins</TabsTrigger>
        </TabsList>
        <TabsContent value="details" className="mt-6">
          <Card className="border-coal-20">
            <CardHeader>
              <CardTitle className="text-label text-coal">Restaurant</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-caption text-neutral-30">Status</p>
                  <StatusBadge isActive={restaurant.isActive} />
                </div>
                <div>
                  <p className="text-caption text-neutral-30">Default</p>
                  {restaurant.isDefault ? (
                    <Badge variant="secondary" className="bg-peppes-red/10 text-peppes-red">
                      Default restaurant
                    </Badge>
                  ) : (
                    <span className="text-body text-neutral-30">No</span>
                  )}
                </div>
              </div>
              <Separator />
              <div>
                <p className="text-caption text-neutral-30">Address</p>
                <p className="text-body text-coal">{restaurant.address}</p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-caption text-neutral-30">Latitude</p>
                  <p className="text-body text-coal">{restaurant.latitude}</p>
                </div>
                <div>
                  <p className="text-caption text-neutral-30">Longitude</p>
                  <p className="text-body text-coal">{restaurant.longitude}</p>
                </div>
              </div>
              <div>
                <p className="text-caption text-neutral-30">Hours (UTC)</p>
                <p className="text-body text-coal">
                  {restaurant.openingTime} – {restaurant.closingTime}
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="admins" className="mt-6 space-y-4">
          <div className="flex justify-end">
            <Button type="button" onClick={() => setAssignOpen(true)}>
              Assign admin
            </Button>
          </div>
          {assignments.length === 0 ? (
            <p className="text-body text-neutral-30">
              No restaurant admins assigned yet.
            </p>
          ) : (
            <DataTable headers={["Name", "Email", "Assigned", "Actions"]}>
              {assignments.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="font-medium text-coal">
                    {row.user.name}
                  </TableCell>
                  <TableCell className="text-body text-neutral-30">
                    {row.user.email}
                  </TableCell>
                  <TableCell className="text-body text-neutral-30">
                    {new Date(row.assignedAt).toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={busyUserId === row.user.id}
                      onClick={() => void removeAdmin(row.user.id)}
                    >
                      Remove
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </DataTable>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
