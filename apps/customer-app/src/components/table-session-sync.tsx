'use client';

import { useEffect } from 'react';
import { loadPersistedCart, loadPersistedEditingInfo } from '@/lib/persist-cart';
import { useGuestOrders } from '@/hooks/use-guest-orders';
import { useCartStore } from '@/store/cart.store';
import type { OrderContextDTO } from '@/types/order';

type TableSessionSyncProps = {
  context: OrderContextDTO | null;
};

export function TableSessionSync({ context }: TableSessionSyncProps) {
  useGuestOrders(context);
  const hydrate = useCartStore((state) => state.hydrate);
  const draft = useCartStore((state) => state.draft);
  const editingOrderId = useCartStore((state) => state.editingOrderId);

  useEffect(() => {
    if (!context) {
      return;
    }

    const saved = loadPersistedCart(context);
    const savedEditingInfo = loadPersistedEditingInfo(context);
    if ((saved?.items.length || savedEditingInfo) && !draft && !editingOrderId) {
      hydrate(
        saved ?? { restaurantId: context.restaurantId, tableId: context.tableId, items: [] },
        savedEditingInfo,
      );
    }
  }, [context, draft, editingOrderId, hydrate]);

  return null;
}
