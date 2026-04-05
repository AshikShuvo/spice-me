"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "@/i18n/navigation";
import { useMemo } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Combobox } from "@/components/ui/combobox";
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
import { useRestaurantService } from "@/lib/services/use-restaurant-service";
import {
  createRestaurantSchema,
  type CreateRestaurantInput,
} from "@/lib/validations/restaurant";

type FormValues = CreateRestaurantInput;

function buildTimezoneOptions() {
  try {
    const zones =
      typeof Intl !== "undefined" &&
      "supportedValuesOf" in Intl &&
      typeof (Intl as unknown as { supportedValuesOf: (k: string) => string[] })
        .supportedValuesOf === "function"
        ? (Intl as unknown as { supportedValuesOf: (k: string) => string[] }).supportedValuesOf(
            "timeZone",
          )
        : [];
    return zones.map((z) => ({ value: z, label: z }));
  } catch {
    return [{ value: "UTC", label: "UTC" }];
  }
}

export function CreateRestaurantDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const restaurantService = useRestaurantService();
  const timezoneOptions = useMemo(() => buildTimezoneOptions(), []);

  const form = useForm<FormValues>({
    resolver: zodResolver(createRestaurantSchema),
    defaultValues: {
      name: "",
      address: "",
      latitude: 0,
      longitude: 0,
      timezone: "UTC",
      openingTime: "09:00",
      closingTime: "21:00",
    },
  });

  async function onSubmit(values: CreateRestaurantInput) {
    try {
      await restaurantService.createRestaurant(values);
      form.reset();
      onOpenChange(false);
      router.refresh();
    } catch (err) {
      form.setError("root", {
        message: err instanceof Error ? err.message : "Could not create restaurant",
      });
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>New restaurant</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input autoComplete="off" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Address</FormLabel>
                  <FormControl>
                    <Input autoComplete="off" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="latitude"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Latitude</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="any"
                        {...field}
                        value={Number.isFinite(field.value) ? field.value : ""}
                        onChange={(e) => {
                          const v = e.target.valueAsNumber;
                          field.onChange(Number.isNaN(v) ? 0 : v);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="longitude"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Longitude</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="any"
                        {...field}
                        value={Number.isFinite(field.value) ? field.value : ""}
                        onChange={(e) => {
                          const v = e.target.valueAsNumber;
                          field.onChange(Number.isNaN(v) ? 0 : v);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="timezone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Timezone (IANA)</FormLabel>
                  <FormControl>
                    <Combobox
                      options={timezoneOptions}
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="Select timezone"
                      searchPlaceholder="Search timezone…"
                      emptyText="No timezone found."
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="openingTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Opening (UTC HH:MM)</FormLabel>
                    <FormControl>
                      <Input type="time" step={60} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="closingTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Closing (UTC HH:MM)</FormLabel>
                    <FormControl>
                      <Input type="time" step={60} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            {form.formState.errors.root ? (
              <p className="text-body text-destructive" role="alert">
                {form.formState.errors.root.message}
              </p>
            ) : null}
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
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
