import { http } from '@/lib/http';

export type SystemHealthResponse = {
  status: 'online' | 'warning';
  checkedAt: string;
  uptimeSeconds: number;
  api: {
    status: 'online';
    latencyMs: number;
    memoryMb: number;
    heapUsedMb: number;
  };
  database: {
    status: 'online' | 'offline';
  };
  redis: {
    status: 'online' | 'offline';
  };
  realtime: {
    status: 'online';
    connectedClients: number;
  };
};

export async function getSystemHealth() {
  const { data } = await http.get<SystemHealthResponse>('/system/health');
  return data;
}
