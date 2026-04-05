"use client";

import { useRouter } from "@/i18n/navigation";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Combobox, type ComboboxOption } from "@/components/ui/combobox";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useRestaurantService } from "@/lib/services/use-restaurant-service";
import { useUserService } from "@/lib/services/use-user-service";

export function AssignAdminDialog({
  restaurantId,
  open,
  onOpenChange,
  excludeUserIds,
}: {
  restaurantId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  excludeUserIds: string[];
}) {
  const router = useRouter();
  const userService = useUserService();
  const restaurantService = useRestaurantService();
  const [options, setOptions] = useState<ComboboxOption[]>([]);
  const [userId, setUserId] = useState("");
  const [loadError, setLoadError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const excludeKey = [...excludeUserIds].sort().join("|");

  useEffect(() => {
    if (!open) {
      setUserId("");
      setLoadError(null);
      setSubmitError(null);
      return;
    }
    const exclude = new Set(excludeUserIds);
    let cancelled = false;
    (async () => {
      setLoadingUsers(true);
      setLoadError(null);
      try {
        const res = await userService.getUsers(1, 100);
        if (cancelled) return;
        const opts = res.data
          .filter(
            (u) => u.role === "RESTAURANT_ADMIN" && u.isActive && !exclude.has(u.id),
          )
          .map((u) => ({
            value: u.id,
            label: `${u.name} (${u.email})`,
          }));
        setOptions(opts);
      } catch (e) {
        if (!cancelled) {
          setLoadError(e instanceof Error ? e.message : "Failed to load users");
        }
      } finally {
        if (!cancelled) setLoadingUsers(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, excludeKey, excludeUserIds, userService]);

  async function handleAssign() {
    if (!userId) {
      setSubmitError("Select a restaurant admin");
      return;
    }
    setSubmitting(true);
    setSubmitError(null);
    try {
      await restaurantService.assignAdmin(restaurantId, userId);
      setUserId("");
      onOpenChange(false);
      router.refresh();
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : "Could not assign admin");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Assign restaurant admin</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          {loadError ? (
            <p className="text-body text-destructive" role="alert">
              {loadError}
            </p>
          ) : null}
          <div className="space-y-2">
            <Label>Restaurant admin</Label>
            <Combobox
              options={options}
              value={userId}
              onChange={setUserId}
              placeholder={
                loadingUsers ? "Loading…" : "Select a user"
              }
              searchPlaceholder="Search by name or email…"
              emptyText="No eligible restaurant admins."
              disabled={loadingUsers}
            />
          </div>
          {submitError ? (
            <p className="text-body text-destructive" role="alert">
              {submitError}
            </p>
          ) : null}
        </div>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            disabled={submitting || !userId}
            onClick={() => void handleAssign()}
          >
            Assign
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
