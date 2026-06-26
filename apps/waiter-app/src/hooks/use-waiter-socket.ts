'use client';

import { useEffect, useRef, useState } from 'react';
import {
  REALTIME_EVENTS,
  type OrderResponse,
  type RealtimeEvent,
  type WaiterNotificationRealtimePayload,
  type WaiterCallPayload,
} from '@repo/shared-types';
import { getSocket, getSocketStatus, type SocketStatus } from '@/lib/socket';

type UseWaiterSocketOptions = {
  restaurantId?: string;
  onOrderEvent: (event: RealtimeEvent, order: OrderResponse) => void;
  onWaiterCall?: (payload: WaiterCallPayload) => void;
  onNotificationCreated?: (payload: WaiterNotificationRealtimePayload) => void;
  onNotificationAccepted?: (payload: WaiterNotificationRealtimePayload) => void;
  onNotificationResolved?: (payload: WaiterNotificationRealtimePayload) => void;
};

const WAITER_EVENTS: RealtimeEvent[] = [
  REALTIME_EVENTS.ORDER_CREATED,
  REALTIME_EVENTS.ORDER_PREPARING,
  REALTIME_EVENTS.ORDER_READY,
  REALTIME_EVENTS.ORDER_DELIVERED,
  REALTIME_EVENTS.ORDER_PAID,
  REALTIME_EVENTS.ORDER_CANCELLED,
];

export function useWaiterSocket({
  restaurantId,
  onOrderEvent,
  onWaiterCall,
  onNotificationCreated,
  onNotificationAccepted,
  onNotificationResolved,
}: UseWaiterSocketOptions) {
  const [status, setStatus] = useState<SocketStatus>('connecting');
  const onOrderEventRef = useRef(onOrderEvent);
  const onWaiterCallRef = useRef(onWaiterCall);
  const onNotificationCreatedRef = useRef<UseWaiterSocketOptions['onNotificationCreated']>(undefined);
  const onNotificationAcceptedRef = useRef<UseWaiterSocketOptions['onNotificationAccepted']>(undefined);
  const onNotificationResolvedRef = useRef<UseWaiterSocketOptions['onNotificationResolved']>(undefined);
  const joinedRoomRef = useRef<string | null>(null);

  onOrderEventRef.current = onOrderEvent;
  onWaiterCallRef.current = onWaiterCall;
  onNotificationCreatedRef.current = onNotificationCreated;
  onNotificationAcceptedRef.current = onNotificationAccepted;
  onNotificationResolvedRef.current = onNotificationResolved;

  useEffect(() => {
    if (!restaurantId) {
      setStatus('disconnected');
      return;
    }

    const socket = getSocket();
    const roomKey = `waiter:${restaurantId}`;

    const refreshStatus = () => setStatus(getSocketStatus(socket));

    const handleConnect = () => {
      refreshStatus();
      if (joinedRoomRef.current !== roomKey) {
        socket.emit('waiter:join', { restaurantId });
        joinedRoomRef.current = roomKey;
      }
    };

    const handleWaiterCall = (payload: WaiterCallPayload) => {
      onWaiterCallRef.current?.(payload);
    };
    const handleNotificationCreated = (payload: WaiterNotificationRealtimePayload) => {
      onNotificationCreatedRef.current?.(payload);
    };
    const handleNotificationAccepted = (payload: WaiterNotificationRealtimePayload) => {
      onNotificationAcceptedRef.current?.(payload);
    };
    const handleNotificationResolved = (payload: WaiterNotificationRealtimePayload) => {
      onNotificationResolvedRef.current?.(payload);
    };

    const handlers = WAITER_EVENTS.map(
      (event) =>
        [
          event,
          (order: OrderResponse) => {
            onOrderEventRef.current(event, order);
          },
        ] as const,
    );

    socket.on('connect', handleConnect);
    socket.on('disconnect', refreshStatus);
    socket.on('connect_error', refreshStatus);

    for (const [event, handler] of handlers) {
      socket.on(event, handler);
    }
    socket.on(REALTIME_EVENTS.CALL_WAITER, handleWaiterCall);
    socket.on('WAITER_NOTIFICATION_CREATED', handleNotificationCreated);
    socket.on('WAITER_NOTIFICATION_ACCEPTED', handleNotificationAccepted);
    socket.on('WAITER_NOTIFICATION_RESOLVED', handleNotificationResolved);

    if (socket.connected) {
      handleConnect();
    } else {
      socket.connect();
    }

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', refreshStatus);
      socket.off('connect_error', refreshStatus);

      for (const [event, handler] of handlers) {
        socket.off(event, handler);
      }
      socket.off(REALTIME_EVENTS.CALL_WAITER, handleWaiterCall);
      socket.off('WAITER_NOTIFICATION_CREATED', handleNotificationCreated);
      socket.off('WAITER_NOTIFICATION_ACCEPTED', handleNotificationAccepted);
      socket.off('WAITER_NOTIFICATION_RESOLVED', handleNotificationResolved);
    };
  }, [restaurantId]);

  useEffect(() => {
    joinedRoomRef.current = null;
  }, [restaurantId]);

  return { status };
}
