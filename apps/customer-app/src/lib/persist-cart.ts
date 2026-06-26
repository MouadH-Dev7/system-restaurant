import type { CreateOrderInput, OrderContextDTO } from '@/types/order';

const CART_KEY = 'customer:cart-draft';

function cartStorageKey(context: OrderContextDTO) {
  return `${CART_KEY}:${context.restaurantId}:${context.tableId}`;
}

export function loadPersistedCart(context: OrderContextDTO): CreateOrderInput | null {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(cartStorageKey(context));
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as CreateOrderInput;
    if (parsed.restaurantId !== context.restaurantId || parsed.tableId !== context.tableId) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

export function persistCartDraft(draft: CreateOrderInput | null, context: OrderContextDTO | null) {
  if (typeof window === 'undefined' || !context) {
    return;
  }

  const key = cartStorageKey(context);

  if (!draft || draft.items.length === 0) {
    window.localStorage.removeItem(key);
    return;
  }

  window.localStorage.setItem(key, JSON.stringify(draft));
}

export function clearPersistedCart(context: OrderContextDTO) {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.removeItem(cartStorageKey(context));
}

const EDITING_KEY = 'customer:cart-editing';

export type EditingOrderInfo = {
  id: string;
  number: number;
  version: number;
};

function editingStorageKey(context: OrderContextDTO) {
  return `${EDITING_KEY}:${context.restaurantId}:${context.tableId}`;
}

export function loadPersistedEditingInfo(context: OrderContextDTO): EditingOrderInfo | null {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(editingStorageKey(context));
    if (!raw) {
      return null;
    }
    return JSON.parse(raw) as EditingOrderInfo;
  } catch {
    return null;
  }
}

export function persistEditingInfo(info: EditingOrderInfo | null, context: OrderContextDTO | null) {
  if (typeof window === 'undefined' || !context) {
    return;
  }

  const key = editingStorageKey(context);

  if (!info) {
    window.localStorage.removeItem(key);
  } else {
    window.localStorage.setItem(key, JSON.stringify(info));
  }
}
