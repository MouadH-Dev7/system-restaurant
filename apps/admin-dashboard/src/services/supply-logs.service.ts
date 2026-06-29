import type { SupplyLogDTO } from '@repo/shared-types';
import { http } from '@/lib/http';

export async function listSupplyLogs(restaurantId: string) {
  const { data } = await http.get<SupplyLogDTO[]>('/inventory/supply-logs');
  return data;
}
