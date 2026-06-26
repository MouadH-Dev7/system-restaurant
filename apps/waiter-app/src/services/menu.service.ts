import type { MenuDTO, MenuItemDTO } from '@repo/shared-types';
import { http } from '@/lib/http';

export async function listMenus(restaurantId: string) {
  const { data } = await http.get<MenuDTO[]>('/menus');

  return data.filter((menu) => menu.active);
}

export async function listMenuItems(restaurantId: string, menuId?: string) {
  const { data } = await http.get<MenuItemDTO[]>('/menu-items', {
    params: {
      ...(menuId ? { menuId } : {}),
      availableOnly: 'true',
      activeMenusOnly: 'true',
    },
  });

  return data;
}
