'use client';

import { create } from 'zustand';
import type { MenuItemDTO, OrderResponse, SettingsDTO, TableBillingDTO, TableDTO } from '@repo/shared-types';

const POS_ACTIVE_STATUSES = new Set(['PENDING', 'PREPARING', 'READY', 'DELIVERED']);

type PosDataState = {
  orders: OrderResponse[];
  selectedOrderSnapshot: OrderResponse | null;
  tables: TableDTO[];
  menuItems: MenuItemDTO[];
  tableBillings: Record<string, TableBillingDTO>;
  settings: SettingsDTO | null;
  loading: boolean;
  error: string | null;
  lastSyncAt: Date | null;
  socketStatus: 'connected' | 'connecting' | 'disconnected';
  setOrders: (orders: OrderResponse[]) => void;
  setSelectedOrderSnapshot: (order: OrderResponse | null) => void;
  setTables: (tables: TableDTO[]) => void;
  setMenuItems: (menuItems: MenuItemDTO[]) => void;
  setTableBilling: (billing: TableBillingDTO) => void;
  setSettings: (settings: SettingsDTO | null) => void;
  upsertOrder: (order: OrderResponse) => void;
  removeOrder: (orderId: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setLastSyncAt: (date: Date | null) => void;
  setSocketStatus: (status: 'connected' | 'connecting' | 'disconnected') => void;
  reset: () => void;
};

export const usePosDataStore = create<PosDataState>((set) => ({
  orders: [],
  selectedOrderSnapshot: null,
  tables: [],
  menuItems: [],
  tableBillings: {},
  settings: null,
  loading: true,
  error: null,
  lastSyncAt: null,
  socketStatus: 'connecting',
  setOrders: (orders) => set({ orders }),
  setSelectedOrderSnapshot: (selectedOrderSnapshot) => set({ selectedOrderSnapshot }),
  setTables: (tables) => set({ tables }),
  setMenuItems: (menuItems) => set({ menuItems }),
  setTableBilling: (billing) =>
    set((state) => ({
      tableBillings: {
        ...state.tableBillings,
        [billing.summary.tableId]: billing,
      },
    })),
  setSettings: (settings) => set({ settings }),
  upsertOrder: (order) =>
    set((state) => {
      if (!order.id) {
        return {};
      }

      const without = state.orders.filter((entry) => entry.id !== order.id);

      if (!POS_ACTIVE_STATUSES.has(order.status)) {
        return {
          orders: without,
          selectedOrderSnapshot:
            state.selectedOrderSnapshot?.id === order.id ? null : state.selectedOrderSnapshot,
        };
      }

      const next = [...without, order].sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      );

      return { orders: next, selectedOrderSnapshot: order };
    }),
  removeOrder: (orderId) =>
    set((state) => ({
      orders: state.orders.filter((order) => order.id !== orderId),
      selectedOrderSnapshot:
        state.selectedOrderSnapshot?.id === orderId ? null : state.selectedOrderSnapshot,
    })),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  setLastSyncAt: (lastSyncAt) => set({ lastSyncAt }),
  setSocketStatus: (socketStatus) => set({ socketStatus }),
  reset: () =>
    set({
      orders: [],
      selectedOrderSnapshot: null,
      tables: [],
      menuItems: [],
      tableBillings: {},
      settings: null,
      loading: true,
      error: null,
      lastSyncAt: null,
      socketStatus: 'connecting',
    }),
}));

export function ordersByStatus(orders: OrderResponse[], status: OrderResponse['status']) {
  return orders.filter((order) => order?.status === status);
}

export function getOrderById(orders: OrderResponse[], orderId: string) {
  return orders.find((order) => order?.id === orderId);
}

export function getOrderForTable(orders: OrderResponse[], tableId: string) {
  return orders.find((order) => order?.tableId === tableId);
}
