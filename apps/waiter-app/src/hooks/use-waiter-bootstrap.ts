'use client';

import { useCallback, useEffect } from 'react';
import {
  REALTIME_EVENTS,
  type RealtimeEvent,
  type TableOrdersGroupDTO,
  type WaiterCallPayload,
  type WaiterNotificationRealtimePayload,
} from '@repo/shared-types';
import { useWaiterSocket } from '@/hooks/use-waiter-socket';
import { getApiErrorMessage } from '@/lib/api-error';
import { playWaiterAlert, unlockWaiterAudio } from '@/lib/play-waiter-alert';
import { replaceTemplate, waiterT } from '@/lib/i18n';
import { listMenuItems, listMenus } from '@/services/menu.service';
import { listWaiterOrders } from '@/services/orders.service';
import { listRestaurantTables } from '@/services/tables.service';
import { listWaiterNotifications } from '@/services/waiter-notifications.service';
import { useWaiterStore } from '@/store/waiter.store';

const WAITER_BOOTSTRAP_ERROR = 'Unable to load waiter app';

type UseWaiterBootstrapOptions = {
  enabled: boolean;
  restaurantId?: string;
  reloadKey?: number;
};

async function loadRequiredResource<T>(label: string, loader: () => Promise<T>) {
  try {
    return await loader();
  } catch (error) {
    const message = getApiErrorMessage(error);
    throw new Error(`${WAITER_BOOTSTRAP_ERROR}: ${label} (${message})`);
  }
}

async function loadOptionalResource<T>(loader: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await loader();
  } catch {
    return fallback;
  }
}

export function useWaiterBootstrap({ enabled, restaurantId, reloadKey }: UseWaiterBootstrapOptions) {
  const setInitialData = useWaiterStore((state) => state.setInitialData);
  const setLoading = useWaiterStore((state) => state.setLoading);
  const setError = useWaiterStore((state) => state.setError);
  const setLastSyncAt = useWaiterStore((state) => state.setLastSyncAt);
  const upsertOrder = useWaiterStore((state) => state.upsertOrder);
  const clearDraft = useWaiterStore((state) => state.clearDraft);
  const setWaiterNotifications = useWaiterStore((state) => state.setWaiterNotifications);
  const upsertWaiterNotification = useWaiterStore((state) => state.upsertWaiterNotification);
  const setSocketStatus = useWaiterStore((state) => state.setSocketStatus);
  const language = useWaiterStore((state) => state.language);
  const selectTable = useWaiterStore((state) => state.selectTable);
  const tables = useWaiterStore((state) => state.tables);

  useEffect(() => {
    const unlock = () => unlockWaiterAudio();
    window.addEventListener('click', unlock, { once: true });
    return () => window.removeEventListener('click', unlock);
  }, []);

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
        const [nextTables, menus, groupedOrders, waiterNotifications, menuItems] = await Promise.all([
          loadRequiredResource('tables', () => listRestaurantTables(activeRestaurantId)),
          loadRequiredResource('menus', () => listMenus(activeRestaurantId)),
          loadOptionalResource(() => listWaiterOrders(activeRestaurantId, 'table'), [] as TableOrdersGroupDTO[]),
          loadOptionalResource(() => listWaiterNotifications(), []),
          loadOptionalResource(() => listMenuItems(activeRestaurantId), []),
        ]);

        if (!active) {
          return;
        }

        const tableGroups = groupedOrders as TableOrdersGroupDTO[];
        const orders = tableGroups.flatMap((group) => group.orders);
        setInitialData({
          tables: nextTables,
          menus,
          menuItems,
          orders,
          tableOrderGroups: tableGroups,
          waiterNotifications,
        });
        setWaiterNotifications(waiterNotifications);
        setLastSyncAt(new Date());
      } catch (error) {
        if (active) {
          setError(error instanceof Error ? error.message : 'Failed to load waiter data');
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
    reloadKey,
    setError,
    setInitialData,
    setLastSyncAt,
    setLoading,
    setWaiterNotifications,
  ]);

  const handleOrderEvent = useCallback(
    (event: RealtimeEvent, order: Parameters<typeof upsertOrder>[0]) => {
      upsertOrder(order);

      if (order.status === 'PAID' || order.status === 'CANCELLED') {
        clearDraft(order.tableId);
      }

      if (event === REALTIME_EVENTS.ORDER_READY) {
        playWaiterAlert();
        const copy = waiterT(language);
        const table = tables.find((entry) => entry.id === order.tableId);
        if (table) {
          selectTable(table.id);
          window.alert(
            replaceTemplate(copy.orderReadyTable, {
              ticket: order.displayOrderId ?? order.dailyOrderNumber,
              table: table.number,
            }),
          );
        }
      }

      setLastSyncAt(new Date());
    },
    [clearDraft, language, selectTable, setLastSyncAt, tables, upsertOrder],
  );

  const handleWaiterCall = useCallback(
    (payload: WaiterCallPayload) => {
      playWaiterAlert();
      const copy = waiterT(language);
      selectTable(payload.tableId);
      window.alert(
        replaceTemplate(copy.waiterCalledTable, {
          table: payload.tableNumber,
        }),
      );
      setLastSyncAt(new Date());
    },
    [language, selectTable, setLastSyncAt],
  );

  const handleNotificationCreated = useCallback(
    ({ notification }: WaiterNotificationRealtimePayload) => {
      upsertWaiterNotification(notification);
      playWaiterAlert();
      if (notification.tableId) {
        selectTable(notification.tableId);
      }
      setLastSyncAt(new Date());
    },
    [selectTable, setLastSyncAt, upsertWaiterNotification],
  );

  const handleNotificationUpdated = useCallback(
    ({ notification }: WaiterNotificationRealtimePayload) => {
      upsertWaiterNotification(notification);
      setLastSyncAt(new Date());
    },
    [setLastSyncAt, upsertWaiterNotification],
  );

  const { status: socketStatus } = useWaiterSocket({
    restaurantId,
    onOrderEvent: handleOrderEvent,
    onWaiterCall: handleWaiterCall,
    onNotificationCreated: handleNotificationCreated,
    onNotificationAccepted: handleNotificationUpdated,
    onNotificationResolved: handleNotificationUpdated,
  });

  useEffect(() => {
    if (enabled && restaurantId) {
      setSocketStatus(socketStatus);
    }
  }, [enabled, restaurantId, setSocketStatus, socketStatus]);
}
