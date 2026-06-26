import type {
  CartItemDTO,
  CreatePaymentInput,
  CreateOrderInput,
  OrderResponse,
  PaymentDTO,
  PrintJobDTO,
  ReceiptLanguage,
} from '@repo/shared-types';

import { http } from '@/lib/http';

export async function listPosOrders(restaurantId: string) {
  const { data } = await http.get<OrderResponse[]>('/orders/staff/list', {
    params: { scope: 'pos' },
  });

  return data;
}

export async function listPosOrderHistory(restaurantId: string) {
  const { data } = await http.get<OrderResponse[]>('/orders/staff/list', {
    params: { scope: 'pos', includeHistory: 'today' },
  });

  return data;
}

export async function createPosOrder(input: CreateOrderInput) {
  const { data } = await http.post<OrderResponse>('/orders/staff', input);

  return data;
}

export async function updateOrderItems(
  orderId: string,
  items: CartItemDTO[],
  version?: number,
  reason?: string,
  sourceContext?: string,
) {
  const { data } = await http.patch<OrderResponse>(`/orders/${orderId}/items`, {
    items,
    ...(version !== undefined ? { version } : {}),
    ...(reason ? { reason } : {}),
    ...(sourceContext ? { sourceContext } : {}),
  });

  return data;
}

export async function updateOrderStatus(
  orderId: string,
  status: OrderResponse['status'],
  reason?: string,
) {
  const { data } = await http.patch<OrderResponse>(`/orders/${orderId}/status`, {
    status,
    ...(reason ? { reason } : {}),
  });

  return data;
}

export async function getPosOrder(orderId: string) {
  const { data } = await http.get<OrderResponse>(`/orders/staff/${orderId}`);
  return data;
}

export async function createPayment(input: CreatePaymentInput) {
  const { data } = await http.post<PaymentDTO>('/payments', input);
  return data;
}

export async function printReceipt(orderId: string, language: ReceiptLanguage) {
  const { data } = await http.post<PrintJobDTO>(`/printing/receipt/${orderId}`, { language });
  return data;
}

export async function getPrintJob(jobId: string) {
  const { data } = await http.get<PrintJobDTO>(`/printing/jobs/${jobId}`);
  return data;
}
