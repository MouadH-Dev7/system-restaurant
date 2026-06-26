'use client';

import { create } from 'zustand';
import type { OrderResponse } from '@/types/order';

type GuestOrdersState = {
  orders: OrderResponse[];
  loading: boolean;
  setOrders: (orders: OrderResponse[]) => void;
  upsertOrder: (order: OrderResponse) => void;
  setLoading: (loading: boolean) => void;
};

export const useGuestOrdersStore = create<GuestOrdersState>((set) => ({
  orders: [],
  loading: false,
  setOrders: (orders) => set({ orders }),
  upsertOrder: (order) =>
    set((state) => {
      const index = state.orders.findIndex((item) => item.id === order.id);
      const next = [...state.orders];

      if (order.status === 'PAID' || order.status === 'CANCELLED') {
        if (index === -1) {
          return state;
        }
        next.splice(index, 1);
        return { orders: next };
      }

      if (index === -1) {
        next.push(order);
      } else {
        next[index] = order;
      }

      return {
        orders: next.sort(
          (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
        ),
      };
    }),
  setLoading: (loading) => set({ loading }),
}));
