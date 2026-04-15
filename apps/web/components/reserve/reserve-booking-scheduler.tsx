"use client";

import {
  addMonths,
  endOfDay,
  endOfMonth,
  format,
  startOfDay,
  startOfMonth,
  subMonths,
} from "date-fns";
import { useTranslations } from "next-intl";
import * as React from "react";

import { Calendar } from "@/components/ui/calendar";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { fetchTableOccupiedSlotsPublic } from "@/lib/fetch-table-occupied-slots";
import type { OccupiedSlot } from "@/lib/fetch-table-occupied-slots";
import { cn } from "@/lib/utils";

const TIME_OPTIONS: string[] = (() => {
  const out: string[] = [];
  for (let h = 8; h <= 22; h++) {
    for (const m of [0, 30]) {
      if (h === 22 && m === 30) break;
      out.push(`${String(h).padStart(2, "0")}:${m === 0 ? "00" : "30"}`);
    }
  }
  out.push("23:00");
  return out;
})();

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

function toDatetimeLocalString(d: Date): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}T${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

function combineDateAndTime(date: Date, hhmm: string): Date {
  const parts = hhmm.split(":").map((x) => Number.parseInt(x, 10));
  const h = parts[0] ?? 0;
  const m = parts[1] ?? 0;
  const out = new Date(date);
  out.setHours(h, m, 0, 0);
  return out;
}

function dayTouchesSlot(day: Date, slots: OccupiedSlot[]): boolean {
  const dayStart = startOfDay(day);
  const dayEnd = endOfDay(day);
  return slots.some((s) => {
    const a = new Date(s.startsAt);
    const b = new Date(s.endsAt);
    return a < dayEnd && b > dayStart;
  });
}

function rangeOverlapsOccupied(start: Date, end: Date, slots: OccupiedSlot[]): boolean {
  return slots.some((s) => {
    const a = new Date(s.startsAt);
    const b = new Date(s.endsAt);
    return a < end && b > start;
  });
}

type Props = {
  restaurantId: string;
  tableId: string;
  onRangeChange: (startsAt: string, endsAt: string) => void;
  onAvailabilityChange?: (ok: boolean) => void;
  disabled?: boolean;
};

export function ReserveBookingScheduler({
  restaurantId,
  tableId,
  onRangeChange,
  onAvailabilityChange,
  disabled,
}: Props) {
  const t = useTranslations("reserve");
  const [date, setDate] = React.useState<Date>(() => startOfDay(new Date()));
  const [startTime, setStartTime] = React.useState("18:00");
  const [endTime, setEndTime] = React.useState("20:00");
  const [occupied, setOccupied] = React.useState<OccupiedSlot[]>([]);
  const [loadError, setLoadError] = React.useState<string | null>(null);
  const [calendarOpen, setCalendarOpen] = React.useState(false);

  React.useEffect(() => {
    setDate(startOfDay(new Date()));
    setStartTime("18:00");
    setEndTime("20:00");
  }, [restaurantId, tableId]);

  React.useEffect(() => {
    if (!tableId?.trim()) {
      setOccupied([]);
      return;
    }
    let cancelled = false;
    void (async () => {
      setLoadError(null);
      try {
        const from = startOfMonth(subMonths(new Date(), 1)).toISOString();
        const to = endOfMonth(addMonths(new Date(), 3)).toISOString();
        const slots = await fetchTableOccupiedSlotsPublic(restaurantId, tableId, from, to);
        if (!cancelled) setOccupied(slots);
      } catch {
        if (!cancelled) {
          setOccupied([]);
          setLoadError(t("occupied_load_failed"));
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [restaurantId, tableId, t]);

  const startDt = React.useMemo(
    () => combineDateAndTime(date, startTime),
    [date, startTime],
  );
  const endDt = React.useMemo(() => combineDateAndTime(date, endTime), [date, endTime]);

  const rangeValid = endDt > startDt;
  const overlaps = rangeValid && rangeOverlapsOccupied(startDt, endDt, occupied);
  const available = rangeValid && !overlaps;

  React.useEffect(() => {
    if (!tableId?.trim() || disabled) {
      onRangeChange("", "");
      onAvailabilityChange?.(false);
      return;
    }
    if (!rangeValid || overlaps) {
      onRangeChange("", "");
      onAvailabilityChange?.(false);
      return;
    }
    onRangeChange(toDatetimeLocalString(startDt), toDatetimeLocalString(endDt));
    onAvailabilityChange?.(true);
  }, [
    tableId,
    disabled,
    rangeValid,
    overlaps,
    startDt,
    endDt,
    onRangeChange,
    onAvailabilityChange,
  ]);

  const todayStart = startOfDay(new Date());

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>{t("booking_date")}</Label>
        <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="outline"
              disabled={disabled || !tableId}
              className={cn(
                "w-full justify-start text-left font-normal",
                !tableId && "text-muted-foreground",
              )}
            >
              {format(date, "PPP")}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={date}
              onSelect={(d) => {
                if (d) {
                  setDate(startOfDay(d));
                  setCalendarOpen(false);
                }
              }}
              disabled={{ before: todayStart }}
              modifiers={{
                hasBooking: (d) => dayTouchesSlot(d, occupied),
              }}
              modifiersClassNames={{
                hasBooking: "relative font-medium after:absolute after:bottom-0.5 after:left-1/2 after:h-1 after:w-1 after:-translate-x-1/2 after:rounded-full after:bg-amber-500",
              }}
            />
          </PopoverContent>
        </Popover>
        {!tableId ? (
          <p className="text-caption text-neutral-30">{t("pick_table_for_calendar")}</p>
        ) : null}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label>{t("start_time")}</Label>
          <Select value={startTime} onValueChange={setStartTime} disabled={disabled || !tableId}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TIME_OPTIONS.map((opt) => (
                <SelectItem key={opt} value={opt}>
                  {opt}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>{t("end_time")}</Label>
          <Select value={endTime} onValueChange={setEndTime} disabled={disabled || !tableId}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TIME_OPTIONS.map((opt) => (
                <SelectItem key={opt} value={opt}>
                  {opt}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {loadError ? <p className="text-caption text-peppes-red">{loadError}</p> : null}

      {!rangeValid ? (
        <p className="text-caption text-peppes-red">{t("end_after_start")}</p>
      ) : overlaps ? (
        <p className="text-body text-peppes-red">{t("slot_not_available")}</p>
      ) : available && tableId ? (
        <p className="text-body text-green-700 dark:text-green-400">{t("slot_available")}</p>
      ) : null}

      {occupied.length > 0 && tableId ? (
        <div className="rounded-md border border-coal-20 bg-muted/40 p-3 text-caption text-neutral-30">
          <p className="font-medium text-coal">{t("booked_windows_title")}</p>
          <ul className="mt-2 list-inside list-disc space-y-1">
            {occupied.slice(0, 8).map((s) => (
              <li key={`${s.startsAt}-${s.endsAt}`}>
                {new Date(s.startsAt).toLocaleString()} — {new Date(s.endsAt).toLocaleString()}
              </li>
            ))}
          </ul>
          {occupied.length > 8 ? <p className="mt-1">{t("booked_windows_truncated")}</p> : null}
        </div>
      ) : null}
    </div>
  );
}
