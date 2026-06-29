import type { TableDTO, UpdateTableInput } from '@repo/shared-types';
import { http } from '@/lib/http';

export async function listRestaurantTables(restaurantId: string, signal?: AbortSignal) {
  const { data } = await http.get<TableDTO[]>('/tables', { signal });

  return data;
}

export async function updateTable(tableId: string, input: UpdateTableInput) {
  const { data } = await http.patch<TableDTO>(`/tables/${tableId}`, input);
  return data;
}
