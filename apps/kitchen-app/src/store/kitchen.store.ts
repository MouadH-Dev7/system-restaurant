'use client';

import { create } from 'zustand';
import type { OrderResponse } from '@repo/shared-types';

type KitchenState = {
  orders: OrderResponse[];
  setOrders: (orders: OrderResponse[]) => void;
  upsertOrder: (order: OrderResponse) => void;
  removeOrder: (orderId: string) => void;
  reset: () => void;
};

const ACTIVE_STATUSES = new Set(['PENDING', 'PREPARING', 'READY']);

export const useKitchenStore = create<KitchenState>((set) => ({
  orders: [],
  setOrders: (orders) => set({ orders }),
  upsertOrder: (order) =>
    set((state) => {
      if (!order.id) {
        return {};
      }

      const without = state.orders.filter((entry) => entry.id !== order.id);
      if (!ACTIVE_STATUSES.has(order.status)) {
        return { orders: without };
      }

      const next = [...without, order].sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      );
      return { orders: next };
    }),
  removeOrder: (orderId) =>
    set((state) => ({
      orders: state.orders.filter((order) => order.id !== orderId),
    })),
  reset: () => set({ orders: [] }),
}));

export function ordersByStatus(orders: OrderResponse[], status: OrderResponse['status']) {
  return orders.filter((order) => order?.status === status);
}
