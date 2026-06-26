import type { OrderContextDTO } from '@/types/order';

function appendContext(path: string, context?: OrderContextDTO | null) {
  if (!context) {
    return path;
  }

  const params = new URLSearchParams();
  params.set('restaurantId', context.restaurantId);
  if (context.tableId) {
    params.set('tableId', context.tableId);
  }

  return `${path}?${params.toString()}`;
}

export const routes = {
  home: '/',
  menus: (context?: OrderContextDTO | null) => appendContext('/menus', context),
  menuItems: (menuId: string, context?: OrderContextDTO | null) => {
    const base = appendContext('/menus', context);
    const separator = base.includes('?') ? '&' : '?';
    return `${base}${separator}menuId=${menuId}`;
  },
  cart: (context?: OrderContextDTO | null) => {
    const base = appendContext('/menus', context);
    const separator = base.includes('?') ? '&' : '?';
    return `${base}${separator}panel=cart`;
  },
  checkout: (context?: OrderContextDTO | null) => {
    const base = appendContext('/menus', context);
    const separator = base.includes('?') ? '&' : '?';
    return `${base}${separator}panel=checkout`;
  },
  orderConfirmation: (orderId: string, context?: OrderContextDTO | null) => {
    const params = new URLSearchParams({ orderId });
    if (context) {
      params.set('restaurantId', context.restaurantId);
      if (context.tableId) {
        params.set('tableId', context.tableId);
      }
    }
    return `/order-confirmation?${params.toString()}`;
  },
};
