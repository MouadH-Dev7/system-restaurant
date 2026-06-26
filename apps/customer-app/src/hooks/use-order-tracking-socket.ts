'use client';

import { useEffect, useRef, useState } from 'react';
import {
  REALTIME_EVENTS,
  type OrderResponse,
  type RealtimeEvent,
  type WaiterNotificationRealtimePayload,
} from '@repo/shared-types';
import { getSocket, getSocketStatus, type SocketStatus } from '@/lib/socket';
import { getOrderById } from '@/services/order.service';
import type { OrderContextDTO } from '@/types/order';

type UseOrderTrackingSocketOptions = {
  context: OrderContextDTO | null;
  orderId: string | null;
  onOrderUpdate: (order: OrderResponse) => void;
  onWaiterAccepted?: (payload: WaiterNotificationRealtimePayload) => void;
  onWaiterResolved?: (payload: WaiterNotificationRealtimePayload) => void;
};

const CUSTOMER_EVENTS: RealtimeEvent[] = [
  REALTIME_EVENTS.ORDER_PREPARING,
  REALTIME_EVENTS.ORDER_READY,
  REALTIME_EVENTS.ORDER_DELIVERED,
  REALTIME_EVENTS.ORDER_PAID,
  REALTIME_EVENTS.ORDER_CANCELLED,
];

const POLL_INTERVAL_MS = 8000;

export function useOrderTrackingSocket({
  context,
  orderId,
  onOrderUpdate,
  onWaiterAccepted,
  onWaiterResolved,
}: UseOrderTrackingSocketOptions) {
  const [status, setStatus] = useState<SocketStatus>('connecting');
  const onUpdateRef = useRef(onOrderUpdate);
  const onWaiterAcceptedRef = useRef(onWaiterAccepted);
  const onWaiterResolvedRef = useRef(onWaiterResolved);
  const joinedRoomRef = useRef<string | null>(null);
  onUpdateRef.current = onOrderUpdate;
  onWaiterAcceptedRef.current = onWaiterAccepted;
  onWaiterResolvedRef.current = onWaiterResolved;

  useEffect(() => {
    if (!context || !orderId) {
      return;
    }

    const socket = getSocket();
    const { restaurantId, tableId } = context;
    const roomKey = `customer:${restaurantId}:${tableId}`;

    const refreshStatus = () => setStatus(getSocketStatus(socket));

    const handleConnect = () => {
      refreshStatus();
      if (joinedRoomRef.current !== roomKey) {
        socket.emit('customer:join', { restaurantId, tableId });
        joinedRoomRef.current = roomKey;
      }
    };

    const handleOrderEvent = (order: OrderResponse) => {
      if (order.id !== orderId) {
        return;
      }
      onUpdateRef.current(order);
    };
    const handleWaiterAccepted = (payload: WaiterNotificationRealtimePayload) => {
      onWaiterAcceptedRef.current?.(payload);
    };
    const handleWaiterResolved = (payload: WaiterNotificationRealtimePayload) => {
      onWaiterResolvedRef.current?.(payload);
    };

    socket.on('connect', handleConnect);
    socket.on('disconnect', refreshStatus);
    socket.on('connect_error', refreshStatus);

    for (const event of CUSTOMER_EVENTS) {
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
      socket.off('disconnect', refreshStatus);
      socket.off('connect_error', refreshStatus);
      for (const event of CUSTOMER_EVENTS) {
        socket.off(event, handleOrderEvent);
      }
      socket.off('WAITER_NOTIFICATION_ACCEPTED', handleWaiterAccepted);
      socket.off('WAITER_NOTIFICATION_RESOLVED', handleWaiterResolved);
    };
  }, [context, orderId]);

  useEffect(() => {
    joinedRoomRef.current = null;
  }, [context?.restaurantId, context?.tableId]);

  useEffect(() => {
    if (!context || !orderId || status === 'connected') {
      return;
    }

    let active = true;

    async function pollOrder() {
      try {
        const order = await getOrderById(orderId!, context!);
        if (active) {
          onUpdateRef.current(order);
        }
      } catch {
        // ignore polling errors
      }
    }

    void pollOrder();
    const timer = setInterval(() => void pollOrder(), POLL_INTERVAL_MS);

    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [context, orderId, status]);

  return { status };
}
