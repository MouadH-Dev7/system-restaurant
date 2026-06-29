'use client';

import { create } from 'zustand';
import { clearPersistedCart, persistCartDraft, persistEditingInfo } from '@/lib/persist-cart';
import { randomId } from '@/lib/random-id';
import { sameContext, normalizeIds, buildLineKey } from './lib/cart-utils';
export { getDraftItems, getCartTotal, getCartLines } from './lib/cart-utils';
import type { MenuItem } from '@/types/menu';
import type { CartItemDTO, CreateOrderInput, OrderContextDTO, OrderResponse } from '@/types/order';

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

