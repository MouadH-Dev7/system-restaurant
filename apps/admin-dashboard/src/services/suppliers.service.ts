import type {
  CreateSupplierInput,
  SupplierDTO,
  UpdateSupplierInput,
} from '@repo/shared-types';
import { http } from '@/lib/http';

export async function listSuppliers(restaurantId: string) {
  const { data } = await http.get<SupplierDTO[]>('/suppliers');
  return data;
}

export async function createSupplier(input: CreateSupplierInput) {
  const { data } = await http.post<SupplierDTO>('/suppliers', input);
  return data;
}

export async function updateSupplier(supplierId: string, input: UpdateSupplierInput) {
  const { data } = await http.patch<SupplierDTO>(`/suppliers/${supplierId}`, input);
  return data;
}

export async function deleteSupplier(supplierId: string) {
  await http.delete(`/suppliers/${supplierId}`);
}
