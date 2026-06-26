import type { ChangePaymentMethodInput, PaymentDTO, RefundPaymentInput } from '@repo/shared-types';
import { http } from '@/lib/http';

export async function listPayments(params?: Record<string, string>) {
  const { data } = await http.get<PaymentDTO[]>('/payments', { params });
  return data;
}

export async function listPaymentHistory(orderId: string) {
  const { data } = await http.get<PaymentDTO[]>(`/payments/order/${orderId}`);
  return data;
}

export async function refundPayment(paymentId: string, input: RefundPaymentInput) {
  const { data } = await http.patch<PaymentDTO>(`/payments/${paymentId}/refund`, input);
  return data;
}

export async function changePaymentMethod(paymentId: string, input: ChangePaymentMethodInput) {
  const { data } = await http.patch<PaymentDTO>(`/payments/${paymentId}/method`, input);
  return data;
}
