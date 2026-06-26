import type { OrderResponse, OrderStatus } from '@repo/shared-types';
import { http } from '@/lib/http';

export async function listRestaurantOrders(restaurantId: string) {
  const { data } = await http.get<OrderResponse[]>('/orders/staff/list', {
    params: { scope: 'kitchen' },
  });
  return data;
}

export async function updateOrderStatus(orderId: string, status: OrderStatus) {
  const { data } = await http.patch<OrderResponse>(`/orders/${orderId}/status`, { status });
  return data;
}
