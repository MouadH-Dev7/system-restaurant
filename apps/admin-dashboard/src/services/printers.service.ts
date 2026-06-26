import type {
  CreatePrinterConfigInput,
  PrinterConfigDTO,
  PrintJobDTO,
  UpdatePrinterConfigInput,
} from '@repo/shared-types';
import { http } from '@/lib/http';

export async function listPrinters(restaurantId: string) {
  const { data } = await http.get<PrinterConfigDTO[]>('/printers');
  return data;
}

export async function listPrinterHistory(restaurantId: string) {
  const { data } = await http.get<PrintJobDTO[]>('/printers/history');
  return data;
}

export async function createPrinter(input: CreatePrinterConfigInput) {
  const { data } = await http.post<PrinterConfigDTO>('/printers', input);
  return data;
}

export async function updatePrinter(printerId: string, input: UpdatePrinterConfigInput) {
  const { data } = await http.patch<PrinterConfigDTO>(`/printers/${printerId}`, input);
  return data;
}

export async function testPrinter(printerName?: string) {
  const { data } = await http.post<PrintJobDTO>('/printers/test', undefined, {
    params: { printerName },
  });
  return data;
}
