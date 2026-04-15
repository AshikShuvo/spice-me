"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "@/i18n/navigation";
import { useEffect } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useRestaurantTablesService } from "@/lib/services/use-restaurant-tables-service";
import type { RestaurantTableProfile } from "@/lib/types/admin-api";
import {
  updateRestaurantTableSchema,
  type UpdateRestaurantTableInput,
} from "@/lib/validations/restaurant-tables";

type FormValues = UpdateRestaurantTableInput;

export function EditTableDialog({
  open,
  onOpenChange,
  restaurantId,
  table,
  onUpdated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  restaurantId: string;
  table: RestaurantTableProfile | null;
  onUpdated?: () => void | Promise<void>;
}) {
  const router = useRouter();
  const tablesService = useRestaurantTablesService();

  const form = useForm<FormValues>({
    resolver: zodResolver(
      updateRestaurantTableSchema,
    ) as Resolver<FormValues>,
    defaultValues: {},
  });

  useEffect(() => {
    if (table && open) {
      form.reset({
        tableNumber: table.tableNumber,
        seatCount: table.seatCount,
        locationLabel: table.locationLabel ?? "",
        notes: table.notes ?? "",
        isActive: table.isActive,
      });
    }
  }, [table, open, form]);

  async function onSubmit(values: UpdateRestaurantTableInput) {
    if (!table) return;
    try {
      const payload: UpdateRestaurantTableInput = {
        ...values,
        locationLabel:
          values.locationLabel === "" || values.locationLabel === undefined
            ? null
            : values.locationLabel,
        notes:
          values.notes === "" || values.notes === undefined ? null : values.notes,
      };
      await tablesService.updateTable(restaurantId, table.id, payload);
      onOpenChange(false);
      await onUpdated?.();
      router.refresh();
    } catch (err) {
      form.setError("root", {
        message: err instanceof Error ? err.message : "Could not update table",
      });
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        onOpenChange(o);
        if (!o) form.reset({});
      }}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit table</DialogTitle>
        </DialogHeader>
        {table ? (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="tableNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Table number</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="seatCount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Seats</FormLabel>
                    <FormControl>
                      <Input type="number" min={1} max={100} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="locationLabel"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-md border border-coal-20 p-3">
                    <FormLabel className="!mt-0">Active</FormLabel>
                    <FormControl>
                      <Switch
                        checked={!!field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              {form.formState.errors.root ? (
                <p className="text-body text-peppes-red">
                  {form.formState.errors.root.message}
                </p>
              ) : null}
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={form.formState.isSubmitting}>
                  Save
                </Button>
              </DialogFooter>
            </form>
          </Form>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
