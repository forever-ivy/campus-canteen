import { create } from 'zustand';
import axios from 'axios';

type Order = {
  id: string;
  student: string;
  store: string;
  amount: number;
  orderedAt: string | null;
};

interface OrderStore {
  orders: Order[];
  loading: boolean;
  error: string | null;
  lastFetched: number | null;
  newOrdersCount: number;
  setSocketConnected: (connected: boolean) => void;
  addNewOrder: (order: Order) => void;
  incrementNewOrderCount: () => void;
  resetNewOrderCount: () => void;
  fetchOrders: () => Promise<void>;
  refetchOrders: () => Promise<void>;
}

export const useOrderStore = create<OrderStore>((set, get) => ({
  orders: [],
  loading: true,
  error: null,
  lastFetched: null,
  newOrdersCount: 0,

  // Socket 相关方法
  setSocketConnected: (connected: boolean) => {
    console.log("Socket 连接状态:", connected);
  },

  addNewOrder: (order: Order) => {
    set((state) => ({
      orders: [order, ...state.orders],
      newOrdersCount: state.newOrdersCount + 1,
    }));
  },

  incrementNewOrderCount: () => {
    set((state) => ({
      newOrdersCount: state.newOrdersCount + 1,
    }));
  },

  resetNewOrderCount: () => {
    set({ newOrdersCount: 0 });
  },

  fetchOrders: async () => {
    const state = get();

    // 如果数据是最近5分钟内获取的，直接返回，不重新请求
    if (state.lastFetched && Date.now() - state.lastFetched < 5 * 60 * 1000) {
      set({ loading: false });
      return;
    }

    try {
      set({ loading: true, error: null });
      const response = await axios.get("/api/orders");
      const normalized: Order[] = (response.data?.items ?? []).map(
        (item: Record<string, unknown>) => {
          const orderId =
            typeof item.orderId === "string" ? item.orderId : "";
          const studentName =
            typeof item.studentName === "string" ? item.studentName : null;
          const merchantName =
            typeof item.merchantName === "string" ? item.merchantName : null;
          const amountSource = item.totalAmount;
          const parsedAmount =
            typeof amountSource === "string"
              ? Number(amountSource.replace(/[^\d.-]/g, ""))
              : Number(amountSource ?? 0);
          const totalAmount = Number.isFinite(parsedAmount)
            ? parsedAmount
            : 0;

          const studentId =
            typeof item.studentId === "number" ||
            typeof item.studentId === "string"
              ? item.studentId
              : "--";
          const merchantId =
            typeof item.merchantId === "number" ||
            typeof item.merchantId === "string"
              ? item.merchantId
              : "--";

          return {
            id: orderId || String(studentId) || "",
            student: studentName ?? `学号 ${studentId}`,
            store: merchantName ?? `商户 ${merchantId}`,
            amount: Number.isFinite(totalAmount) ? totalAmount : 0,
            orderedAt:
              typeof item.orderTime === "string" ? item.orderTime : null,
          };
        }
      );

      set({
        orders: normalized,
        loading: false,
        lastFetched: Date.now(),
      });
    } catch (err) {
      console.error("Error fetching orders:", err);
      set({
        error: "Failed to fetch orders",
        loading: false,
      });
    }
  },

  refetchOrders: async () => {
    // 强制重新获取数据，忽略缓存
    set({ lastFetched: null });
    await get().fetchOrders();
  },
}));