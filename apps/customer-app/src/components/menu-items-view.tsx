'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { useEffect, useState } from 'react';
import { ActiveOrdersPanel } from '@/components/active-orders-panel';
import { AppHeader } from '@/components/app-header';
import { BottomCartBar } from '@/components/bottom-cart-bar';
import { TableSessionSync } from '@/components/table-session-sync';
import { MenuItemCard } from '@/components/menu-item-card';
import { getMenuItems, getMenus } from '@/services/menu.service';
import { localize, t } from '@/lib/i18n';
import { routes } from '@/lib/routes';
import { useAppStore } from '@/store/app.store';
import { useLanguageStore } from '@/store/language.store';
import type { Menu, MenuItem } from '@/types/menu';
import type { OrderContextDTO } from '@/types/order';

type MenuItemsViewProps = {
  menuId: string;
  initialContext: OrderContextDTO | null;
};

export function MenuItemsView({ menuId, initialContext }: MenuItemsViewProps) {
  const language = useLanguageStore((state) => state.language);
  const storedContext = useAppStore((state) => state.context);
  const setOrderContext = useAppStore((state) => state.setOrderContext);
  const copy = t(language);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [menu, setMenu] = useState<Menu | null>(null);
  const [failed, setFailed] = useState(false);
  const context = initialContext ?? storedContext;

  useEffect(() => {
    if (!context) {
      return;
    }

    const orderContext = context;
    setOrderContext(orderContext);
    let active = true;

    async function load() {
      try {
        const [menus, nextItems] = await Promise.all([
          getMenus(orderContext.restaurantId),
          getMenuItems(orderContext.restaurantId, menuId),
        ]);
        if (active) {
          setMenu(menus.find((entry) => entry.id === menuId) ?? null);
          setItems(nextItems);
          setFailed(false);
        }
      } catch {
        if (active) {
          setFailed(true);
        }
      }
    }

    void load();

    return () => {
      active = false;
    };
  }, [context, menuId, setOrderContext]);

  return (
    <div className="min-h-screen bg-[#f9f9f9] pb-28">
      <TableSessionSync context={context} />
      <AppHeader />
      <main className="mx-auto max-w-6xl px-5 py-8 md:px-8">
        {context ? <ActiveOrdersPanel context={context} /> : null}
        {context ? (
          <Link
            href={routes.menus(context)}
            className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-[#5b4039] hover:text-[#ff5722]"
          >
            <ArrowRight className="h-4 w-4 rotate-180 rtl:rotate-0" aria-hidden="true" />
            {copy.backToMenus}
          </Link>
        ) : null}

        <header className="mb-8">
          <h1 className="mb-2 text-4xl font-black text-[#1a1c1c] md:text-5xl">
            {menu ? localize(menu.name) : copy.menusTitle}
          </h1>
          <p className="text-lg text-[#5b4039]">
            {context
              ? menu?.description
                ? localize(menu.description)
                : copy.itemsHint
              : 'Table context is required.'}
          </p>
        </header>

        {context ? (
          <section className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {items.filter((item) => item.available).map((item) => (
              <MenuItemCard key={item.id} item={item} context={context} />
            ))}
          </section>
        ) : null}
        {failed ? (
          <p className="mt-6 text-sm text-[#6f6f6f]">Menu items could not be loaded.</p>
        ) : null}
        {context && !failed && items.filter((item) => item.available).length === 0 ? (
          <p className="mt-6 text-sm text-[#6f6f6f]">{copy.noMenuItems}</p>
        ) : null}
      </main>
      <BottomCartBar context={context} />
    </div>
  );
}
