import { OrderType, type OrderResponse, type OrderStatus as ApiOrderStatus } from '@repo/shared-types';
import { formatMoney, formatOrderNumber, formatTime } from '@/lib/format';
import {
  formatGuestLabel as localizeGuestLabel,
  formatCountLabel,
  formatRelativeMinutes,
  formatTableLabel as localizeTableLabel,
  localizeMenuItemName,
  localizeModifierName,
  posT,
} from '@/lib/i18n';
import type { PosLanguage } from '@/store/pos-ui.store';
import type { ActivityItem, OrderLine, OrderStatus, OrderTicket } from '@/types/pos';

const STATUS_LABEL: Record<ApiOrderStatus, OrderStatus | null> = {
  PENDING: 'Pending',
  PREPARING: 'Preparing',
  READY: 'Ready',
  DELIVERED: 'Delivered',
  PAID: null,
  CANCELLED: null,
};

const NEXT_STATUS: Partial<Record<ApiOrderStatus, ApiOrderStatus>> = {
  PENDING: 'PREPARING',
  PREPARING: 'READY',
  READY: 'DELIVERED',
};

export function isWalkInOrder(order: OrderResponse) {
  return order.orderType === OrderType.TAKEAWAY;
}

export function formatGuestLabel(order: OrderResponse, language: PosLanguage) {
  return localizeGuestLabel(
    order.guestSessionId,
    order.dailyOrderNumber,
    language,
    isWalkInOrder(order),
  );
}

export function formatTableLabel(order: OrderResponse, language: PosLanguage) {
  return localizeTableLabel(order.table?.number, language, isWalkInOrder(order));
}

export function toUiOrderStatus(status: ApiOrderStatus): OrderStatus | null {
  return STATUS_LABEL[status];
}

export function getNextOrderStatus(status: ApiOrderStatus) {
  return NEXT_STATUS[status];
}

function buildDisplayOrderId(order: OrderResponse, siblingOrders?: OrderResponse[]) {
  if (order.displayOrderId) {
    return order.displayOrderId;
  }

  const tableNumber = order.table?.number ?? 0;
  const orderedSiblings = (siblingOrders ?? [order])
    .slice()
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  const suffix = Math.max(
    1,
    orderedSiblings.findIndex((entry) => entry.id === order.id) + 1,
  );

  if (!tableNumber) {
    return `${formatOrderNumber(order.dailyOrderNumber)}B1`;
  }

  return `${tableNumber}A${suffix}`;
}

export function mapOrderToTicket(
  order: OrderResponse,
  language: PosLanguage,
  siblingOrders?: OrderResponse[],
): OrderTicket {
  const uiStatus = toUiOrderStatus(order.status);
  const walkIn = isWalkInOrder(order);

  return {
    id: order.id,
    shortId: formatOrderNumber(order.dailyOrderNumber),
    displayId: buildDisplayOrderId(order, siblingOrders),
    table: formatTableLabel(order, language),
    tableNumber: walkIn ? 0 : (order.table?.number ?? 0),
    guestName: formatGuestLabel(order, language),
    guestSessionId: order.guestSessionId ?? null,
    guestCount: (order.items ?? []).reduce((sum, item) => sum + item.quantity, 0),
    itemCount: (order.items ?? []).length,
    grandTotal: order.grandTotal,
    paidAmount: order.paidAmount,
    remainingAmount: order.remainingAmount,
    financialStatus: order.financialStatus,
    status: uiStatus ?? 'Delivered',
    apiStatus: order.status,
    openedAt: formatTime(order.createdAt),
    createdAt: order.createdAt,
    tableId: order.tableId,
    isWalkIn: walkIn,
  };
}

export function mapOrderItemsToLines(order: OrderResponse, language: PosLanguage): OrderLine[] {
  const t = posT(language);

  return (order.items ?? []).map((item) => ({
    id: item.id,
    menuItemId: item.menuItemId,
    name: item.menuItem ? localizeMenuItemName(item.menuItem, language) : t.item,
    quantity: item.quantity,
    price: item.price * item.quantity,
    unitPrice: item.price,
    category: 'Menu',
    modifiers: [
      ...(item.modifiers?.map((modifier) => localizeModifierName(modifier, language)) ?? []),
    ].filter(Boolean),
    status: lineStatusFromOrder(order.status),
  }));
}

function lineStatusFromOrder(status: ApiOrderStatus): OrderLine['status'] {
  if (status === 'READY' || status === 'DELIVERED' || status === 'PAID') {
    return 'ready';
  }

  if (status === 'PREPARING') {
    return 'preparing';
  }

  return 'sent';
}

export function mapOrderToActivity(order: OrderResponse, language: PosLanguage): ActivityItem {
  const tableLabel = formatTableLabel(order, language);
  const t = posT(language);

  const toneMap: Record<ApiOrderStatus, ActivityItem['tone']> = {
    PENDING: 'warning',
    PREPARING: 'primary',
    READY: 'primary',
    DELIVERED: 'success',
    PAID: 'success',
    CANCELLED: 'muted',
  };

  return {
    id: order.id,
    title: `${tableLabel} - ${formatGuestLabel(order, language)}`,
    detail: `${formatCountLabel((order.items ?? []).length, t.item, t.items, language)} - ${formatMoney((order.remainingAmount ?? 0) > 0 ? (order.remainingAmount ?? 0) : (order.grandTotal ?? 0))}`,
    time: formatRelativeMinutes(order.createdAt, language),
    tone: toneMap[order.status],
  };
}

export function orderToTableSummary(
  order: OrderResponse,
  language: PosLanguage,
  siblingOrders?: OrderResponse[],
) {
  return {
    orderId: order.id,
    shortId: formatOrderNumber(order.dailyOrderNumber),
    displayId: buildDisplayOrderId(order, siblingOrders),
    guestLabel: formatGuestLabel(order, language),
    guestSessionId: order.guestSessionId ?? null,
    grandTotal: order.grandTotal,
    paidAmount: order.paidAmount,
    remainingAmount: order.remainingAmount,
    financialStatus: order.financialStatus,
    status: order.status,
    itemCount: (order.items ?? []).length,
    createdAt: order.createdAt,
  };
}
