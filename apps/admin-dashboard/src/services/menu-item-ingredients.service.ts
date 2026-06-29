import type {
  CreateMenuItemIngredientInput,
  MenuItemIngredientDTO,
  UpdateMenuItemIngredientInput,
} from '@repo/shared-types';
import { http } from '@/lib/http';

export async function listMenuItemIngredients(menuItemId: string) {
  const { data } = await http.get<MenuItemIngredientDTO[]>('/menu-item-ingredients', {
    params: { menuItemId },
  });
  return data;
}

export async function createMenuItemIngredient(input: CreateMenuItemIngredientInput) {
  const { data } = await http.post<MenuItemIngredientDTO>('/menu-item-ingredients', input);
  return data;
}

export async function updateMenuItemIngredient(
  id: string,
  input: UpdateMenuItemIngredientInput,
) {
  const { data } = await http.patch<MenuItemIngredientDTO>(`/menu-item-ingredients/${id}`, input);
  return data;
}

export async function deleteMenuItemIngredient(id: string) {
  await http.delete(`/menu-item-ingredients/${id}`);
}
