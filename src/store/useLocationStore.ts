'use client';

import { create } from "zustand";

import type { MerchantLocation } from "@/types/database";

type LocationValue = MerchantLocation;

interface LocationState {
  currentLocation: LocationValue | null;
  locations: LocationValue[];
  isLoading: boolean;
  error: string | null;
  setCurrentLocation: (location: LocationValue | null) => void;
  setLocations: (locations: LocationValue[]) => void;
  resetLocation: () => void;
  fetchLocations: () => Promise<void>;
}

export const useLocationStore = create<LocationState>((set, get) => ({
  currentLocation: null,
  locations: [],
  isLoading: false,
  error: null,
  setCurrentLocation: (location) => set({ currentLocation: location }),
  setLocations: (locations) => set({ locations }),
  resetLocation: () => set({ currentLocation: null }),
  fetchLocations: async () => {
    if (get().locations.length > 0) {
      return;
    }
    if (get().isLoading) {
      return;
    }
    set({ isLoading: true, error: null });
    try {
      const response = await fetch("/api/locations");
      if (!response.ok) {
        throw new Error(`获取地点列表失败: ${response.status}`);
      }
      const payload = (await response.json()) as {
        locations?: LocationValue[];
      };
      const fetched =
        payload.locations?.filter(
          (location): location is LocationValue =>
            typeof location === "string" && location.trim().length > 0
        ) ?? [];

      set({
        locations: fetched,
        isLoading: false,
        error: null,
      });

      const current = get().currentLocation;
      if (current && !fetched.includes(current)) {
        set({ currentLocation: null });
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : `未知错误: ${String(err)}`;
      set({ error: message, isLoading: false });
    }
  },
}));
