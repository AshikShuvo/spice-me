"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "@/i18n/navigation";
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
import {
  createRestaurantTableSchema,
  type CreateRestaurantTableInput,
} from "@/lib/validations/restaurant-tables";

type FormValues = CreateRestaurantTableInput;

export function CreateTableDialog({
  open,
  onOpenChange,
  restaurantId,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  restaurantId: string;
  onCreated?: () => void | Promise<void>;
}) {
  const router = useRouter();
  const tablesService = useRestaurantTablesService();

  const form = useForm<FormValues>({
    resolver: zodResolver(
      createRestaurantTableSchema,
    ) as Resolver<FormValues>,
    defaultValues: {
      tableNumber: "",
      seatCount: 4,
      locationLabel: "",
      notes: "",
      isActive: true,
    },
  });

  async function onSubmit(values: CreateRestaurantTableInput) {
    try {
      await tablesService.createTable(restaurantId, {
        ...values,
        locationLabel: values.locationLabel?.trim() || undefined,
        notes: values.notes?.trim() || undefined,
      });
      form.reset({
        tableNumber: "",
        seatCount: 4,
        locationLabel: "",
        notes: "",
        isActive: true,
      });
      onOpenChange(false);
      await onCreated?.();
      router.refresh();
    } catch (err) {
      form.setError("root", {
        message: err instanceof Error ? err.message : "Could not create table",
      });
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>New table</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="tableNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Table number</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. 12 or A3" {...field} />
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
                  <FormLabel>Location (optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Window, patio…" {...field} />
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
                  <FormLabel>Notes (optional)</FormLabel>
                  <FormControl>
                    <Input {...field} />
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
                  <FormLabel className="!mt-0">Active (bookable)</FormLabel>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
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
                Create
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
