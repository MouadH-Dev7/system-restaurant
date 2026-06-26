'use client';

import { mapOrderToActivity, mapOrderToTicket } from '@/lib/mappers/order.mapper';
import { getOrdersForTable, mapTablesToFloorPlan } from '@/lib/mappers/table.mapper';
import { usePosDataStore } from '@/store/pos-data.store';
import { usePosUiStore } from '@/store/pos-ui.store';
import type { ActivityItem, DiningTable, OrderTicket } from '@/types/pos';

export function usePosOrdersView() {
  const orders = usePosDataStore((state) => state.orders);
  const language = usePosUiStore((state) => state.language);

  return orders
    .filter((order) => order.status !== 'PAID' && order.status !== 'CANCELLED')
    .map((order) => mapOrderToTicket(order, language));
}

export function usePosTablesView(): DiningTable[] {
  const orders = usePosDataStore((state) => state.orders);
  const tables = usePosDataStore((state) => state.tables);
  const language = usePosUiStore((state) => state.language);

  return mapTablesToFloorPlan(tables, orders, language);
}

export function usePosTableOrders(tableId: string | null) {
  const orders = usePosDataStore((state) => state.orders);
  const language = usePosUiStore((state) => state.language);

  if (!tableId) {
    return [];
  }

  return getOrdersForTable(orders, tableId, language);
}

export function usePosActivityFeed(): ActivityItem[] {
  const orders = usePosDataStore((state) => state.orders);
  const language = usePosUiStore((state) => state.language);

  return orders
    .slice()
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 6)
    .map((order) => mapOrderToActivity(order, language));
}

export function computeOrderTotal(subtotal: number) {
  return {
    subtotal,
    total: subtotal,
  };
}

export function findTicket(tickets: OrderTicket[], orderId: string) {
  if (!orderId) {
    return undefined;
  }

  return tickets.find((ticket) => ticket.id === orderId);
}

export function findTable(tables: DiningTable[], tableId: string) {
  if (!tableId) {
    return undefined;
  }

  return tables.find((table) => table.id === tableId);
}
