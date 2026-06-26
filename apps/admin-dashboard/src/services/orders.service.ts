import type { OrderResponse, OrderStatus } from '@repo/shared-types';
import { http } from '@/lib/http';

export async function listOrders(restaurantId: string, scope?: 'kitchen' | 'pos' | 'customer') {
  const { data } = await http.get<OrderResponse[]>('/orders/staff/list', {
    params: { scope: scope === 'customer' ? 'pos' : scope },
  });
  return data;
}

export async function updateOrderStatus(orderId: string, status: OrderStatus, reason?: string) {
  const { data } = await http.patch<OrderResponse>(`/orders/${orderId}/status`, {
    status,
    ...(reason ? { reason } : {}),
  });
  return data;
}
