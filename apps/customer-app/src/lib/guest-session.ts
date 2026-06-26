import { randomId } from '@/lib/random-id';
import type { OrderContextDTO } from '@/types/order';

const GUEST_SESSION_KEY = 'customer:guest-session';

function storageKey(context: OrderContextDTO) {
  return `${GUEST_SESSION_KEY}:${context.restaurantId}:${context.tableId}`;
}

export function getOrCreateGuestSessionId(context: OrderContextDTO): string {
  if (typeof window === 'undefined') {
    return '';
  }

  const key = storageKey(context);
  const existing = window.localStorage.getItem(key);

  if (existing) {
    return existing;
  }

  const id = randomId();
  window.localStorage.setItem(key, id);
  return id;
}

export function getGuestSessionId(context: OrderContextDTO): string | null {
  if (typeof window === 'undefined') {
    return null;
  }

  return window.localStorage.getItem(storageKey(context));
}
