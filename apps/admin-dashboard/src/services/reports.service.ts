import type { CreateReportExportJobInput, ReportExportJobDTO } from '@repo/shared-types';
import { http } from '@/lib/http';

export async function listReports(restaurantId: string) {
  const { data } = await http.get<ReportExportJobDTO[]>('/reports');
  return data;
}

export async function createReport(input: CreateReportExportJobInput) {
  const { data } = await http.post<ReportExportJobDTO>('/reports', input);
  return data;
}
