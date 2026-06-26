import type {
  AuditLogDTO,
  EmployeeRiskProfileDTO,
} from '@repo/shared-types';
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
};

export async function listLogs(restaurantId: string, params?: ListLogsParams) {
  const { data } = await http.get<AuditLogDTO[]>('/logs', { params });
  return data;
}

export async function getEmployeeRiskProfiles(restaurantId: string, params?: ListLogsParams) {
  const { data } = await http.get<EmployeeRiskProfileDTO[]>('/logs/employee-risk', {
    params,
  });
  return data;
}
