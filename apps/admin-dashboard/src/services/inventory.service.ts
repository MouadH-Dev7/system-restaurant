import type {
  CreateInventoryItemInput,
  InventoryItemDTO,
  UpdateInventoryItemInput,
} from '@repo/shared-types';
import { http } from '@/lib/http';

export async function listInventory(restaurantId: string) {
  const { data } = await http.get<InventoryItemDTO[]>('/inventory');
  return data;
}

export async function createInventoryItem(input: CreateInventoryItemInput) {
  const { data } = await http.post<InventoryItemDTO>('/inventory', input);
  return data;
}

export async function updateInventoryItem(itemId: string, input: UpdateInventoryItemInput) {
  const { data } = await http.patch<InventoryItemDTO>(`/inventory/${itemId}`, input);
  return data;
}

export async function deleteInventoryItem(itemId: string) {
  await http.delete(`/inventory/${itemId}`);
}
