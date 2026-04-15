"use client";

import { useMemo } from "react";

import { normaliseError } from "@/lib/services/normalise-error";
import type { Paginated, TableReservationProfile } from "@/lib/types/admin-api";
import type { CreateTableReservationInput } from "@/lib/validations/restaurant-tables";
import { useApiClient } from "@/lib/use-api-client";

export function useTableReservationsService() {
  const api = useApiClient();

  return useMemo(
    () => ({
      async listForRestaurant(
        restaurantId: string,
        query?: { startsFrom?: string; startsTo?: string },
      ): Promise<TableReservationProfile[]> {
        try {
          const q = new URLSearchParams();
          if (query?.startsFrom) q.set("startsFrom", query.startsFrom);
          if (query?.startsTo) q.set("startsTo", query.startsTo);
          const suffix = q.toString() ? `?${q.toString()}` : "";
          return await api.get<TableReservationProfile[]>(
            `/restaurants/${restaurantId}/reservations${suffix}`,
          );
        } catch (e) {
          throw normaliseError(e);
        }
      },

      async listMine(page = 1, limit = 20): Promise<Paginated<TableReservationProfile>> {
        try {
          const q = new URLSearchParams({
            page: String(page),
            limit: String(limit),
          });
          return await api.get<Paginated<TableReservationProfile>>(
            `/reservations/me?${q.toString()}`,
          );
        } catch (e) {
          throw normaliseError(e);
        }
      },

      async create(
        restaurantId: string,
        dto: CreateTableReservationInput,
      ): Promise<TableReservationProfile> {
        try {
          return await api.post<TableReservationProfile>(
            `/restaurants/${restaurantId}/reservations`,
            dto,
          );
        } catch (e) {
          throw normaliseError(e);
        }
      },

      async cancel(reservationId: string): Promise<TableReservationProfile> {
        try {
          return await api.patch<TableReservationProfile>(
            `/reservations/${reservationId}/cancel`,
            {},
          );
        } catch (e) {
          throw normaliseError(e);
        }
      },

      async confirmRestaurantReservation(
        restaurantId: string,
        reservationId: string,
      ): Promise<TableReservationProfile> {
        try {
          return await api.patch<TableReservationProfile>(
            `/restaurants/${restaurantId}/reservations/${reservationId}/confirm`,
            {},
          );
        } catch (e) {
          throw normaliseError(e);
        }
      },

      async unconfirmRestaurantReservation(
        restaurantId: string,
        reservationId: string,
      ): Promise<TableReservationProfile> {
        try {
          return await api.patch<TableReservationProfile>(
            `/restaurants/${restaurantId}/reservations/${reservationId}/unconfirm`,
            {},
          );
        } catch (e) {
          throw normaliseError(e);
        }
      },
    }),
    [api],
  );
}
