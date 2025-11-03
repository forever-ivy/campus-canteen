import { create } from "zustand";

type PaginationState = {
  pageIndex: number;
  pageSize: number;
};

type Updater<T> = T | ((old: T) => T);

interface TableState extends PaginationState {
  setPagination: (updater: Updater<PaginationState>) => void;
}

export const useTableStore = create<TableState>((set) => ({
  pageIndex: 0,
  pageSize: 5,
  setPagination: (updater) =>
    set((state) => {
      const newPagination =
        typeof updater === "function"
          ? updater({ pageIndex: state.pageIndex, pageSize: state.pageSize })
          : updater;
      return { ...state, ...newPagination };
    }),
}));