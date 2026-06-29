import type { ModifierOptionDTO } from '@repo/shared-types';
import type { MenuItem } from '@/types/menu';
import type { CartItemDTO, CartLine, CreateOrderInput, OrderContextDTO } from '@/types/order';

export function sameContext(
  draft: CreateOrderInput | null,
  context: OrderContextDTO,
): draft is CreateOrderInput {
  return draft?.restaurantId === context.restaurantId && draft.tableId === context.tableId;
}

export function normalizeIds(ids?: string[]) {
  return [...new Set((ids ?? []).filter(Boolean))].sort();
}

export function buildLineKey(item: Pick<CartItemDTO, 'menuItemId' | 'notes' | 'modifierOptionIds'>) {
  return JSON.stringify({
    menuItemId: item.menuItemId,
    notes: item.notes?.trim() ?? '',
    modifierOptionIds: normalizeIds(item.modifierOptionIds),
  });
}

export function calculateLineModifiers(menuItem: MenuItem, modifierOptionIds?: string[]) {
  const selectedIds = new Set(modifierOptionIds ?? []);
  const selectedModifiers: ModifierOptionDTO[] = [];

  for (const group of menuItem.modifierGroups ?? []) {
    for (const option of group.options) {
      if (selectedIds.has(option.id)) {
        selectedModifiers.push(option);
      }
    }
  }

  return selectedModifiers;
}

export function getDraftItems(draft: CreateOrderInput | null, context: OrderContextDTO | null) {
  if (!draft || !context || !sameContext(draft, context)) {
    return [];
  }

  return draft.items;
}

export function getCartTotal(lines: CartLine[]) {
  return lines.reduce((sum, line) => sum + line.lineTotal, 0);
}

export function getCartLines(items: CartItemDTO[], menuItems: MenuItem[]) {
  const menuItemsById = Object.fromEntries(menuItems.map((item) => [item.id, item]));

  return items.flatMap((item) => {
    const menuItem = menuItemsById[item.menuItemId];
    if (!menuItem) {
      return [];
    }

    const selectedModifiers = calculateLineModifiers(menuItem, item.modifierOptionIds);
    const unitPrice =
      menuItem.price + selectedModifiers.reduce((sum, option) => sum + option.priceDelta, 0);

    return [
      {
        ...item,
        cartLineId: item.cartLineId ?? item.menuItemId,
        modifierOptionIds: normalizeIds(item.modifierOptionIds),
        menuItem,
        selectedModifiers,
        lineTotal: unitPrice * item.quantity,
      } satisfies CartLine,
    ];
  });
}
