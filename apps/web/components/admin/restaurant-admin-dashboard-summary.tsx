"use client";

import { StatusBadge } from "@/components/admin/status-badge";
import { useSelectedRestaurant } from "@/components/admin/selected-restaurant-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

/** Admin dashboard panel for `RESTAURANT_ADMIN` (requires `SelectedRestaurantProvider`). */
export function RestaurantAdminDashboardSummary() {
  const { restaurants, selectedRestaurant } = useSelectedRestaurant();

  if (restaurants.length === 0) {
    return (
      <Card className="border-coal-20">
        <CardHeader className="pb-2">
          <CardTitle className="text-label text-coal">Your restaurants</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-body text-neutral-30">
            You are not assigned to any restaurant yet. Ask a platform admin to assign
            you from the restaurant settings.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (!selectedRestaurant) {
    return null;
  }

  return (
    <Card className="border-coal-20">
      <CardHeader className="pb-2">
        <CardTitle className="text-label text-coal">Selected restaurant</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-headline font-ringside-compressed text-coal">
            {selectedRestaurant.name}
          </p>
          <StatusBadge isActive={selectedRestaurant.isActive} />
        </div>
        <p className="text-caption text-neutral-30">
          Code {selectedRestaurant.code} · {selectedRestaurant.timezone} ·{" "}
          {selectedRestaurant.openingTime}–{selectedRestaurant.closingTime} UTC
        </p>
        <p className="text-body text-neutral-30">
          Dashboard metrics and orders for this location will appear here in a future
          update.
        </p>
      </CardContent>
    </Card>
  );
}
