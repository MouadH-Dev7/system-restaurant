'use client';

import { useEffect, useState } from 'react';
import { getMenuItems } from '@/services/menu.service';
import type { MenuItem } from '@/types/menu';
import type { OrderContextDTO } from '@/types/order';

export function useMenuItems(context: OrderContextDTO | null, menuId?: string) {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!context) {
      setItems([]);
      return;
    }

    const orderContext = context;
    const controller = new AbortController();
    let active = true;

    async function loadMenuItems() {
      try {
        const nextItems = await getMenuItems(orderContext.restaurantId, menuId, controller.signal);
        if (active) {
          setItems(nextItems);
          setFailed(false);
        }
      } catch {
        if (active) {
          setFailed(true);
        }
      }
    }

    void loadMenuItems();

    return () => {
      active = false;
      controller.abort();
    };
  }, [context, menuId]);

  return { items, failed };
}
