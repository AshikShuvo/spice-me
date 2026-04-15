"use client";

import { useSession } from "next-auth/react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { CreateTableDialog } from "@/components/admin/tables/create-table-dialog";
import { EditTableDialog } from "@/components/admin/tables/edit-table-dialog";
import { DataTable } from "@/components/admin/data-table";
import { EmptyState } from "@/components/admin/empty-state";
import { PageHeader } from "@/components/admin/page-header";
import { StatusBadge } from "@/components/admin/status-badge";
import { useSelectedRestaurant } from "@/components/admin/selected-restaurant-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TableCell, TableRow } from "@/components/ui/table";
import { useRestaurantTablesService } from "@/lib/services/use-restaurant-tables-service";
import { useTableReservationsService } from "@/lib/services/use-table-reservations-service";
import type { RestaurantTableProfile, TableReservationProfile } from "@/lib/types/admin-api";

function formatRange(isoStart: string, isoEnd: string) {
  try {
    const s = new Date(isoStart);
    const e = new Date(isoEnd);
    return `${s.toLocaleString()} → ${e.toLocaleString()}`;
  } catch {
    return `${isoStart} → ${isoEnd}`;
  }
}

export function AdminTablesPageClient() {
  const { data: session, status } = useSession();
  const role = session?.user?.role;
  const selectedCtx = useSelectedRestaurant();
  const tablesService = useRestaurantTablesService();
  const reservationsService = useTableReservationsService();

  const [tables, setTables] = useState<RestaurantTableProfile[]>([]);
  const [reservations, setReservations] = useState<TableReservationProfile[]>([]);
  const [startsFrom, setStartsFrom] = useState("");
  const [startsTo, setStartsTo] = useState("");
  const [loading, setLoading] = useState(false);
  const [resLoading, setResLoading] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<RestaurantTableProfile | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [busyReservationId, setBusyReservationId] = useState<string | null>(null);

  const effectiveRestaurantId = useMemo(
    () => selectedCtx.selectedId,
    [selectedCtx.selectedId],
  );

  const loadTables = useCallback(async () => {
    if (!effectiveRestaurantId) {
      setTables([]);
      return;
    }
    setLoading(true);
    try {
      const rows = await tablesService.getTablesManage(effectiveRestaurantId);
      setTables(rows);
    } catch {
      setTables([]);
    } finally {
      setLoading(false);
    }
  }, [effectiveRestaurantId, tablesService]);

  const loadReservations = useCallback(async () => {
    if (!effectiveRestaurantId) {
      setReservations([]);
      return;
    }
    setResLoading(true);
    try {
      const q: { startsFrom?: string; startsTo?: string } = {};
      if (startsFrom.trim()) q.startsFrom = new Date(startsFrom).toISOString();
      if (startsTo.trim()) q.startsTo = new Date(startsTo).toISOString();
      const rows = await reservationsService.listForRestaurant(
        effectiveRestaurantId,
        Object.keys(q).length ? q : undefined,
      );
      setReservations(rows);
    } catch {
      setReservations([]);
    } finally {
      setResLoading(false);
    }
  }, [effectiveRestaurantId, reservationsService, startsFrom, startsTo]);

  useEffect(() => {
    void loadTables();
  }, [loadTables]);

  useEffect(() => {
    void loadReservations();
  }, [loadReservations]);

  async function onConfirmReservation(r: TableReservationProfile) {
    if (!effectiveRestaurantId) return;
    setBusyReservationId(r.id);
    try {
      await reservationsService.confirmRestaurantReservation(
        effectiveRestaurantId,
        r.id,
      );
      await loadReservations();
    } finally {
      setBusyReservationId(null);
    }
  }

  async function onUnconfirmReservation(r: TableReservationProfile) {
    if (!effectiveRestaurantId) return;
    setBusyReservationId(r.id);
    try {
      await reservationsService.unconfirmRestaurantReservation(
        effectiveRestaurantId,
        r.id,
      );
      await loadReservations();
    } finally {
      setBusyReservationId(null);
    }
  }

  async function onDeleteTable(t: RestaurantTableProfile) {
    if (!effectiveRestaurantId) return;
    if (
      !window.confirm(
        `Delete table ${t.tableNumber}? This only works if the table has no reservations.`,
      )
    ) {
      return;
    }
    setBusyId(t.id);
    try {
      await tablesService.deleteTable(effectiveRestaurantId, t.id);
      await loadTables();
    } finally {
      setBusyId(null);
    }
  }

  if (status === "loading") {
    return <p className="text-body text-neutral-30">Loading…</p>;
  }

  if (role !== "RESTAURANT_ADMIN") {
    return (
      <div className="space-y-2">
        <p className="text-body text-coal">Table management is for restaurant administrators.</p>
        <p className="text-body text-neutral-30">
          Platform admins manage restaurants and assignments elsewhere; table stats for admins may
          be added later.
        </p>
      </div>
    );
  }

  const emptyAssigned =
    role === "RESTAURANT_ADMIN" &&
    (selectedCtx.restaurants.length === 0 || !effectiveRestaurantId);

  return (
    <div className="space-y-10">
      <PageHeader
        title="Tables & reservations"
        description="Register physical tables and review bookings for your location."
        action={
          effectiveRestaurantId ? (
            <Button type="button" onClick={() => setCreateOpen(true)}>
              New table
            </Button>
          ) : null
        }
      />

      {emptyAssigned ? (
        <EmptyState
          title="No restaurant assigned"
          description="Ask a system administrator to assign you to a restaurant."
        />
      ) : !effectiveRestaurantId ? (
        <EmptyState
          title="Select a restaurant"
          description="Choose the active location in the sidebar (Active restaurant) to manage its tables and reservations."
        />
      ) : (
        <>
          <CreateTableDialog
            open={createOpen}
            onOpenChange={setCreateOpen}
            restaurantId={effectiveRestaurantId}
            onCreated={loadTables}
          />
          <EditTableDialog
            open={editOpen}
            onOpenChange={(o) => {
              setEditOpen(o);
              if (!o) setEditing(null);
            }}
            restaurantId={effectiveRestaurantId}
            table={editing}
            onUpdated={loadTables}
          />

          <section className="space-y-4">
            <h2 className="text-title font-ringside-compressed text-coal">Tables</h2>
            {loading ? (
              <p className="text-body text-neutral-30">Loading tables…</p>
            ) : tables.length === 0 ? (
              <EmptyState
                title="No tables yet"
                description="Add a table with a number and seat count so guests can reserve it."
                actionLabel="New table"
                onAction={() => setCreateOpen(true)}
              />
            ) : (
              <DataTable headers={["Number", "Seats", "Location", "Status", ""]}>
                {tables.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell className="font-medium text-coal">{t.tableNumber}</TableCell>
                    <TableCell>{t.seatCount}</TableCell>
                    <TableCell className="text-neutral-30">
                      {t.locationLabel ?? "—"}
                    </TableCell>
                    <TableCell>
                      <StatusBadge isActive={t.isActive} />
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="mr-2"
                        onClick={() => {
                          setEditing(t);
                          setEditOpen(true);
                        }}
                      >
                        Edit
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        disabled={busyId === t.id}
                        onClick={() => void onDeleteTable(t)}
                      >
                        Delete
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </DataTable>
            )}
          </section>

          <section className="space-y-4">
            <h2 className="text-title font-ringside-compressed text-coal">Reservations</h2>
            <div className="flex flex-wrap items-end gap-4">
              <div className="space-y-1">
                <Label htmlFor="startsFrom">Starts from</Label>
                <Input
                  id="startsFrom"
                  type="datetime-local"
                  value={startsFrom}
                  onChange={(e) => setStartsFrom(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="startsTo">Starts to</Label>
                <Input
                  id="startsTo"
                  type="datetime-local"
                  value={startsTo}
                  onChange={(e) => setStartsTo(e.target.value)}
                />
              </div>
              <Button type="button" variant="secondary" onClick={() => void loadReservations()}>
                Apply filter
              </Button>
            </div>
            {resLoading ? (
              <p className="text-body text-neutral-30">Loading reservations…</p>
            ) : reservations.length === 0 ? (
              <p className="text-body text-neutral-30">No reservations match this filter.</p>
            ) : (
              <DataTable headers={["When", "Table", "Party", "Guest", "Status", "Actions"]}>
                {reservations.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="text-body text-coal">
                      {formatRange(r.startsAt, r.endsAt)}
                    </TableCell>
                    <TableCell>{r.table.tableNumber}</TableCell>
                    <TableCell>{r.partySize}</TableCell>
                    <TableCell className="text-neutral-30">
                      {r.user ? `${r.user.name} (${r.user.email})` : "—"}
                    </TableCell>
                    <TableCell>{r.status}</TableCell>
                    <TableCell className="text-right">
                      {r.status === "PENDING" ? (
                        <Button
                          type="button"
                          size="sm"
                          disabled={busyReservationId === r.id}
                          onClick={() => void onConfirmReservation(r)}
                        >
                          Confirm
                        </Button>
                      ) : null}
                      {r.status === "CONFIRMED" && new Date(r.startsAt) > new Date() ? (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="ml-2"
                          disabled={busyReservationId === r.id}
                          onClick={() => void onUnconfirmReservation(r)}
                        >
                          Unconfirm
                        </Button>
                      ) : null}
                    </TableCell>
                  </TableRow>
                ))}
              </DataTable>
            )}
          </section>
        </>
      )}
    </div>
  );
}
