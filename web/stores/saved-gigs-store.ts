"use client";

import { create } from "zustand";
import type { SavedList } from "shared";

interface SavedGigsState {
  activeListFilter: SavedList | null;
  savedGigIds: number[];
  setActiveListFilter: (list: SavedList | null) => void;
  setSavedGigIds: (ids: number[]) => void;
}

export const useSavedGigsStore = create<SavedGigsState>((set) => ({
  activeListFilter: null,
  savedGigIds: [],
  setActiveListFilter: (list) => set({ activeListFilter: list }),
  setSavedGigIds: (ids) => set({ savedGigIds: ids }),
}));
