'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { REALTIME_EVENTS } from '@repo/shared-types';
import type { OrderResponse, RealtimeEvent, RealtimeOrderDelta } from '@repo/shared-types';
import { useAuthStore } from '@/auth/store';
import { KdsOrderGrid } from '@/components/kitchen-sections';
import { KitchenShell } from '@/components/kitchen-shell';
import { useKitchenSocket } from '@/hooks/use-kitchen-socket';
import { groupOrdersByTable } from '@/lib/group-orders-by-table';
import { kitchenT } from '@/lib/i18n';
import { playNewOrderAlert, unlockKitchenAudio } from '@/lib/play-kitchen-alert';
import { listRestaurantOrders, updateOrderStatus } from '@/services/order.service';
import { getKitchenSettings, updateKitchenPrintingEnabled } from '@/services/settings.service';
import { useAppStore } from '@/store/app.store';
import { ordersByStatus, useKitchenStore } from '@/store/kitchen.store';

export function KitchenDisplay() {
  const restaurantId = useAuthStore((state) => state.session?.user.restaurantId);
  const language = useAppStore((state) => state.language);
  const t = kitchenT(language);
  const orders = useKitchenStore((state) => state.orders);
  const setOrders = useKitchenStore((state) => state.setOrders);
  const upsertOrder = useKitchenStore((state) => state.upsertOrder);

  const [mounted, setMounted] = useState(false);
  const [now, setNow] = useState<Date | null>(null);
  const [alertBanner, setAlertBanner] = useState<{
    id: string;
    label: string;
    items: string;
  } | null>(null);
  const [highlightOrderId, setHighlightOrderId] = useState<string | null>(null);
  const [kitchenPrintingEnabled, setKitchenPrintingEnabled] = useState(true);
  const [printingBusy, setPrintingBusy] = useState(false);

  const pending = useMemo(() => ordersByStatus(orders, 'PENDING'), [orders]);
  const preparing = useMemo(() => ordersByStatus(orders, 'PREPARING'), [orders]);
  const ready = useMemo(() => ordersByStatus(orders, 'READY'), [orders]);
  const pendingGroups = useMemo(() => groupOrdersByTable(pending), [pending]);
  const preparingGroups = useMemo(() => groupOrdersByTable(preparing), [preparing]);
  const readyGroups = useMemo(() => groupOrdersByTable(ready), [ready]);

  const reloadOrders = useCallback(async () => {
    if (!restaurantId) {
      return;
    }

    const [nextOrders, settings] = await Promise.all([
      listRestaurantOrders(restaurantId),
      getKitchenSettings().catch((err) => {
        console.error('[KitchenDisplay] Failed to load kitchen settings:', err);
        return null;
      }),
    ]);
    setOrders(nextOrders);
    setKitchenPrintingEnabled(settings?.kitchenPrintingEnabled ?? true);
  }, [restaurantId, setOrders]);

  useEffect(() => {
    void reloadOrders();
  }, [reloadOrders]);

  useEffect(() => {
    const unlock = () => unlockKitchenAudio();
    window.addEventListener('click', unlock, { once: true });
    return () => window.removeEventListener('click', unlock);
  }, []);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleOrderEvent = useCallback(
    (event: RealtimeEvent, delta: RealtimeOrderDelta) => {
      const orderId = delta.orderId;

      if (event === REALTIME_EVENTS.ORDER_CREATED) {
        playNewOrderAlert();
        setAlertBanner({
          id: orderId,
          label: t.newOrder,
          items: `#${orderId.slice(-6)}`,
        });
        window.setTimeout(() => {
          setAlertBanner((current) => (current?.id === orderId ? null : current));
        }, 12_000);
      }

      setHighlightOrderId(orderId);
      window.setTimeout(() => {
        setHighlightOrderId((current) => (current === orderId ? null : current));
      }, 12000);

      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        void reloadOrders();
      }, 100);
    },
    [language, reloadOrders, t.newOrder],
  );

  const { status, lastSyncAt } = useKitchenSocket({
    restaurantId,
    onOrderEvent: handleOrderEvent,
    onReconnect: reloadOrders,
  });

  useEffect(() => {
    setMounted(true);
    setNow(new Date());
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const changeStatus = useCallback(
    async (orderId: string, statusValue: OrderResponse['status']) => {
      try {
        const updated = await updateOrderStatus(orderId, statusValue);
        upsertOrder(updated);
      } catch {
        if (!restaurantId) {
          return;
        }

        const refreshed = await listRestaurantOrders(restaurantId);
        setOrders(refreshed);
      }
    },
    [restaurantId, upsertOrder, setOrders],
  );

  async function toggleKitchenPrinting() {
    setPrintingBusy(true);
    try {
      const updated = await updateKitchenPrintingEnabled(!kitchenPrintingEnabled);
      setKitchenPrintingEnabled(updated.kitchenPrintingEnabled);
    } finally {
      setPrintingBusy(false);
    }
  }

  return (
    <KitchenShell
      mounted={mounted}
      now={now}
      status={status}
      lastSyncAt={lastSyncAt}
      kitchenPrintingEnabled={kitchenPrintingEnabled}
      printingBusy={printingBusy}
      onToggleKitchenPrinting={() => void toggleKitchenPrinting()}
    >
      {alertBanner ? (
        <div className="mb-4 animate-pulse border-b-4 border-error bg-error/20 px-6 py-4 text-on-surface">
          <p className="text-2xl font-black uppercase tracking-wide">
            {alertBanner.label} - {t.newOrder}
          </p>
          <p className="mt-2 text-lg font-bold">{alertBanner.items}</p>
        </div>
      ) : null}

      <KdsOrderGrid
        pendingGroups={pendingGroups}
        preparingGroups={preparingGroups}
        readyGroups={readyGroups}
        highlightOrderId={highlightOrderId}
        alertBannerId={alertBanner?.id ?? null}
        t={t}
        onChangeStatus={changeStatus}
      />
    </KitchenShell>
  );
}
