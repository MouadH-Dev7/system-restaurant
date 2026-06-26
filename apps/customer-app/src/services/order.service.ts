import type { CreateOrderInput, OrderContextDTO, OrderResponse } from '@/types/order';
import { http } from '@/lib/http';

export async function createOrder(input: CreateOrderInput) {
  const { data } = await http.post<OrderResponse>('/orders', input);
  return data;
}

export async function getOrderById(orderId: string, context: OrderContextDTO) {
  const { data } = await http.get<OrderResponse>(`/orders/${orderId}`, {
    params: context,
  });
  return data;
}

export async function listGuestOrders(context: OrderContextDTO, guestSessionId: string) {
  const { data } = await http.get<OrderResponse[]>('/orders', {
    params: {
      restaurantId: context.restaurantId,
      tableId: context.tableId,
      guestSessionId,
      scope: 'customer',
    },
  });
  return data;
}

export async function updateCustomerOrder(
  orderId: string,
  input: { items: CreateOrderInput['items']; version: number },
  context: OrderContextDTO,
  guestSessionId: string,
) {
  const { data } = await http.patch<OrderResponse>(
    `/orders/${orderId}/items/customer`,
    input,
    {
      params: {
        restaurantId: context.restaurantId,
        tableId: context.tableId,
        guestSessionId,
      },
    },
  );
  return data;
}

export async function cancelCustomerOrder(
  orderId: string,
  context: OrderContextDTO,
  guestSessionId: string,
) {
  const { data } = await http.patch<OrderResponse>(
    `/orders/${orderId}/cancel/customer`,
    undefined,
    {
      params: {
        restaurantId: context.restaurantId,
        tableId: context.tableId,
        guestSessionId,
      },
    },
  );
  return data;
}
