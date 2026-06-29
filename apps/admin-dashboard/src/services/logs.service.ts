import type { AuditLogDTO, PaginatedResponse } from '@repo/shared-types';
import { http } from '@/lib/http';

export type ListLogsParams = {
  role?: string;
  module?: string;
  status?: string;
  userName?: string;
  action?: string;
  staffCode?: string;
  orderNumber?: number;
  from?: string;
  to?: string;
  page?: number;
  limit?: number;
};

export async function listLogs(
  restaurantId: string,
  params?: ListLogsParams,
): Promise<PaginatedResponse<AuditLogDTO>> {
  const { data } = await http.get<PaginatedResponse<AuditLogDTO>>('/logs', {
    params: { ...params, restaurantId },
  });
  return data;
}

export async function listLogUsers(restaurantId: string): Promise<string[]> {
  const { data } = await http.get<string[]>('/logs/users', {
    params: { restaurantId },
  });
  return data;
}
