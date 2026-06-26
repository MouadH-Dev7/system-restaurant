import type { OrderContextDTO } from '@/types/order';

type SearchParams = Record<string, string | string[] | undefined>;

function firstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export function parseOrderContext(searchParams: SearchParams): OrderContextDTO | null {
  const restaurantId = firstValue(searchParams.restaurantId);
  const tableId = firstValue(searchParams.tableId);

  if (!restaurantId || !tableId) {
    return null;
  }

  return { restaurantId, tableId };
}
