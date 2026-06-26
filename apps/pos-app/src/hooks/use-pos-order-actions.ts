'use client';

import { useCallback } from 'react';
import { OrderType, type CartItemDTO, type OrderResponse, type OrderStatus } from '@repo/shared-types';
import { useAuthStore } from '@/auth/store';
import { formatGuestLabel, formatTableLabel, posT } from '@/lib/i18n';
import { getNextOrderStatus, isWalkInOrder } from '@/lib/mappers/order.mapper';
import { createPosSessionId } from '@/lib/random-id';
import {
  createPayment,
  createPosOrder,
  getPosOrder,
  printReceipt,
  updateOrderItems,
  updateOrderStatus,
} from '@/services/orders.service';
import { getTableBilling } from '@/services/tables.service';
import { getOrderById, usePosDataStore } from '@/store/pos-data.store';
import { getSelectedPaymentMethod, usePosUiStore } from '@/store/pos-ui.store';
import type { CheckoutTarget, ReceiptBundle } from '@/types/pos';

function buildReceiptBundle(
  orders: OrderResponse[],
  language: ReturnType<typeof usePosUiStore.getState>['language'],
): ReceiptBundle {
  const sortedOrders = orders
    .slice()
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  const firstOrder = sortedOrders[0];
  const isTableBundle = sortedOrders.length > 1;
  const t = posT(language);
  const guestLabel = isTableBundle
    ? `${sortedOrders.length} ${t.tickets}`
    : formatGuestLabel(
        firstOrder?.guestSessionId,
        firstOrder?.dailyOrderNumber,
        language,
        firstOrder ? isWalkInOrder(firstOrder) : false,
      );

  return {
    mode: isTableBundle ? 'table' : 'single',
    orderIds: sortedOrders.map((order) => order.id),
    tableLabel: formatTableLabel(
      firstOrder?.table?.number,
      language,
      firstOrder ? isWalkInOrder(firstOrder) : true,
    ),
    guestLabel,
    itemCount: sortedOrders.reduce((sum, order) => sum + order.items.length, 0),
    total: sortedOrders.reduce((sum, order) => sum + order.grandTotal, 0),
    orders: sortedOrders,
  };
}

export function usePosOrderActions() {
  const restaurantId = useAuthStore((state) => state.session?.user.restaurantId);
  const upsertOrder = usePosDataStore((state) => state.upsertOrder);
  const setTableBilling = usePosDataStore((state) => state.setTableBilling);
  const setActiveScreen = usePosUiStore((state) => state.setActiveScreen);
  const setLastReceiptOrder = usePosUiStore((state) => state.setLastReceiptOrder);
  const setLastReceiptBundle = usePosUiStore((state) => state.setLastReceiptBundle);
  const setCheckoutTarget = usePosUiStore((state) => state.setCheckoutTarget);

  const advanceStatus = useCallback(
    async (orderId: string, currentStatus: OrderStatus) => {
      const nextStatus = getNextOrderStatus(currentStatus);
      if (!nextStatus) {
        return;
      }

      const updated = await updateOrderStatus(orderId, nextStatus);
      upsertOrder(updated);
    },
    [upsertOrder],
  );

  const collectPayment = useCallback(
    async (target: CheckoutTarget) => {
      const paymentMethod = usePosUiStore.getState().selectedPaymentMethod;
      const language = usePosUiStore.getState().language;
      const cashierName = useAuthStore.getState().session?.user.name ?? 'Cashier';
      const snapshot = usePosDataStore.getState().orders;
      const targetOrders =
        target.type === 'table'
          ? snapshot.filter(
              (order) =>
                order.tableId === target.tableId &&
                order.status !== 'PAID' &&
                order.status !== 'CANCELLED',
            )
          : snapshot.filter((order) => order.id === target.orderId);

      const updatedOrders: OrderResponse[] = [];

      for (const targetOrder of targetOrders) {
        let current = targetOrder;

        while (
          current.status !== 'DELIVERED' &&
          current.status !== 'PAID' &&
          current.status !== 'CANCELLED'
        ) {
          const nextStatus = getNextOrderStatus(current.status);
          if (!nextStatus) {
            break;
          }

          current = await updateOrderStatus(current.id, nextStatus);
          upsertOrder(current);
        }

        if (current.status !== 'CANCELLED' && current.remainingAmount > 0) {
          const resolvedPaymentMethod = usePosUiStore.getState().selectedPaymentMethod;
          const paymentDefinition = getSelectedPaymentMethod(resolvedPaymentMethod);
          await createPayment({
            orderId: current.id,
            amount: current.remainingAmount,
            paymentMethod: paymentDefinition.backendMethod,
            reason: 'POS checkout settlement',
          });
          current = await getPosOrder(current.id);
          upsertOrder(current);
        }

        if (
          current.status !== 'CANCELLED' &&
          current.status !== 'PAID' &&
          current.remainingAmount <= 0
        ) {
          current = await updateOrderStatus(current.id, 'PAID', 'Order settled through payments');
          upsertOrder(current);
        }

        updatedOrders.push(current);
      }

      const bundle = buildReceiptBundle(updatedOrders, language);
      if (target.type === 'table') {
        const billing = await getTableBilling(target.tableId);
        setTableBilling(billing);
        bundle.summary = billing.summary;
        bundle.payments = billing.payments;
        bundle.cashierName = cashierName;
        bundle.createdAt = new Date().toISOString();
      }
      setLastReceiptBundle(bundle);
      setLastReceiptOrder(updatedOrders[updatedOrders.length - 1] ?? null, paymentMethod);
      setCheckoutTarget(null);
      setActiveScreen('receipt');
    },
    [
      setActiveScreen,
      setCheckoutTarget,
      setLastReceiptBundle,
      setLastReceiptOrder,
      setTableBilling,
      upsertOrder,
    ],
  );

  const openCheckout = useCallback(
    (target: CheckoutTarget) => {
      if (target.type === 'order') {
        usePosUiStore.getState().selectOrder(target.orderId);
      } else {
        usePosUiStore.getState().selectTable(target.tableId);
      }
      setCheckoutTarget(target);
      setActiveScreen('checkout');
    },
    [setActiveScreen, setCheckoutTarget],
  );

  const createWalkInOrder = useCallback(
    async (items: CartItemDTO[]) => {
      if (!restaurantId) {
        throw new Error('Missing restaurant session');
      }

      const order = await createPosOrder({
        restaurantId,
        orderType: OrderType.TAKEAWAY,
        guestSessionId: createPosSessionId(),
        items,
      });
      upsertOrder(order);
      usePosUiStore.getState().selectOrder(order.id);
      setActiveScreen('order-detail');
      return order;
    },
    [restaurantId, setActiveScreen, upsertOrder],
  );

  const createTableOrder = useCallback(
    async (tableId: string, items: CartItemDTO[]) => {
      if (!restaurantId) {
        throw new Error('Missing restaurant session');
      }

      const order = await createPosOrder({
        restaurantId,
        tableId,
        orderType: OrderType.DINE_IN,
        guestSessionId: createPosSessionId(),
        items,
      });
      upsertOrder(order);
      usePosUiStore.getState().selectOrder(order.id);
      usePosUiStore.getState().selectTable(tableId);
      setActiveScreen('order-detail');
      return order;
    },
    [restaurantId, setActiveScreen, upsertOrder],
  );

  const saveOrderItems = useCallback(
    async (
      orderId: string,
      items: CartItemDTO[],
      version?: number,
      reason?: string,
      sourceContext?: string,
    ) => {
      const updated = await updateOrderItems(orderId, items, version, reason, sourceContext);
      upsertOrder(updated);
      return updated;
    },
    [upsertOrder],
  );

  return {
    advanceStatus,
    collectPayment,
    openCheckout,
    createWalkInOrder,
    createTableOrder,
    saveOrderItems,
    printReceipt,
  };
}
