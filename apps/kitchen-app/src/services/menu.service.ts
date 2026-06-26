import type { MenuDTO, MenuItemDTO, ModifierOptionDTO } from '@repo/shared-types';
import { http } from '@/lib/http';

export async function listMenus(restaurantId: string) {
  const { data } = await http.get<MenuDTO[]>('/menus');
  return data;
}

export async function listMenuItems(restaurantId: string) {
  const { data } = await http.get<MenuItemDTO[]>('/menu-items');
  return data;
}

export async function updateKitchenMenuItemAvailability(menuItemId: string, available: boolean) {
  const { data } = await http.patch<MenuItemDTO>(`/menu-items/${menuItemId}`, {
    available,
  });
  return data;
}

export async function updateKitchenModifierOptionAvailability(
  modifierOptionId: string,
  available: boolean,
) {
  const { data } = await http.patch<ModifierOptionDTO>(`/modifier-options/${modifierOptionId}`, {
    available,
  });
  return data;
}
