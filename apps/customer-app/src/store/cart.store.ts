'use client';

import { create } from 'zustand';
import type { ModifierOptionDTO } from '@repo/shared-types';
import { clearPersistedCart, persistCartDraft, persistEditingInfo } from '@/lib/persist-cart';
import { randomId } from '@/lib/random-id';
import type { MenuItem } from '@/types/menu';
import type { CartItemDTO, CartLine, CreateOrderInput, OrderContextDTO, OrderResponse } from '@/types/order';

type AddCartItemInput = {
  menuItem: MenuItem;
  context: OrderContextDTO;
  quantity?: number;
  notes?: string;
  modifierOptionIds?: string[];
  cartLineId?: string;
};

function syncCartPersistence(draft: CreateOrderInput | null) {
  if (!draft) {
    return;
  }

  persistCartDraft(draft, {
    restaurantId: draft.restaurantId,
    tableId: draft.tableId,
  });
}

function sameContext(
  draft: CreateOrderInput | null,
  context: OrderContextDTO,
): draft is CreateOrderInput {
  return draft?.restaurantId === context.restaurantId && draft.tableId === context.tableId;
}

function normalizeIds(ids?: string[]) {
  return [...new Set((ids ?? []).filter(Boolean))].sort();
}

function buildLineKey(item: Pick<CartItemDTO, 'menuItemId' | 'notes' | 'modifierOptionIds'>) {
  return JSON.stringify({
    menuItemId: item.menuItemId,
    notes: item.notes?.trim() ?? '',
    modifierOptionIds: normalizeIds(item.modifierOptionIds),
  });
}

function calculateLineModifiers(menuItem: MenuItem, modifierOptionIds?: string[]) {
  const selectedIds = new Set(modifierOptionIds ?? []);
  const selectedModifiers: ModifierOptionDTO[] = [];

  for (const group of menuItem.modifierGroups ?? []) {
    for (const option of group.options) {
      if (selectedIds.has(option.id)) {
        selectedModifiers.push(option);
      }
    }
  }

  return selectedModifiers;
}

type CartState = {
  draft: CreateOrderInput | null;
  editingOrderId: string | null;
  editingOrderNumber: number | null;
  editingOrderVersion: number | null;
  addItem: (item: MenuItem, context: OrderContextDTO) => void;
  addConfiguredItem: (input: AddCartItemInput) => void;
  incrementItem: (lineId: string) => void;
  decrementItem: (lineId: string) => void;
  removeItem: (lineId: string) => void;
  clear: () => void;
  hydrate: (
    draft: CreateOrderInput,
    editingInfo?: { id: string; number: number; version: number } | null,
  ) => void;
  startEditingOrder: (order: OrderResponse, context: OrderContextDTO) => void;
};

export const useCartStore = create<CartState>((set) => ({
  draft: null,
  editingOrderId: null,
  editingOrderNumber: null,
  editingOrderVersion: null,
  addItem: (item, context) =>
    set((state) => {
      const draft = state.draft;
      const currentItems = sameContext(draft, context) ? draft.items : [];
      const existing = currentItems.find(
        (line) =>
          line.menuItemId === item.id &&
          normalizeIds(line.modifierOptionIds).length === 0 &&
          !(line.notes?.trim() ?? ''),
      );

      const items = existing
        ? currentItems.map((line) =>
            line === existing ? { ...line, quantity: line.quantity + 1 } : line,
          )
        : [
            ...currentItems,
            {
              cartLineId: randomId(),
              menuItemId: item.id,
              quantity: 1,
              modifierOptionIds: [],
            },
          ];

      const nextDraft = {
        ...context,
        items,
      };
      syncCartPersistence(nextDraft);
      return { draft: nextDraft };
    }),
  addConfiguredItem: ({ menuItem, context, quantity = 1, notes, modifierOptionIds, cartLineId }) =>
    set((state) => {
      const draft = state.draft;
      const currentItems = sameContext(draft, context) ? draft.items : [];
      const normalized: CartItemDTO = {
        cartLineId: cartLineId ?? randomId(),
        menuItemId: menuItem.id,
        quantity,
        ...(notes?.trim() ? { notes: notes.trim() } : {}),
        ...(modifierOptionIds?.length ? { modifierOptionIds: normalizeIds(modifierOptionIds) } : {}),
      };
      const signature = buildLineKey(normalized);
      const existing = currentItems.find((line) => buildLineKey(line) === signature);

      const items = existing
        ? currentItems.map((line) =>
            line === existing ? { ...line, quantity: line.quantity + quantity } : line,
          )
        : [...currentItems, normalized];

      const nextDraft = {
        ...context,
        items,
      };
      syncCartPersistence(nextDraft);
      return { draft: nextDraft };
    }),
  incrementItem: (lineId) =>
    set((state) => {
      if (!state.draft) {
        return state;
      }

      const nextDraft = {
        ...state.draft,
        items: state.draft.items.map((line) =>
          (line.cartLineId ?? line.menuItemId) === lineId
            ? { ...line, quantity: line.quantity + 1 }
            : line,
        ),
      };
      syncCartPersistence(nextDraft);
      return { draft: nextDraft };
    }),
  decrementItem: (lineId) =>
    set((state) => {
      if (!state.draft) {
        return state;
      }

      const nextDraft = {
        ...state.draft,
        items: state.draft.items
          .map((line) =>
            (line.cartLineId ?? line.menuItemId) === lineId
              ? { ...line, quantity: line.quantity - 1 }
              : line,
          )
          .filter((line) => line.quantity > 0),
      };
      syncCartPersistence(nextDraft);
      return { draft: nextDraft };
    }),
  removeItem: (lineId) =>
    set((state) => {
      if (!state.draft) {
        return state;
      }

      const nextDraft = {
        ...state.draft,
        items: state.draft.items.filter(
          (line) => (line.cartLineId ?? line.menuItemId) !== lineId,
        ),
      };
      syncCartPersistence(nextDraft);
      return { draft: nextDraft };
    }),
  clear: () =>
    set((state) => {
      if (state.draft) {
        clearPersistedCart({
          restaurantId: state.draft.restaurantId,
          tableId: state.draft.tableId,
        });
        persistEditingInfo(null, {
          restaurantId: state.draft.restaurantId,
          tableId: state.draft.tableId,
        });
      }
      return {
        draft: null,
        editingOrderId: null,
        editingOrderNumber: null,
        editingOrderVersion: null,
      };
    }),
  hydrate: (draft, editingInfo = null) => {
    const normalizedDraft = {
      ...draft,
      items: draft.items.map((item) => ({
        ...item,
        cartLineId: item.cartLineId ?? randomId(),
        modifierOptionIds: normalizeIds(item.modifierOptionIds),
      })),
    };
    syncCartPersistence(normalizedDraft);
    if (editingInfo) {
      persistEditingInfo(editingInfo, {
        restaurantId: draft.restaurantId,
        tableId: draft.tableId,
      });
    }
    set({
      draft: normalizedDraft,
      editingOrderId: editingInfo?.id ?? null,
      editingOrderNumber: editingInfo?.number ?? null,
      editingOrderVersion: editingInfo?.version ?? null,
    });
  },
  startEditingOrder: (order, context) =>
    set(() => {
      const draftItems: CartItemDTO[] = order.items.map((item) => ({
        cartLineId: item.id ?? randomId(),
        menuItemId: item.menuItemId,
        quantity: item.quantity,
        notes: item.notes ?? undefined,
        modifierOptionIds: item.modifiers?.map((mod) => mod.modifierOptionId).filter(Boolean) as string[] ?? [],
      }));

      const nextDraft = {
        restaurantId: context.restaurantId,
        tableId: context.tableId,
        guestSessionId: order.guestSessionId ?? undefined,
        items: draftItems,
      };

      syncCartPersistence(nextDraft);
      const editingInfo = {
        id: order.id,
        number: order.dailyOrderNumber,
        version: order.version,
      };
      persistEditingInfo(editingInfo, context);

      return {
        draft: nextDraft,
        editingOrderId: order.id,
        editingOrderNumber: order.dailyOrderNumber,
        editingOrderVersion: order.version,
      };
    }),
}));

export function getDraftItems(draft: CreateOrderInput | null, context: OrderContextDTO | null) {
  if (!draft || !context || !sameContext(draft, context)) {
    return [];
  }

  return draft.items;
}

export function getCartTotal(lines: CartLine[]) {
  return lines.reduce((sum, line) => sum + line.lineTotal, 0);
}

export function getCartLines(items: CartItemDTO[], menuItems: MenuItem[]) {
  const menuItemsById = Object.fromEntries(menuItems.map((item) => [item.id, item]));

  return items.flatMap((item) => {
    const menuItem = menuItemsById[item.menuItemId];
    if (!menuItem) {
      return [];
    }

    const selectedModifiers = calculateLineModifiers(menuItem, item.modifierOptionIds);
    const unitPrice =
      menuItem.price + selectedModifiers.reduce((sum, option) => sum + option.priceDelta, 0);

    return [
      {
        ...item,
        cartLineId: item.cartLineId ?? item.menuItemId,
        modifierOptionIds: normalizeIds(item.modifierOptionIds),
        menuItem,
        selectedModifiers,
        lineTotal: unitPrice * item.quantity,
      } satisfies CartLine,
    ];
  });
}
