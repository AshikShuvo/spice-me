"use client";

import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

import { ReserveBookingScheduler } from "@/components/reserve/reserve-booking-scheduler";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, type Resolver } from "react-hook-form";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { usePublicRestaurant } from "@/components/public-restaurant/public-restaurant-context";
import { fetchMenuPublicClient } from "@/lib/fetch-menu-public-client";
import { useRestaurantTablesService } from "@/lib/services/use-restaurant-tables-service";
import { useTableReservationsService } from "@/lib/services/use-table-reservations-service";
import type { RestaurantTableProfile, TableReservationProfile } from "@/lib/types/admin-api";
import {
  createTableReservationSchema,
  type CreateTableReservationInput,
} from "@/lib/validations/restaurant-tables";

type ReserveRestaurant = { id: string; name: string; code: string };

export function ReservePageClient() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const t = useTranslations("reserve");
  const { restaurantCode } = usePublicRestaurant();
  const tablesService = useRestaurantTablesService();
  const reservationsService = useTableReservationsService();

  const [restaurant, setRestaurant] = useState<ReserveRestaurant | null>(null);
  const [tables, setTables] = useState<RestaurantTableProfile[]>([]);
  const [mine, setMine] = useState<TableReservationProfile[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [scheduleOk, setScheduleOk] = useState(false);

  const form = useForm<CreateTableReservationInput>({
    resolver: zodResolver(
      createTableReservationSchema,
    ) as Resolver<CreateTableReservationInput>,
    defaultValues: {
      tableId: "",
      startsAt: "",
      endsAt: "",
      partySize: 2,
    },
  });

  const partySize = form.watch("partySize");
  const watchedTableId = form.watch("tableId");

  const onScheduleRangeChange = useCallback(
    (startsAt: string, endsAt: string) => {
      const hasRange =
        startsAt.trim().length > 0 && endsAt.trim().length > 0;
      form.setValue("startsAt", startsAt, {
        shouldDirty: true,
        shouldValidate: hasRange,
      });
      form.setValue("endsAt", endsAt, {
        shouldDirty: true,
        shouldValidate: hasRange,
      });
      if (!hasRange) {
        form.clearErrors(["startsAt", "endsAt"]);
      }
    },
    [form],
  );

  const eligibleTables = useMemo(
    () => tables.filter((t) => t.seatCount >= Number(partySize) || !partySize),
    [tables, partySize],
  );

  const loadTables = useCallback(
    async (restaurantId: string) => {
      try {
        const rows = await tablesService.getTablesPublic(restaurantId);
        setTables(rows);
      } catch {
        setTables([]);
      }
    },
    [tablesService],
  );

  const loadMine = useCallback(async () => {
    try {
      const page = await reservationsService.listMine(1, 50);
      setMine(page.data);
    } catch {
      setMine([]);
    }
  }, [reservationsService]);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/login");
    }
  }, [status, router]);

  useEffect(() => {
    if (status !== "authenticated" || session?.user?.role !== "USER") return;
    let cancelled = false;
    void (async () => {
      setLoadError(null);
      if (!restaurantCode?.trim()) {
        setRestaurant(null);
        setTables([]);
        await loadMine();
        return;
      }
      try {
        const menu = await fetchMenuPublicClient(restaurantCode);
        if (cancelled) return;
        if (!menu.restaurant) {
          setRestaurant(null);
          setTables([]);
          setLoadError(t("menu_location_invalid"));
          await loadMine();
          return;
        }
        const r: ReserveRestaurant = {
          id: menu.restaurant.id,
          name: menu.restaurant.name,
          code: menu.restaurant.code,
        };
        setRestaurant(r);
        await loadTables(r.id);
        await loadMine();
      } catch {
        if (cancelled) return;
        setRestaurant(null);
        setTables([]);
        setLoadError(t("menu_load_failed"));
        await loadMine();
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [status, session?.user?.role, restaurantCode, loadTables, loadMine, t]);

  async function onSubmit(values: CreateTableReservationInput) {
    if (!restaurant || !scheduleOk) return;
    try {
      const startsAt = new Date(values.startsAt).toISOString();
      const endsAt = new Date(values.endsAt).toISOString();
      await reservationsService.create(restaurant.id, {
        ...values,
        startsAt,
        endsAt,
      });
      form.reset({
        tableId: "",
        startsAt: "",
        endsAt: "",
        partySize: values.partySize,
      });
      await loadMine();
    } catch (err) {
      form.setError("root", {
        message: err instanceof Error ? err.message : "Booking failed",
      });
    }
  }

  async function cancelReservation(id: string) {
    if (!window.confirm("Cancel this reservation?")) return;
    try {
      await reservationsService.cancel(id);
      await loadMine();
    } catch {
      /* surface via alert optional */
    }
  }

  if (status === "loading") {
    return <p className="text-body text-neutral-30">Loading…</p>;
  }

  if (session?.user?.role !== "USER") {
    return (
      <div className="mx-auto w-full max-w-lg space-y-2 px-4 py-8">
        <h1 className="text-headline font-ringside-compressed text-coal">Reserve a table</h1>
        <p className="text-body text-neutral-30">
          Sign in with a customer account to book a table. Staff accounts cannot place reservations
          through this page.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-lg space-y-10 px-4 py-8">
      <div className="space-y-2">
        <h1 className="text-headline font-ringside-compressed text-coal">Reserve a table</h1>
        <p className="text-body text-neutral-30">
          {restaurant
            ? `${restaurant.name} — pick a time and table. Times are sent in your local timezone and stored in UTC.`
            : loadError ??
              (!restaurantCode?.trim()
                ? t("select_location_hint")
                : t("loading_location"))}
        </p>
      </div>

      {restaurant ? (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="partySize"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Party size</FormLabel>
                  <FormControl>
                    <Input type="number" min={1} max={100} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="tableId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Table</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a table" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {eligibleTables.map((t) => (
                        <SelectItem key={t.id} value={t.id}>
                          #{t.tableNumber} — {t.seatCount} seats
                          {t.locationLabel ? ` (${t.locationLabel})` : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="startsAt"
              render={() => (
                <FormItem>
                  <FormLabel>{t("booking_time")}</FormLabel>
                  <FormControl>
                    <ReserveBookingScheduler
                      restaurantId={restaurant.id}
                      tableId={watchedTableId}
                      onRangeChange={onScheduleRangeChange}
                      onAvailabilityChange={setScheduleOk}
                      disabled={form.formState.isSubmitting}
                    />
                  </FormControl>
                  {form.formState.errors.startsAt?.message ||
                  form.formState.errors.endsAt?.message ? (
                    <p className="text-caption text-peppes-red">
                      {String(
                        form.formState.errors.startsAt?.message ??
                          form.formState.errors.endsAt?.message ??
                          "",
                      )}
                    </p>
                  ) : null}
                </FormItem>
              )}
            />
            {form.formState.errors.root ? (
              <p className="text-body text-peppes-red">{form.formState.errors.root.message}</p>
            ) : null}
            <Button
              type="submit"
              disabled={form.formState.isSubmitting || !scheduleOk || !watchedTableId}
            >
              Request reservation
            </Button>
          </form>
        </Form>
      ) : null}

      {session?.user?.role === "USER" ? (
        <section className="space-y-3">
          <h2 className="text-title font-ringside-compressed text-coal">Your reservations</h2>
          {mine.length === 0 ? (
            <p className="text-body text-neutral-30">No reservations yet.</p>
          ) : (
            <ul className="space-y-3 border-t border-coal-20 pt-4">
              {mine.map((r) => (
                <li
                  key={r.id}
                  className="flex flex-col gap-2 rounded-md border border-coal-20 bg-white p-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="text-body font-medium text-coal">
                      {r.restaurant.name} · Table {r.table.tableNumber}
                    </p>
                    <p className="text-caption text-neutral-30">
                      {new Date(r.startsAt).toLocaleString()} —{" "}
                      {new Date(r.endsAt).toLocaleString()} · {r.partySize} guests · {r.status}
                    </p>
                  </div>
                  {(r.status === "PENDING" || r.status === "CONFIRMED") &&
                  new Date(r.startsAt) > new Date() ? (
                    <Button type="button" variant="outline" size="sm" onClick={() => void cancelReservation(r.id)}>
                      Cancel
                    </Button>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : null}
    </div>
  );
}
