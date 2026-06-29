import type { OrderResponse } from '@repo/shared-types';
import { getOrderTypeLabel, isWalkInOrder } from '@repo/shared-types';

const EXTERNAL_ORDER_GROUP_ID = 'external-orders';

export type TableOrderGroup = {
  tableId: string;
  tableNumber: number;
  label: string;
  isExternal: boolean;
  orders: OrderResponse[];
};

export function groupOrdersByTable(orders: OrderResponse[]): TableOrderGroup[] {
  const groups = new Map<string, TableOrderGroup>();

  for (const order of orders) {
    const external = isWalkInOrder(order);
    const type = getOrderTypeLabel(order);
    const groupId = external ? EXTERNAL_ORDER_GROUP_ID : (order.tableId ?? 'unknown');
    const existing = groups.get(groupId);

    if (existing) {
      existing.orders.push(order);
      continue;
    }

    groups.set(groupId, {
      tableId: groupId,
      tableNumber: external ? 0 : (order.table?.number ?? 0),
      label: type.label,
      isExternal: external,
      orders: [order],
    });
  }

  return Array.from(groups.values())
    .map((group) => ({
      ...group,
      orders: group.orders.sort(
        (a, b) => new Date(a.createdAt ?? 0).getTime() - new Date(b.createdAt ?? 0).getTime(),
      ),
    }))
    .sort((a, b) => {
      const firstOrderA = a.orders[0];
      const firstOrderB = b.orders[0];
      const firstTimeA = firstOrderA ? new Date(firstOrderA.createdAt ?? 0).getTime() : 0;
      const firstTimeB = firstOrderB ? new Date(firstOrderB.createdAt ?? 0).getTime() : 0;

      if (firstTimeA !== firstTimeB) {
        return firstTimeA - firstTimeB;
      }

      if (a.isExternal !== b.isExternal) {
        return a.isExternal ? -1 : 1;
      }

      return a.tableNumber - b.tableNumber;
    });
}
