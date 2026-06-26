import type {
  CreateModifierGroupInput,
  CreateModifierOptionInput,
  CreateMenuInput,
  CreateMenuItemInput,
  MenuItemDTO,
  MenuDTO,
  ModifierGroupDTO,
  ModifierOptionDTO,
  UpdateModifierGroupInput,
  UpdateModifierOptionInput,
  UpdateMenuInput,
  UpdateMenuItemInput,
} from '@repo/shared-types';
import { http } from '@/lib/http';

export async function listMenus(restaurantId: string) {
  const { data } = await http.get<MenuDTO[]>('/menus');
  return data;
}

export async function listMenuItems(restaurantId: string, menuId?: string) {
  const { data } = await http.get<MenuItemDTO[]>('/menu-items', {
    params: menuId ? { menuId } : undefined,
  });
  return data;
}

export async function createMenu(input: CreateMenuInput) {
  const { data } = await http.post<MenuDTO>('/menus', input);
  return data;
}

export async function updateMenu(menuId: string, input: UpdateMenuInput) {
  const { data } = await http.patch<MenuDTO>(`/menus/${menuId}`, input);
  return data;
}

export async function archiveMenu(menuId: string, restaurantId: string) {
  const { data } = await http.delete<MenuDTO>(`/menus/${menuId}`);
  return data;
}

export async function createMenuItem(input: CreateMenuItemInput) {
  const { data } = await http.post<MenuItemDTO>('/menu-items', input);
  return data;
}

export async function updateMenuItem(menuItemId: string, input: UpdateMenuItemInput) {
  const { data } = await http.patch<MenuItemDTO>(`/menu-items/${menuItemId}`, input);
  return data;
}

export async function archiveMenuItem(menuItemId: string, restaurantId: string) {
  const { data } = await http.delete<MenuItemDTO>(`/menu-items/${menuItemId}`);
  return data;
}

export async function createModifierGroup(input: CreateModifierGroupInput) {
  const { data } = await http.post<ModifierGroupDTO>('/modifier-groups', input);
  return data;
}

export async function updateModifierGroup(modifierGroupId: string, input: UpdateModifierGroupInput) {
  const { data } = await http.patch<ModifierGroupDTO>(`/modifier-groups/${modifierGroupId}`, input);
  return data;
}

export async function deleteModifierGroup(modifierGroupId: string, restaurantId: string) {
  const { data } = await http.delete<ModifierGroupDTO>(`/modifier-groups/${modifierGroupId}`);
  return data;
}

export async function createModifierOption(input: CreateModifierOptionInput) {
  const { data } = await http.post<ModifierOptionDTO>('/modifier-options', input);
  return data;
}

export async function updateModifierOption(modifierOptionId: string, input: UpdateModifierOptionInput) {
  const { data } = await http.patch<ModifierOptionDTO>(`/modifier-options/${modifierOptionId}`, input);
  return data;
}

export async function archiveModifierOption(modifierOptionId: string, restaurantId: string) {
  const { data } = await http.delete<ModifierOptionDTO>(`/modifier-options/${modifierOptionId}`);
  return data;
}
