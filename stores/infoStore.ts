import { create } from "zustand";

interface infoStoreProps {
  bellState: boolean;
  toggleState: () => void;
  setBellState: (open: boolean) => void;
}

const useInfoStore = create<infoStoreProps>((set) => ({
  bellState: false,
  toggleState: () => set((state) => ({ bellState: !state.bellState })),
  setBellState: (open) => set({ bellState: open }),
}));

export default useInfoStore;
