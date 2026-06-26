'use client';

import { useCallback, useEffect } from 'react';
import type { RealtimeEvent } from '@repo/shared-types';
import { usePosSocket } from '@/hooks/use-pos-socket';
import { listMenuItems } from '@/services/menu.service';
import { listPosOrders } from '@/services/orders.service';
import { getSettings } from '@/services/settings.service';
import { getTableBilling, listRestaurantTables } from '@/services/tables.service';
import { usePosDataStore } from '@/store/pos-data.store';
import { usePosUiStore } from '@/store/pos-ui.store';

type UsePosBootstrapOptions = {
  enabled: boolean;
  restaurantId?: string;
};

export function usePosBootstrap({ enabled, restaurantId }: UsePosBootstrapOptions) {
  const setOrders = usePosDataStore((state) => state.setOrders);
  const setTables = usePosDataStore((state) => state.setTables);
  const setMenuItems = usePosDataStore((state) => state.setMenuItems);
  const setTableBilling = usePosDataStore((state) => state.setTableBilling);
  const setSettings = usePosDataStore((state) => state.setSettings);
  const upsertOrder = usePosDataStore((state) => state.upsertOrder);
  const setLoading = usePosDataStore((state) => state.setLoading);
  const setError = usePosDataStore((state) => state.setError);
  const setLastSyncAt = usePosDataStore((state) => state.setLastSyncAt);
  const setSocketStatus = usePosDataStore((state) => state.setSocketStatus);

  useEffect(() => {
    if (!enabled || !restaurantId) {
      setLoading(false);
      return;
    }

    const activeRestaurantId = restaurantId;
    let active = true;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const [orders, tables, settings] = await Promise.all([
          listPosOrders(activeRestaurantId),
          listRestaurantTables(activeRestaurantId),
          getSettings(),
        ]);

        if (!active) {
          return;
        }

        setOrders(orders);
        setTables(tables);
        setSettings(settings);
        setLastSyncAt(new Date());

        void listMenuItems(activeRestaurantId)
          .then((items) => {
            if (active) {
              setMenuItems(items);
            }
          })
          .catch(() => undefined);

        const { selectedOrderId, selectedTableId, selectOrder, selectTable } =
          usePosUiStore.getState();

        if (!selectedOrderId && orders[0]) {
          selectOrder(orders[0].id);
        }

        if (!selectedTableId && tables[0]) {
          selectTable(tables[0].id);
        }

        const initialTableId = selectedTableId || tables[0]?.id;
        if (initialTableId) {
          const billing = await getTableBilling(initialTableId);
          if (active) {
            setTableBilling(billing);
          }
        }
      } catch (error) {
        if (active) {
          setError(error instanceof Error ? error.message : 'Failed to load POS data');
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
  }, [
    enabled,
    restaurantId,
    setError,
    setLastSyncAt,
    setLoading,
    setOrders,
    setMenuItems,
    setSettings,
    setTableBilling,
    setTables,
  ]);

  const handleOrderEvent = useCallback(
    (event: RealtimeEvent, order: Parameters<typeof upsertOrder>[0]) => {
      upsertOrder(order);
      setLastSyncAt(new Date());

      if (!order.tableId) {
        return;
      }

      const activeTableId = usePosUiStore.getState().selectedTableId;
      const shouldRefreshBilling =
        activeTableId === order.tableId ||
        event === 'ORDER_CANCELLED' ||
        event === 'ORDER_PAID' ||
        event === 'ORDER_DELIVERED';

      if (!shouldRefreshBilling) {
        return;
      }

      void getTableBilling(order.tableId)
        .then((billing) => {
          setTableBilling(billing);
        })
        .catch(() => undefined);
    },
    [setLastSyncAt, setTableBilling, upsertOrder],
  );

  const { status: socketStatus } = usePosSocket({
    restaurantId,
    onOrderEvent: handleOrderEvent,
  });

  useEffect(() => {
    if (enabled && restaurantId) {
      setSocketStatus(socketStatus);
    }
  }, [enabled, restaurantId, setSocketStatus, socketStatus]);

  return { socketStatus };
}
