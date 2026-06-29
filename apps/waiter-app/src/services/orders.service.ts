import type {
  CartItemDTO,
  CreateOrderInput,
  OrderResponse,
  TableOrdersGroupDTO,
} from '@repo/shared-types';
import { http } from '@/lib/http';

export async function listWaiterOrders(restaurantId: string, view: 'list' | 'table' = 'list', signal?: AbortSignal) {
  const { data } = await http.get<OrderResponse[] | TableOrdersGroupDTO[]>('/orders/staff/list', {
    params: { scope: 'kitchen', view },
    signal,
  });

  return data;
}

export async function getWaiterOrder(orderId: string) {
  const { data } = await http.get<OrderResponse>(`/orders/staff/${orderId}`);
  return data;
}

export async function createWaiterOrder(input: CreateOrderInput) {
  const { data } = await http.post<OrderResponse>('/orders/staff', input);
  return data;
}

export async function updateWaiterOrderItems(
  orderId: string,
  items: CartItemDTO[],
  version?: number,
  reason?: string,
) {
  const { data } = await http.patch<OrderResponse>(`/orders/${orderId}/items`, {
    items,
    ...(version !== undefined ? { version } : {}),
    ...(reason ? { reason } : {}),
  });
  return data;
}

export async function updateWaiterOrderStatus(orderId: string, status: OrderResponse['status']) {
  const { data } = await http.patch<OrderResponse>(`/orders/${orderId}/status`, { status });
  return data;
}
