'use client';

import type {
  CartItemDTO,
  MenuDTO,
  MenuItemDTO,
  OrderItemModifierDTO,
  OrderResponse,
  TableOrdersGroupDTO,
  TableDTO,
  WaiterNotificationDTO,
} from '@repo/shared-types';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

const ACTIVE_ORDER_STATUSES = new Set(['PENDING', 'PREPARING', 'READY', 'DELIVERED']);

export type WaiterLanguage = 'en' | 'fr' | 'ar';

export type DraftModifierDetail = {
  id: string;
  modifierOptionId?: string | null;
  groupName: string;
  groupNameEn?: string | null;
  groupNameFr?: string | null;
  groupNameAr?: string | null;
  optionName: string;
  optionNameEn?: string | null;
  optionNameFr?: string | null;
  optionNameAr?: string | null;
  priceDelta: number;
};

export type DraftLine = CartItemDTO & {
  cartLineId: string;
  name: string;
  nameEn?: string | null;
  nameFr?: string | null;
  nameAr?: string | null;
  image: string | null;
  unitPrice: number;
  modifierDetails: DraftModifierDetail[];
};

type WaiterStore = {
  tables: TableDTO[];
  menus: MenuDTO[];
  menuItems: MenuItemDTO[];
  orders: OrderResponse[];
  tableOrderGroups: TableOrdersGroupDTO[];
  loading: boolean;
  error: string | null;
  lastSyncAt: Date | null;
  socketStatus: 'connected' | 'connecting' | 'disconnected';
  language: WaiterLanguage;
  selectedTableId: string | null;
  selectedEditableOrderId: string | null;
  activeMenuId: string | null;
  tableSearch: string;
  draftByTable: Record<string, DraftLine[]>;
  waiterNotifications: WaiterNotificationDTO[];
  readNotificationIds: string[];
  activeView: 'service' | 'notifications' | 'tracking';
  setInitialData: (payload: {
    tables: TableDTO[];
    menus: MenuDTO[];
    menuItems: MenuItemDTO[];
    orders: OrderResponse[];
    tableOrderGroups?: TableOrdersGroupDTO[];
    waiterNotifications?: WaiterNotificationDTO[];
  }) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setLastSyncAt: (date: Date | null) => void;
  setSocketStatus: (status: WaiterStore['socketStatus']) => void;
  setLanguage: (language: WaiterLanguage) => void;
  selectTable: (tableId: string) => void;
  selectEditableOrder: (orderId: string | null) => void;
  setActiveMenuId: (menuId: string | null) => void;
  setTableSearch: (value: string) => void;
  setTable: (table: TableDTO) => void;
  setMenuItems: (menuItems: MenuItemDTO[]) => void;
  upsertOrder: (order: OrderResponse) => void;
  removeOrder: (orderId: string) => void;
  addDraftLine: (tableId: string, line: DraftLine) => void;
  incrementDraftLine: (tableId: string, cartLineId: string) => void;
  decrementDraftLine: (tableId: string, cartLineId: string) => void;
  updateDraftLineNotes: (tableId: string, cartLineId: string, notes: string) => void;
  removeDraftLine: (tableId: string, cartLineId: string) => void;
  clearDraft: (tableId: string) => void;
  loadDraftFromOrder: (tableId: string, order: OrderResponse) => void;
  setActiveView: (view: WaiterStore['activeView']) => void;
  setWaiterNotifications: (notifications: WaiterNotificationDTO[]) => void;
  upsertWaiterNotification: (notification: WaiterNotificationDTO) => void;
  markNotificationRead: (notificationId: string) => void;
  markAllNotificationsRead: () => void;
  reset: () => void;
};

function normalizeOrders(orders: OrderResponse[]) {
  return orders
    .filter((order) => order?.id && ACTIVE_ORDER_STATUSES.has(order.status))
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
}

function buildTableOrderGroups(orders: OrderResponse[]): TableOrdersGroupDTO[] {
  const groups = new Map<string, TableOrdersGroupDTO>();

  for (const order of normalizeOrders(orders)) {
    const key = order.tableId || `walk-in:${order.id ?? ''}`;
    const current = groups.get(key);

    if (!current) {
      groups.set(key, {
        summary: {
          tableId: order.tableId,
          tableNumber: order.table?.number ?? null,
          totalOrders: 1,
          totalAmount: order.grandTotal ?? 0,
          preparingOrders: order.status === 'PREPARING' ? 1 : 0,
          readyOrders: order.status === 'READY' ? 1 : 0,
          deliveredOrders: order.status === 'DELIVERED' ? 1 : 0,
        },
        orders: [order],
      });
      continue;
    }

    current.orders.push(order);
    current.summary.totalOrders += 1;
    current.summary.totalAmount += order.grandTotal ?? 0;
    current.summary.preparingOrders += order.status === 'PREPARING' ? 1 : 0;
    current.summary.readyOrders += order.status === 'READY' ? 1 : 0;
    current.summary.deliveredOrders += order.status === 'DELIVERED' ? 1 : 0;
  }

  return Array.from(groups.values());
}

function normalizeModifierDetails(modifiers?: OrderItemModifierDTO[] | DraftModifierDetail[]) {
  return (modifiers ?? []).map((modifier, index) => ({
    id: 'id' in modifier ? (modifier.id ?? `modifier-${index}`) : `modifier-${index}`,
    modifierOptionId: modifier.modifierOptionId,
    groupName: modifier.groupName,
    groupNameEn: modifier.groupNameEn,
    groupNameFr: modifier.groupNameFr,
    groupNameAr: modifier.groupNameAr,
    optionName: modifier.optionName,
    optionNameEn: modifier.optionNameEn,
    optionNameFr: modifier.optionNameFr,
    optionNameAr: modifier.optionNameAr,
    priceDelta: modifier.priceDelta,
  }));
}

function normalizeDraftLine(line: DraftLine): DraftLine {
  return {
    ...line,
    modifierDetails: normalizeModifierDetails(line.modifierDetails),
  };
}

function mapOrderToDraftLines(order: OrderResponse): DraftLine[] {
  return (order.items ?? []).map((item) => ({
    cartLineId: item.id,
    menuItemId: item.menuItemId,
    quantity: item.quantity,
    notes: item.notes ?? undefined,
    modifierOptionIds: item.modifiers?.flatMap((modifier) =>
      modifier.modifierOptionId ? [modifier.modifierOptionId] : [],
    ),
    name: item.menuItem?.name ?? `Item ${item.menuItemId.slice(0, 6)}`,
    nameEn: item.menuItem?.nameEn,
    nameFr: item.menuItem?.nameFr,
    nameAr: item.menuItem?.nameAr,
    image: item.menuItem?.image ?? null,
    unitPrice: item.price,
    modifierDetails: normalizeModifierDetails(item.modifiers),
  }));
}

function sameSelection(left: DraftLine, right: DraftLine) {
  const leftModifiers = [...(left.modifierOptionIds ?? [])].sort().join('|');
  const rightModifiers = [...(right.modifierOptionIds ?? [])].sort().join('|');

  return (
    left.menuItemId === right.menuItemId &&
    leftModifiers === rightModifiers &&
    (left.notes ?? '').trim() === (right.notes ?? '').trim()
  );
}

export const useWaiterStore = create<WaiterStore>()(
  persist(
    (set, get) => ({
      tables: [],
      menus: [],
      menuItems: [],
      orders: [],
      tableOrderGroups: [],
      loading: true,
      error: null,
      lastSyncAt: null,
      socketStatus: 'connecting',
      language: 'en',
      selectedTableId: null,
      selectedEditableOrderId: null,
      activeMenuId: null,
      tableSearch: '',
      draftByTable: {},
      waiterNotifications: [],
      readNotificationIds: [],
      activeView: 'service',
      setInitialData: ({ tables, menus, menuItems, orders, tableOrderGroups, waiterNotifications }) =>
        set((state) => {
          const selectedTableStillExists = tables.some((table) => table.id === state.selectedTableId);
          const normalizedOrders = normalizeOrders(orders);

          return {
            tables,
            menus,
            menuItems,
            orders: normalizedOrders,
            tableOrderGroups: tableOrderGroups ?? buildTableOrderGroups(normalizedOrders),
            waiterNotifications: waiterNotifications ?? state.waiterNotifications,
            selectedTableId: selectedTableStillExists ? state.selectedTableId : (tables[0]?.id ?? null),
            selectedEditableOrderId:
              state.selectedEditableOrderId &&
              normalizedOrders.some((order) => order.id === state.selectedEditableOrderId)
                ? state.selectedEditableOrderId
                : null,
            activeMenuId: state.activeMenuId ?? menus[0]?.id ?? null,
          };
        }),
      setLoading: (loading) => set({ loading }),
      setError: (error) => set({ error }),
      setLastSyncAt: (lastSyncAt) => set({ lastSyncAt }),
      setSocketStatus: (socketStatus) => set({ socketStatus }),
      setLanguage: (language) => set({ language }),
      selectTable: (selectedTableId) => set({ selectedTableId, selectedEditableOrderId: null }),
      selectEditableOrder: (selectedEditableOrderId) => set({ selectedEditableOrderId }),
      setActiveMenuId: (activeMenuId) => set({ activeMenuId }),
      setTableSearch: (tableSearch) => set({ tableSearch }),
      setTable: (table) =>
        set((state) => ({
          tables: state.tables.map((entry) => (entry.id === table.id ? table : entry)),
        })),
      setMenuItems: (menuItems) => set({ menuItems }),
      upsertOrder: (order) =>
        set((state) => {
          const nextOrders = normalizeOrders([
            ...state.orders.filter((entry) => entry.id !== order.id),
            order,
          ]);

          return {
            orders: nextOrders,
            tableOrderGroups: buildTableOrderGroups(nextOrders),
            selectedEditableOrderId:
              state.selectedEditableOrderId === order.id && !ACTIVE_ORDER_STATUSES.has(order.status)
                ? null
                : state.selectedEditableOrderId,
          };
        }),
      removeOrder: (orderId) =>
        set((state) => ({
          orders: state.orders.filter((order) => order.id !== orderId),
          tableOrderGroups: buildTableOrderGroups(state.orders.filter((order) => order.id !== orderId)),
          selectedEditableOrderId:
            state.selectedEditableOrderId === orderId ? null : state.selectedEditableOrderId,
        })),
      addDraftLine: (tableId, line) =>
        set((state) => {
          const normalizedLine = normalizeDraftLine(line);
          const current = state.draftByTable[tableId] ?? [];
          const index = current.findIndex((entry) => sameSelection(entry, normalizedLine));

          if (index === -1) {
            return {
              draftByTable: {
                ...state.draftByTable,
                [tableId]: [...current, normalizedLine],
              },
            };
          }

          const next = [...current];
          next[index] = {
            ...next[index]!,
            quantity: next[index]!.quantity + normalizedLine.quantity,
          };

          return {
            draftByTable: {
              ...state.draftByTable,
              [tableId]: next,
            },
          };
        }),
      incrementDraftLine: (tableId, cartLineId) =>
        set((state) => ({
          draftByTable: {
            ...state.draftByTable,
            [tableId]: (state.draftByTable[tableId] ?? []).map((line) =>
              line.cartLineId === cartLineId ? { ...line, quantity: line.quantity + 1 } : line,
            ),
          },
        })),
      decrementDraftLine: (tableId, cartLineId) =>
        set((state) => ({
          draftByTable: {
            ...state.draftByTable,
            [tableId]: (state.draftByTable[tableId] ?? []).flatMap((line) => {
              if (line.cartLineId !== cartLineId) {
                return [line];
              }

              if (line.quantity <= 1) {
                return [];
              }

              return [{ ...line, quantity: line.quantity - 1 }];
            }),
          },
        })),
      updateDraftLineNotes: (tableId, cartLineId, notes) =>
        set((state) => ({
          draftByTable: {
            ...state.draftByTable,
            [tableId]: (state.draftByTable[tableId] ?? []).map((line) =>
              line.cartLineId === cartLineId ? { ...line, notes: notes.trim() || undefined } : line,
            ),
          },
        })),
      removeDraftLine: (tableId, cartLineId) =>
        set((state) => ({
          draftByTable: {
            ...state.draftByTable,
            [tableId]: (state.draftByTable[tableId] ?? []).filter(
              (line) => line.cartLineId !== cartLineId,
            ),
          },
        })),
      clearDraft: (tableId) =>
        set((state) => ({
          draftByTable: {
            ...state.draftByTable,
            [tableId]: [],
          },
        })),
      loadDraftFromOrder: (tableId, order) =>
        set((state) => ({
          draftByTable: {
            ...state.draftByTable,
            [tableId]: mapOrderToDraftLines(order),
          },
        })),
      setActiveView: (activeView) => set({ activeView }),
      setWaiterNotifications: (waiterNotifications) => set({ waiterNotifications }),
      upsertWaiterNotification: (notification) =>
        set((state) => ({
          waiterNotifications: [
            notification,
            ...state.waiterNotifications.filter((entry) => entry.id !== notification.id),
          ],
        })),
      markNotificationRead: (notificationId) =>
        set((state) => ({
          readNotificationIds: state.readNotificationIds.includes(notificationId)
            ? state.readNotificationIds
            : [...state.readNotificationIds, notificationId],
        })),
      markAllNotificationsRead: () =>
        set((state) => ({
          readNotificationIds: state.waiterNotifications.map((notification) => notification.id),
        })),
      reset: () =>
        set({
          tables: [],
          menus: [],
          menuItems: [],
          orders: [],
          tableOrderGroups: [],
          loading: true,
          error: null,
          lastSyncAt: null,
          socketStatus: 'connecting',
          selectedTableId: null,
          selectedEditableOrderId: null,
          activeMenuId: null,
          tableSearch: '',
          draftByTable: {},
          waiterNotifications: [],
          readNotificationIds: [],
          activeView: 'service',
        }),
    }),
    {
      name: 'waiter-app-store',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        selectedTableId: state.selectedTableId,
        selectedEditableOrderId: state.selectedEditableOrderId,
        activeMenuId: state.activeMenuId,
        tableSearch: state.tableSearch,
        language: state.language,
        draftByTable: state.draftByTable,
        readNotificationIds: state.readNotificationIds,
        activeView: state.activeView,
      }),
    },
  ),
);

export function getOrderForTable(orders: OrderResponse[], tableId: string | null) {
  if (!tableId) {
    return null;
  }

  return (
    [...orders]
      .reverse()
      .find((order) => order.tableId === tableId) ?? null
  );
}
