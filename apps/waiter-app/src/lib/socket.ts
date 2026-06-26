import { io, type Socket } from 'socket.io-client';

let socket: Socket | null = null;

function resolveSocketUrl() {
  const configured = process.env.NEXT_PUBLIC_SOCKET_URL;

  if (typeof window === 'undefined') {
    return configured ?? 'http://localhost:4000';
  }

  if (configured && !configured.includes('localhost') && !configured.includes('127.0.0.1')) {
    return configured;
  }

  return `${window.location.protocol}//${window.location.hostname}:4000`;
}

export function getSocket() {
  if (!socket) {
    socket = io(resolveSocketUrl(), {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });
  }

  return socket;
}

export type SocketStatus = 'connected' | 'connecting' | 'disconnected';

export function getSocketStatus(socketClient: Socket): SocketStatus {
  if (socketClient.connected) {
    return 'connected';
  }

  return socketClient.active ? 'connecting' : 'disconnected';
}
