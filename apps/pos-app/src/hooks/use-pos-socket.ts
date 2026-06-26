'use client';

import { useEffect, useRef, useState } from 'react';
import { REALTIME_EVENTS, type OrderResponse, type RealtimeEvent } from '@repo/shared-types';
import { getSocket, getSocketStatus, type SocketStatus } from '@/lib/socket';

type UsePosSocketOptions = {
  restaurantId?: string;
  onOrderEvent: (event: RealtimeEvent, order: OrderResponse) => void;
};

const POS_EVENTS: RealtimeEvent[] = [
  REALTIME_EVENTS.ORDER_CREATED,
  REALTIME_EVENTS.ORDER_PREPARING,
  REALTIME_EVENTS.ORDER_READY,
  REALTIME_EVENTS.ORDER_DELIVERED,
  REALTIME_EVENTS.ORDER_PAID,
  REALTIME_EVENTS.ORDER_CANCELLED,
];

export function usePosSocket({ restaurantId, onOrderEvent }: UsePosSocketOptions) {
  const [status, setStatus] = useState<SocketStatus>('connecting');
  const onOrderEventRef = useRef(onOrderEvent);
  const joinedRoomRef = useRef<string | null>(null);

  onOrderEventRef.current = onOrderEvent;

  useEffect(() => {
    if (!restaurantId) {
      setStatus('disconnected');
      return;
    }

    const socket = getSocket();
    const roomKey = `pos:${restaurantId}`;

    const refreshStatus = () => setStatus(getSocketStatus(socket));

    const handleConnect = () => {
      refreshStatus();
      if (joinedRoomRef.current !== roomKey) {
        socket.emit('kitchen:join', { restaurantId });
        joinedRoomRef.current = roomKey;
      }
    };

    const handlers = POS_EVENTS.map(
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
    };
  }, [restaurantId]);

  useEffect(() => {
    joinedRoomRef.current = null;
  }, [restaurantId]);

  return { status };
}
