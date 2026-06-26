'use client';

import { useEffect } from 'react';
import { listRestaurantTables } from '@/services/tables.service';
import { usePosDataStore } from '@/store/pos-data.store';

export async function refreshPosTables(restaurantId: string) {
  const tables = await listRestaurantTables(restaurantId);
  usePosDataStore.getState().setTables(tables);
  return tables;
}

/** Poll and refresh tables when admin adds new ones. */
export function usePosTableSync(enabled = true, restaurantId?: string) {
  useEffect(() => {
    if (!enabled || !restaurantId) {
      return;
    }

    const activeRestaurantId = restaurantId;
    async function pull() {
      try {
        await refreshPosTables(activeRestaurantId);
      } catch {
        // ignore transient errors
      }
    }

    void pull();

    const interval = window.setInterval(() => void pull(), 12_000);
    const onFocus = () => void pull();

    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onFocus);

    return () => {
      window.clearInterval(interval);
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onFocus);
    };
  }, [enabled, restaurantId]);
}
