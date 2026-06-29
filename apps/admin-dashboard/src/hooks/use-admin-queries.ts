'use client';

import { useQuery } from '@tanstack/react-query';
import type {
  BusyHourDTO,
  DashboardAnalyticsDTO,
  DiscountDTO,
  InventoryItemDTO,
  MenuDTO,
  MenuItemDTO,
  OrderResponse,
  OrdersSummaryDTO,
  PaymentDTO,
  PrinterConfigDTO,
  PrintJobDTO,
  ReportExportJobDTO,
  RevenueChartResponse,
  SettingsDTO,
  StaffMemberDTO,
  TableDTO,
  TopDishDTO,
  AuditLogDTO,
  FloorDTO,
} from '@repo/shared-types';
import type { SystemHealthResponse } from '@/services/system.service';
import {
  getRestaurantDashboardAnalytics,
  getRevenueChart,
  getTopDishes,
  getBusyHours,
  getOrdersSummary,
} from '@/services/analytics.service';
import { listDiscounts } from '@/services/discounts.service';
import { listInventory } from '@/services/inventory.service';
import { listLogs } from '@/services/logs.service';
import { listMenus, listMenuItems } from '@/services/menu.service';
import { listOrders } from '@/services/orders.service';
import { listPayments } from '@/services/payments.service';
import { listPrinters, listPrinterHistory } from '@/services/printers.service';
import { listReports } from '@/services/reports.service';
import { getSettings } from '@/services/settings.service';
import { listStaff } from '@/services/staff.service';
import { getSystemHealth } from '@/services/system.service';
import { listTables, listFloors, getNetworkInfo } from '@/services/tables.service';
import { useAppStore } from '@/store/app.store';

export type RevenuePeriod = 'daily' | 'weekly' | 'monthly';

function useRestaurantId() {
  return useAppStore((state) => state.restaurantId);
}

function enabledOrSkip(restaurantId: string | undefined): string | undefined {
  return restaurantId || undefined;
}

const STALE_TIMES = {
  DASHBOARD: 15_000,
  ANALYTICS: 30_000,
  MENU: 60_000,
  ORDERS: 10_000,
  TABLES: 30_000,
  STAFF: 60_000,
  SETTINGS: 120_000,
  LOGS: 30_000,
  INVENTORY: 60_000,
  PRINTERS: 30_000,
  REPORTS: 60_000,
  PAYMENTS: 30_000,
  DISCOUNTS: 30_000,
  HEALTH: 15_000,
  NETWORK: 60_000,
};

export function useDashboardAnalytics() {
  const restaurantId = useRestaurantId();
  return useQuery<DashboardAnalyticsDTO>({
    queryKey: ['admin', 'dashboard', restaurantId],
    queryFn: () => getRestaurantDashboardAnalytics(restaurantId!),
    enabled: !!restaurantId,
    staleTime: STALE_TIMES.DASHBOARD,
  });
}

export function useRevenueChart(period: RevenuePeriod) {
  const restaurantId = useRestaurantId();
  return useQuery<RevenueChartResponse>({
    queryKey: ['admin', 'revenue-chart', period, restaurantId],
    queryFn: () => getRevenueChart(period, restaurantId!),
    enabled: !!restaurantId,
    staleTime: STALE_TIMES.ANALYTICS,
  });
}

export function useTopDishes() {
  const restaurantId = useRestaurantId();
  return useQuery<TopDishDTO[]>({
    queryKey: ['admin', 'top-dishes', restaurantId],
    queryFn: () => getTopDishes(restaurantId!),
    enabled: !!restaurantId,
    staleTime: STALE_TIMES.ANALYTICS,
  });
}

export function useBusyHours() {
  const restaurantId = useRestaurantId();
  return useQuery<BusyHourDTO[]>({
    queryKey: ['admin', 'busy-hours', restaurantId],
    queryFn: () => getBusyHours(restaurantId!),
    enabled: !!restaurantId,
    staleTime: STALE_TIMES.ANALYTICS,
  });
}

export function useOrdersSummary() {
  const restaurantId = useRestaurantId();
  return useQuery<OrdersSummaryDTO>({
    queryKey: ['admin', 'orders-summary', restaurantId],
    queryFn: () => getOrdersSummary(restaurantId!),
    enabled: !!restaurantId,
    staleTime: STALE_TIMES.ANALYTICS,
  });
}

export function useOrders() {
  const restaurantId = useRestaurantId();
  return useQuery<OrderResponse[]>({
    queryKey: ['admin', 'orders', restaurantId],
    queryFn: () => listOrders(restaurantId!),
    enabled: !!restaurantId,
    staleTime: STALE_TIMES.ORDERS,
  });
}

export function useMenus() {
  const restaurantId = useRestaurantId();
  return useQuery<MenuDTO[]>({
    queryKey: ['admin', 'menus', restaurantId],
    queryFn: () => listMenus(restaurantId!),
    enabled: !!restaurantId,
    staleTime: STALE_TIMES.MENU,
  });
}

export function useMenuItems() {
  const restaurantId = useRestaurantId();
  return useQuery<MenuItemDTO[]>({
    queryKey: ['admin', 'menu-items', restaurantId],
    queryFn: () => listMenuItems(restaurantId!),
    enabled: !!restaurantId,
    staleTime: STALE_TIMES.MENU,
  });
}

export function useTables() {
  const restaurantId = useRestaurantId();
  return useQuery<TableDTO[]>({
    queryKey: ['admin', 'tables', restaurantId],
    queryFn: () => listTables(restaurantId!),
    enabled: !!restaurantId,
    staleTime: STALE_TIMES.TABLES,
  });
}

export function useFloors() {
  return useQuery<FloorDTO[]>({
    queryKey: ['admin', 'floors'],
    queryFn: () => listFloors(),
    staleTime: STALE_TIMES.TABLES,
  });
}

export function useStaff() {
  const restaurantId = useRestaurantId();
  return useQuery<StaffMemberDTO[]>({
    queryKey: ['admin', 'staff', restaurantId],
    queryFn: () => listStaff(restaurantId!),
    enabled: !!restaurantId,
    staleTime: STALE_TIMES.STAFF,
  });
}

export function useInventory() {
  const restaurantId = useRestaurantId();
  return useQuery<InventoryItemDTO[]>({
    queryKey: ['admin', 'inventory', restaurantId],
    queryFn: () => listInventory(restaurantId!),
    enabled: !!restaurantId,
    staleTime: STALE_TIMES.INVENTORY,
  });
}

export function useDiscounts() {
  return useQuery<DiscountDTO[]>({
    queryKey: ['admin', 'discounts'],
    queryFn: () => listDiscounts(),
    staleTime: STALE_TIMES.DISCOUNTS,
  });
}

export function usePayments() {
  return useQuery<PaymentDTO[]>({
    queryKey: ['admin', 'payments'],
    queryFn: () => listPayments(),
    staleTime: STALE_TIMES.PAYMENTS,
  });
}

export function useSettings() {
  const restaurantId = useRestaurantId();
  return useQuery<SettingsDTO | null>({
    queryKey: ['admin', 'settings', restaurantId],
    queryFn: () => getSettings(restaurantId!),
    enabled: !!restaurantId,
    staleTime: STALE_TIMES.SETTINGS,
  });
}

export function useAuditLogs() {
  const restaurantId = useRestaurantId();
  return useQuery<AuditLogDTO[]>({
    queryKey: ['admin', 'logs', restaurantId],
    queryFn: () => listLogs(restaurantId!).then((r) => r.data),
    enabled: !!restaurantId,
    staleTime: STALE_TIMES.LOGS,
  });
}

export function usePrinters() {
  const restaurantId = useRestaurantId();
  return useQuery<PrinterConfigDTO[]>({
    queryKey: ['admin', 'printers', restaurantId],
    queryFn: () => listPrinters(restaurantId!),
    enabled: !!restaurantId,
    staleTime: STALE_TIMES.PRINTERS,
  });
}

export function usePrinterHistory() {
  const restaurantId = useRestaurantId();
  return useQuery<PrintJobDTO[]>({
    queryKey: ['admin', 'printer-history', restaurantId],
    queryFn: () => listPrinterHistory(restaurantId!),
    enabled: !!restaurantId,
    staleTime: STALE_TIMES.PRINTERS,
  });
}

export function useReports() {
  const restaurantId = useRestaurantId();
  return useQuery<ReportExportJobDTO[]>({
    queryKey: ['admin', 'reports', restaurantId],
    queryFn: () => listReports(restaurantId!),
    enabled: !!restaurantId,
    staleTime: STALE_TIMES.REPORTS,
  });
}

export function useSystemHealth() {
  return useQuery<SystemHealthResponse>({
    queryKey: ['admin', 'health'],
    queryFn: () => getSystemHealth(),
    staleTime: STALE_TIMES.HEALTH,
  });
}

export function useNetworkInfo() {
  return useQuery({
    queryKey: ['admin', 'network'],
    queryFn: () => getNetworkInfo(),
    staleTime: STALE_TIMES.NETWORK,
  });
}
