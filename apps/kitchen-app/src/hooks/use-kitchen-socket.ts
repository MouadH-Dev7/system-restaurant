'use client';

import { useEffect, useRef, useState } from 'react';
import { REALTIME_EVENTS, type OrderResponse, type RealtimeEvent } from '@repo/shared-types';
import { getSocket, getSocketStatus, type SocketStatus } from '@/lib/socket';

type UseKitchenSocketOptions = {
  restaurantId?: string;
  onOrderEvent: (event: RealtimeEvent, order: OrderResponse) => void;
};

export function useKitchenSocket({ restaurantId, onOrderEvent }: UseKitchenSocketOptions) {
  const [status, setStatus] = useState<SocketStatus>('connecting');
  const [lastSyncAt, setLastSyncAt] = useState<Date | null>(null);
  const onOrderEventRef = useRef(onOrderEvent);
  const joinedRoomRef = useRef<string | null>(null);

  onOrderEventRef.current = onOrderEvent;

  useEffect(() => {
    if (!restaurantId) {
      setStatus('disconnected');
      return;
    }

    const socket = getSocket();
    const roomKey = `kitchen:${restaurantId}`;

    const refreshStatus = () => setStatus(getSocketStatus(socket));
    const markSync = () => setLastSyncAt(new Date());

    const handleConnect = () => {
      refreshStatus();
      if (joinedRoomRef.current !== roomKey) {
        socket.emit('kitchen:join', { restaurantId });
        joinedRoomRef.current = roomKey;
      }
      markSync();
    };

    const handlers: Array<[RealtimeEvent, (order: OrderResponse) => void]> = [
      [
        REALTIME_EVENTS.ORDER_CREATED,
        (order) => onOrderEventRef.current(REALTIME_EVENTS.ORDER_CREATED, order),
      ],
      [
        REALTIME_EVENTS.ORDER_PREPARING,
        (order) => onOrderEventRef.current(REALTIME_EVENTS.ORDER_PREPARING, order),
      ],
      [
        REALTIME_EVENTS.ORDER_READY,
        (order) => onOrderEventRef.current(REALTIME_EVENTS.ORDER_READY, order),
      ],
      [
        REALTIME_EVENTS.ORDER_CANCELLED,
        (order) => onOrderEventRef.current(REALTIME_EVENTS.ORDER_CANCELLED, order),
      ],
    ];
    const listeners = handlers.map(([event, handler]) => [
      event,
      (order: OrderResponse) => {
        handler(order);
        markSync();
      },
    ] as const);

    socket.on('connect', handleConnect);
    socket.on('disconnect', refreshStatus);
    socket.on('connect_error', refreshStatus);

    for (const [event, listener] of listeners) {
      socket.on(event, listener);
    }

    if (socket.connected) {
      handleConnect();
    } else {
      socket.connect();
    }

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', refreshStatus);
      socket.off('connect_error', refreshStatus);
      for (const [event, listener] of listeners) {
        socket.off(event, listener);
      }
    };
  }, [restaurantId]);

  useEffect(() => {
    joinedRoomRef.current = null;
  }, [restaurantId]);

  return { status, lastSyncAt };
}
