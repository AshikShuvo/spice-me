"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useSelectedRestaurant } from "@/components/admin/selected-restaurant-context";

export function RestaurantAdminRestaurantSelect() {
  const { restaurants, selectedId, setSelectedId } = useSelectedRestaurant();

  if (restaurants.length === 0) {
    return (
      <p className="mt-3 text-caption text-neutral-30">
        No restaurants assigned yet. Contact an administrator to get access.
      </p>
    );
  }

  const value = selectedId ?? restaurants[0]!.id;

  return (
    <div className="mt-3 space-y-1.5">
      <p className="text-caption font-medium text-coal-60">Active restaurant</p>
      <Select value={value} onValueChange={setSelectedId}>
        <SelectTrigger className="w-full border-coal-20 bg-white text-left text-body text-coal">
          <SelectValue placeholder="Select restaurant" />
        </SelectTrigger>
        <SelectContent>
          {restaurants.map((r) => (
            <SelectItem key={r.id} value={r.id}>
              {r.name}
              <span className="ml-1 text-muted-foreground">({r.code})</span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <p className="text-caption text-neutral-30">
        Orders and stats will use this location once those features are available.
      </p>
    </div>
  );
}
