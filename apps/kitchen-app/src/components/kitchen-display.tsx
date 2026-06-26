'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { REALTIME_EVENTS } from '@repo/shared-types';
import type { OrderResponse, RealtimeEvent } from '@repo/shared-types';
import { useAuthStore } from '@/auth/store';
import { KdsTableGroup } from '@/components/kds-table-group';
import { KitchenShell } from '@/components/kitchen-shell';
import { useKitchenSocket } from '@/hooks/use-kitchen-socket';
import { groupOrdersByTable } from '@/lib/group-orders-by-table';
import {
  kitchenT,
  localizeMenuItemName,
  localizeOrderTypeLabel,
} from '@/lib/i18n';
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

  useEffect(() => {
    if (!restaurantId) {
      return;
    }

    const activeRestaurantId = restaurantId;
    let active = true;

    async function loadOrders() {
      const [nextOrders, settings] = await Promise.all([
        listRestaurantOrders(activeRestaurantId),
        getKitchenSettings().catch(() => null),
      ]);
      if (active) {
        setOrders(nextOrders);
        setKitchenPrintingEnabled(settings?.kitchenPrintingEnabled ?? true);
      }
    }

    void loadOrders();
    return () => {
      active = false;
    };
  }, [restaurantId, setOrders]);

  useEffect(() => {
    const unlock = () => unlockKitchenAudio();
    window.addEventListener('click', unlock, { once: true });
    return () => window.removeEventListener('click', unlock);
  }, []);

  const handleOrderEvent = useCallback(
    (event: RealtimeEvent, order: OrderResponse) => {
      if (event === REALTIME_EVENTS.ORDER_CREATED) {
        playNewOrderAlert();
        const items = order.items
          .map((item) => {
            const name = item.menuItem
              ? localizeMenuItemName(item.menuItem, language)
              : t.itemFallback;
            return `${item.quantity}x ${name}`;
          })
          .join(' • ');

        setAlertBanner({
          id: order.id,
          label: `${localizeOrderTypeLabel(order, language)}`,
          items,
        });

        window.setTimeout(() => {
          setAlertBanner((current) => (current?.id === order.id ? null : current));
        }, 12_000);
      }

      setHighlightOrderId(order.id);
      window.setTimeout(() => {
        setHighlightOrderId((current) => (current === order.id ? null : current));
      }, 12000);

      upsertOrder(order);
    },
    [language, t.itemFallback, upsertOrder],
  );

  const { status, lastSyncAt } = useKitchenSocket({
    restaurantId,
    onOrderEvent: handleOrderEvent,
  });

  useEffect(() => {
    setMounted(true);
    setNow(new Date());
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  async function changeStatus(orderId: string, statusValue: OrderResponse['status']) {
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
  }

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

      <div className="flex h-full min-w-[1200px] gap-6">
        <section className="flex min-w-[360px] max-w-[420px] flex-1 flex-col">
          <div className="mb-4 flex items-center justify-between rounded-lg border-l-4 border-primary-container bg-primary-container/5 p-3">
            <div className="flex items-center gap-3">
              <h2 className="text-sm font-black uppercase tracking-[0.2em] text-primary-container">
                {t.pending}
              </h2>
              <span className="rounded bg-primary-container px-2 py-0.5 text-[11px] font-black text-on-primary-container">
                {String(pending.length).padStart(2, '0')}
              </span>
            </div>
          </div>
          <div className="flex-1 space-y-4 overflow-y-auto pr-2">
            {pendingGroups.map((group) => (
              <KdsTableGroup
                key={group.tableId}
                group={group}
                accent="pending"
                actionLabel={t.startPreparing}
                actionClassName="bg-primary-container text-on-primary-container"
                highlightOrderId={highlightOrderId ?? alertBanner?.id ?? null}
                onAction={(orderId) => void changeStatus(orderId, 'PREPARING')}
              />
            ))}
          </div>
        </section>

        <section className="flex min-w-[360px] max-w-[420px] flex-1 flex-col">
          <div className="mb-4 flex items-center justify-between rounded-lg border-l-4 border-secondary-container bg-secondary-container/5 p-3">
            <div className="flex items-center gap-3">
              <h2 className="text-sm font-black uppercase tracking-[0.2em] text-secondary-container">
                {t.preparing}
              </h2>
              <span className="rounded bg-secondary-container px-2 py-0.5 text-[11px] font-black text-white">
                {String(preparing.length).padStart(2, '0')}
              </span>
            </div>
          </div>
          <div className="flex-1 space-y-4 overflow-y-auto pr-2">
            {preparingGroups.map((group) => (
              <KdsTableGroup
                key={group.tableId}
                group={group}
                accent="preparing"
                actionLabel={t.markReady}
                actionClassName="bg-secondary-container text-white"
                highlightOrderId={highlightOrderId}
                onAction={(orderId) => void changeStatus(orderId, 'READY')}
              />
            ))}
          </div>
        </section>

        <section className="flex min-w-[360px] max-w-[420px] flex-1 flex-col">
          <div className="mb-4 flex items-center justify-between rounded-lg border-l-4 border-tertiary-container bg-tertiary-container/5 p-3">
            <div className="flex items-center gap-3">
              <h2 className="text-sm font-black uppercase tracking-[0.2em] text-tertiary-container">
                {t.ready}
              </h2>
              <span className="rounded bg-tertiary-container px-2 py-0.5 text-[11px] font-black text-white">
                {String(ready.length).padStart(2, '0')}
              </span>
            </div>
          </div>
          <div className="flex-1 space-y-4 overflow-y-auto pr-2">
            {readyGroups.map((group) => (
              <KdsTableGroup
                key={group.tableId}
                group={group}
                accent="ready"
                actionLabel={t.completeOrder}
                actionClassName="bg-tertiary-container text-white"
                dimmed
                highlightOrderId={highlightOrderId}
                onAction={(orderId) => void changeStatus(orderId, 'DELIVERED')}
              />
            ))}
          </div>
        </section>
      </div>
    </KitchenShell>
  );
}
