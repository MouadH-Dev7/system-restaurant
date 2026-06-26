import type { ApproveDiscountInput, DiscountDTO } from '@repo/shared-types';
import { http } from '@/lib/http';

export async function listDiscounts(params?: Record<string, string>) {
  const { data } = await http.get<DiscountDTO[]>('/discounts', { params });
  return data;
}

export async function approveDiscount(discountId: string, input: ApproveDiscountInput) {
  const { data } = await http.patch<DiscountDTO>(`/discounts/${discountId}/approve`, input);
  return data;
}

export async function rejectDiscount(discountId: string, input: ApproveDiscountInput) {
  const { data } = await http.patch<DiscountDTO>(`/discounts/${discountId}/reject`, input);
  return data;
}
