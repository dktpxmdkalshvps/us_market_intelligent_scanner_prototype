import { create } from "zustand";
import type { ThemeKey, SortField, SortDirection } from "./types";

interface ThemeStore {
  activeTheme: ThemeKey;
  setActiveTheme: (theme: ThemeKey) => void;
}

export const useThemeStore = create<ThemeStore>((set) => ({
  activeTheme: "undervalued_growth",
  setActiveTheme: (theme) => set({ activeTheme: theme }),
}));

interface TableStore {
  sortField: SortField;
  sortDirection: SortDirection;
  searchQuery: string;
  sectorFilter: string;
  page: number;
  pageSize: number;
  setSortField: (field: SortField) => void;
  setSortDirection: (dir: SortDirection) => void;
  toggleSort: (field: SortField) => void;
  setSearchQuery: (q: string) => void;
  setSectorFilter: (s: string) => void;
  setPage: (p: number) => void;
}

export const useTableStore = create<TableStore>((set, get) => ({
  sortField: "themeScore",
  sortDirection: "desc",
  searchQuery: "",
  sectorFilter: "all",
  page: 1,
  pageSize: 20,
  setSortField: (field) => set({ sortField: field }),
  setSortDirection: (dir) => set({ sortDirection: dir }),
  toggleSort: (field) => {
    const { sortField, sortDirection } = get();
    if (sortField === field) {
      set({ sortDirection: sortDirection === "asc" ? "desc" : "asc" });
    } else {
      set({ sortField: field, sortDirection: "desc" });
    }
  },
  setSearchQuery: (q) => set({ searchQuery: q, page: 1 }),
  setSectorFilter: (s) => set({ sectorFilter: s, page: 1 }),
  setPage: (p) => set({ page: p }),
}));
