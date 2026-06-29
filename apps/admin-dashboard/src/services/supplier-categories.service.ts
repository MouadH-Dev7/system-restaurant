import type {
  CreateSupplierCategoryInput,
  SupplierCategoryDTO,
  UpdateSupplierCategoryInput,
} from '@repo/shared-types';
import { http } from '@/lib/http';

export async function listSupplierCategories(restaurantId: string) {
  const { data } = await http.get<SupplierCategoryDTO[]>('/supplier-categories');
  return data;
}

export async function createSupplierCategory(input: CreateSupplierCategoryInput) {
  const { data } = await http.post<SupplierCategoryDTO>('/supplier-categories', input);
  return data;
}

export async function deleteSupplierCategory(categoryId: string) {
  await http.delete(`/supplier-categories/${categoryId}`);
}
