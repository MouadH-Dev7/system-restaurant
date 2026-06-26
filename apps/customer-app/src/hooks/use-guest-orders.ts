'use client';

import { useCallback, useEffect, useRef } from 'react';
import { REALTIME_EVENTS, type OrderResponse, type RealtimeEvent } from '@repo/shared-types';
import { getOrCreateGuestSessionId } from '@/lib/guest-session';
import { getSocket, getSocketStatus } from '@/lib/socket';
import { listGuestOrders } from '@/services/order.service';
import { useGuestOrdersStore } from '@/store/guest-orders.store';
import { useLanguageStore } from '@/store/language.store';
import { useAppStore } from '@/store/app.store';
import { t } from '@/lib/i18n';
import type { OrderContextDTO } from '@/types/order';

const TRACKED_EVENTS: RealtimeEvent[] = [
  REALTIME_EVENTS.ORDER_CREATED,
  REALTIME_EVENTS.ORDER_PREPARING,
  REALTIME_EVENTS.ORDER_READY,
  REALTIME_EVENTS.ORDER_DELIVERED,
  REALTIME_EVENTS.ORDER_PAID,
  REALTIME_EVENTS.ORDER_CANCELLED,
];

export function useGuestOrders(context: OrderContextDTO | null) {
  const orders = useGuestOrdersStore((state) => state.orders);
  const loading = useGuestOrdersStore((state) => state.loading);
  const setOrders = useGuestOrdersStore((state) => state.setOrders);
  const upsertOrder = useGuestOrdersStore((state) => state.upsertOrder);
  const setLoading = useGuestOrdersStore((state) => state.setLoading);
  const joinedRoomRef = useRef<string | null>(null);

  const reload = useCallback(async () => {
    if (!context) {
      setOrders([]);
      return;
    }

    const guestSessionId = getOrCreateGuestSessionId(context);
    setOrders([]);
    setLoading(true);

    try {
      const nextOrders = await listGuestOrders(context, guestSessionId);
      setOrders(nextOrders);
    } catch {
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, [context, setLoading, setOrders]);

  useEffect(() => {
    void reload();
  }, [reload]);

  useEffect(() => {
    if (!context) {
      return;
    }

    const orderContext = context;
    const socket = getSocket();
    const roomKey = `customer:${orderContext.restaurantId}:${orderContext.tableId}`;

    const handleConnect = () => {
      if (joinedRoomRef.current !== roomKey) {
        socket.emit('customer:join', {
          restaurantId: orderContext.restaurantId,
          tableId: orderContext.tableId,
        });
        joinedRoomRef.current = roomKey;
      }
    };

    const handleOrderEvent = (order: OrderResponse) => {
      upsertOrder(order);
    };

    const handleWaiterAccepted = (payload: any) => {
      const { notification } = payload;
      if (
        orderContext &&
        notification.tableId === orderContext.tableId &&
        notification.type === 'CALL_WAITER'
      ) {
        const lang = useLanguageStore.getState().language;
        const copy = t(lang);
        useAppStore.getState().setWaiterComingMessage(copy.waiterComing);
      }
    };

    const handleWaiterResolved = (payload: any) => {
      const { notification } = payload;
      if (
        orderContext &&
        notification.tableId === orderContext.tableId &&
        notification.type === 'CALL_WAITER'
      ) {
        useAppStore.getState().setWaiterComingMessage(null);
      }
    };

    socket.on('connect', handleConnect);
    for (const event of TRACKED_EVENTS) {
      socket.on(event, handleOrderEvent);
    }
    socket.on('WAITER_NOTIFICATION_ACCEPTED', handleWaiterAccepted);
    socket.on('WAITER_NOTIFICATION_RESOLVED', handleWaiterResolved);

    if (socket.connected) {
      handleConnect();
    } else {
      socket.connect();
    }

    return () => {
      socket.off('connect', handleConnect);
      for (const event of TRACKED_EVENTS) {
        socket.off(event, handleOrderEvent);
      }
      socket.off('WAITER_NOTIFICATION_ACCEPTED', handleWaiterAccepted);
      socket.off('WAITER_NOTIFICATION_RESOLVED', handleWaiterResolved);
    };
  }, [context, upsertOrder]);

  useEffect(() => {
    joinedRoomRef.current = null;
  }, [context?.restaurantId, context?.tableId]);

  return {
    orders,
    loading,
    reload,
    guestSessionId: context ? getOrCreateGuestSessionId(context) : null,
  };
}
