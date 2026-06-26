'use client';

import { useEffect, useState } from 'react';
import { getMenuItems, getMenus } from '@/services/menu.service';
import { useAppStore } from '@/store/app.store';
import type { Menu, MenuItem } from '@/types/menu';
import type { OrderContextDTO } from '@/types/order';
import { PremiumMenuExperience } from './premium-menu-experience';

type MenuSelectionProps = {
  initialContext: OrderContextDTO | null;
};

export function MenuSelection({ initialContext }: MenuSelectionProps) {
  const storedContext = useAppStore((state) => state.context);
  const setOrderContext = useAppStore((state) => state.setOrderContext);
  const context = initialContext ?? storedContext;
  const [menus, setMenus] = useState<Menu[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!context) {
      return;
    }

    const orderContext = context;
    setOrderContext(orderContext);
    let active = true;
    setLoading(true);
    setFailed(false);

    async function load() {
      try {
        const [nextMenus, nextItems] = await Promise.all([
          getMenus(orderContext.restaurantId),
          getMenuItems(orderContext.restaurantId),
        ]);

        if (!active) {
          return;
        }

        setMenus(nextMenus);
        setMenuItems(nextItems);
        setFailed(false);
      } catch {
        if (active) {
          setFailed(true);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void load();

    return () => {
      active = false;
    };
  }, [context, setOrderContext]);

  return (
    <PremiumMenuExperience
      initialContext={context}
      menus={menus}
      menuItems={menuItems}
      loading={loading}
      failed={failed}
    />
  );
}
