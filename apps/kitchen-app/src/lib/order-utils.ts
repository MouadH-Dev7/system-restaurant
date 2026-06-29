import type { OrderResponse } from '@repo/shared-types';

export function formatOrderClock(createdAt: string) {
  return new Intl.DateTimeFormat('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(createdAt));
}

export function formatOrderNumber(order: Pick<OrderResponse, 'dailyOrderNumber'>) {
  return `#${order.dailyOrderNumber}`;
}

export function getElapsedMinutes(createdAt: string) {
  const created = new Date(createdAt).getTime();
  const diffMs = Date.now() - created;
  return Math.max(1, Math.floor(diffMs / 60000));
}

export function isLateOrder(createdAt: string, status: OrderResponse['status']) {
  if (status !== 'PREPARING') {
    return false;
  }

  return getElapsedMinutes(createdAt) >= 10;
}

export function groupItemsByMenu(order: OrderResponse) {
  const groups = new Map<string, OrderResponse['items']>();

  for (const item of (order.items ?? [])) {
    const key = item.menuItem?.name ?? 'Items';
    const bucket = groups.get(key) ?? [];
    bucket.push(item);
    groups.set(key, bucket);
  }

  return Array.from(groups.entries()).map(([label, items]) => ({ label, items }));
}
