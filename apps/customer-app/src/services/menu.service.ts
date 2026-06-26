import type { Menu, MenuItem } from '@/types/menu';
import { http } from '@/lib/http';

export async function getMenus(restaurantId: string) {
  const { data } = await http.get<Menu[]>('/public/menus', {
    params: { restaurantId },
  });
  return data;
}

export async function getMenuItems(restaurantId: string, menuId?: string) {
  const { data } = await http.get<MenuItem[]>('/public/menu-items', {
    params: {
      restaurantId,
      ...(menuId ? { menuId } : {}),
      availableOnly: 'true',
      activeMenusOnly: 'true',
    },
  });
  return data;
}
