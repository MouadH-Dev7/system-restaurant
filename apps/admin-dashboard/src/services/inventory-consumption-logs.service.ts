import type { InventoryConsumptionLogDTO } from '@repo/shared-types';
import { http } from '@/lib/http';

export type ConsumptionLogFilters = {
  inventoryItemId?: string;
  startDate?: string;
  endDate?: string;
  type?: string;
  orderType?: string;
  dailyOrderNumber?: number;
};

export async function listConsumptionLogs(params: ConsumptionLogFilters) {
  const { data } = await http.get<InventoryConsumptionLogDTO[]>('/inventory-consumption-logs', {
    params,
  });
  return data;
}

export async function listAllInventoryForLogs(restaurantId: string) {
  const { data } = await http.get<Array<{ id: string; name: string }>>('/inventory', {
    params: { restaurantId, status: 'ALL' },
  });
  return data;
}
