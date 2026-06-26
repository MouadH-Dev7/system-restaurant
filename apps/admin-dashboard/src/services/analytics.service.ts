import type {
  BusyHourDTO,
  DashboardAnalyticsDTO,
  OrdersSummaryDTO,
  RevenueChartResponse,
  TopDishDTO,
} from '@repo/shared-types';
import { http } from '@/lib/http';

export async function getDashboardAnalytics() {
  const { data } = await http.get<DashboardAnalyticsDTO>('/analytics/dashboard');
  return data;
}

export async function getRestaurantDashboardAnalytics(restaurantId: string) {
  const { data } = await http.get<DashboardAnalyticsDTO>('/analytics/dashboard');
  return data;
}

export async function getRevenueChart(
  period: 'daily' | 'weekly' | 'monthly' = 'daily',
  restaurantId?: string,
) {
  const { data } = await http.get<RevenueChartResponse>('/analytics/revenue', {
    params: { period },
  });
  return data;
}

export async function getTopDishes(restaurantId?: string) {
  const { data } = await http.get<TopDishDTO[]>('/analytics/top-dishes');
  return data;
}

export async function getBusyHours(restaurantId?: string) {
  const { data } = await http.get<BusyHourDTO[]>('/analytics/busy-hours');
  return data;
}

export async function getOrdersSummary(restaurantId?: string) {
  const { data } = await http.get<OrdersSummaryDTO>('/analytics/orders-summary');
  return data;
}
