'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Save } from 'lucide-react';
import type { CartItemDTO, MenuItemDTO } from '@repo/shared-types';
import { useAuthStore } from '@/auth/store';
import { PosMenuFlow } from '@/components/pos/pos-menu-flow';
import { usePosOrderActions } from '@/hooks/use-pos-order-actions';
import { getApiErrorMessage } from '@/lib/api-error';
import { findTicket, usePosOrdersView } from '@/hooks/use-pos-selectors';
import { FinancialSummary, OrderItemList } from '@/components/pos-shared';
import { localizeMenuItemName, localizeModifierName, posT } from '@/lib/i18n';
import { listMenuItems } from '@/services/menu.service';
import { updateOrderStatus } from '@/services/orders.service';
import { getOrderById, usePosDataStore } from '@/store/pos-data.store';
import { usePosUiStore } from '@/store/pos-ui.store';

function resolveReasonBySource(
  source: ReturnType<typeof usePosUiStore.getState>['orderEditSource'],
  t: ReturnType<typeof posT>,
) {
  if (source === 'history') {
    return t.defaultEditReason;
  }

  if (source === 'checkout') {
    return t.defaultCheckoutEditReason;
  }

  if (source === 'tables') {
    return t.defaultTableEditReason;
  }

  return t.defaultBoardEditReason;
}

export function OrderDetailScreen() {
  const restaurantId = useAuthStore((state) => state.session?.user.restaurantId);
  const selectedOrderId = usePosUiStore((state) => state.selectedOrderId);
  const language = usePosUiStore((state) => state.language);
  const setActiveScreen = usePosUiStore((state) => state.setActiveScreen);
  const orderEditReason = usePosUiStore((state) => state.orderEditReason);
  const orderEditSource = usePosUiStore((state) => state.orderEditSource);
  const setOrderEditReason = usePosUiStore((state) => state.setOrderEditReason);
  const orders = usePosDataStore((state) => state.orders);
  const selectedOrderSnapshot = usePosDataStore((state) => state.selectedOrderSnapshot);
  const cachedMenuItems = usePosDataStore((state) => state.menuItems);
  const tickets = usePosOrdersView();
  const ticket = findTicket(tickets, selectedOrderId);
  const order =
    getOrderById(orders, selectedOrderId) ??
    (selectedOrderSnapshot?.id === selectedOrderId ? selectedOrderSnapshot : null);
  const { openCheckout, saveOrderItems } = usePosOrderActions();
  const t = posT(language);

  const [menuItems, setMenuItems] = useState<MenuItemDTO[]>([]);
  const [draftItems, setDraftItems] = useState<CartItemDTO[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showMenuFlow, setShowMenuFlow] = useState(false);

  useEffect(() => {
    if (cachedMenuItems.length > 0) {
      setMenuItems(cachedMenuItems);
    }
  }, [cachedMenuItems]);

  useEffect(() => {
    if (!restaurantId) {
      return;
    }

    void listMenuItems(restaurantId)
      .then(setMenuItems)
      .catch((err) => console.error('[OrderDetailScreen] Failed to load menu items:', err));
  }, [restaurantId]);

  useEffect(() => {
    if (!order) {
      setDraftItems([]);
      return;
    }

    setDraftItems(
      (order.items ?? []).map((item) => ({
        cartLineId: item.id,
        menuItemId: item.menuItemId,
        quantity: item.quantity,
        ...(item.modifiers?.length
          ? {
              modifierOptionIds: item.modifiers
                .map((modifier) => modifier.modifierOptionId)
                .filter((value): value is string => Boolean(value)),
            }
          : {}),
        ...(item.notes ? { notes: item.notes } : {}),
      })),
    );
  }, [order]);

  useEffect(() => {
    if (orderEditReason.trim()) {
      return;
    }

    setOrderEditReason(resolveReasonBySource(orderEditSource, t));
  }, [orderEditReason, orderEditSource, setOrderEditReason, t]);

  const lines = useMemo(() => {
    if (!order) {
      return [];
    }

    const menuById = Object.fromEntries(menuItems.map((item) => [item.id, item]));

    return draftItems.flatMap((item) => {
      const menuItem =
        menuById[item.menuItemId] ??
        (order.items ?? []).find((line) => line.id === item.cartLineId)?.menuItem ??
        (order.items ?? []).find((line) => line.menuItemId === item.menuItemId)?.menuItem;

      if (!menuItem) {
        return [];
      }

      const sourceLine =
        (order.items ?? []).find((line) => line.id === item.cartLineId) ??
        (order.items ?? []).find((line) => line.menuItemId === item.menuItemId);
      const unitPrice = sourceLine?.price ?? menuItem.price;
      const modifiers =
        sourceLine?.modifiers?.map((modifier) => localizeModifierName(modifier, language)) ?? [];

      return [
        {
          id: item.cartLineId ?? item.menuItemId,
          name: localizeMenuItemName(menuItem, language),
          quantity: item.quantity,
          unitPrice,
          total: unitPrice * item.quantity,
          modifiers,
        },
      ];
    });
  }, [draftItems, language, menuItems, order]);

  const draftTotal = lines.reduce((sum, line) => sum + line.total, 0);

  const updateQuantity = useCallback((lineId: string, delta: number) => {
    setDraftItems((current) =>
      current
        .map((item) =>
          (item.cartLineId ?? item.menuItemId) === lineId
            ? { ...item, quantity: item.quantity + delta }
            : item,
        )
        .filter((item) => item.quantity > 0),
    );
  }, []);

  async function handleSave(nextItems = draftItems) {
    if (!order) {
      return;
    }

    if (nextItems.length === 0) {
      setError('Order must contain at least one item. Add an item or keep one line before saving.');
      return;
    }

    const reason = orderEditReason.trim();
    if (!reason) {
      setError(t.editReasonRequired);
      return;
    }

    setSaving(true);
    setError(null);

    try {
      await saveOrderItems(order.id, nextItems, order.version, reason, orderEditSource);
    } catch (nextError) {
      setError(getApiErrorMessage(nextError, t.couldNotSave));
    } finally {
      setSaving(false);
    }
  }

  async function handleCancelOrder() {
    if (!order) {
      return;
    }

    const reason = orderEditReason.trim() || t.cancelOrderDefaultReason;
    if (!reason) {
      setError(t.cancelOrderReason);
      return;
    }

    setSaving(true);
    setError(null);

    try {
      await updateOrderStatus(order.id, 'CANCELLED', reason);
      setActiveScreen('orders');
    } catch (nextError) {
      setError(getApiErrorMessage(nextError, t.couldNotCancel));
    } finally {
      setSaving(false);
    }
  }

  if (!order) {
    return (
      <div className="rounded-[28px] border border-dashed border-slate-200 bg-white/80 p-10 text-center text-slate-500">
        {t.selectToEdit}
      </div>
    );
  }

  const orderHeaderLabel = ticket?.displayId ?? order.displayOrderId ?? String(order.dailyOrderNumber);
  const orderHeaderTable =
    ticket?.table ?? (order.table?.number ? `${t.table} ${order.table.number}` : t.walkInTakeaway);
  const orderHeaderGuest = ticket?.guestName ?? (order.guestSessionId ?? t.guest);
  const canEdit = orderEditSource === 'history' || order.status === 'PENDING' || order.status === 'DELIVERED';
  const canPay = orderEditSource !== 'history';
  const canCancel = order.status === 'PENDING' || order.status === 'DELIVERED';

  if (showMenuFlow && canEdit) {
    return (
      <PosMenuFlow
        title={`${t.addItemsTitle} - #${orderHeaderLabel}`}
        subtitle={`${orderHeaderTable} - ${orderHeaderGuest}`}
        submitLabel={t.addToTicket}
        initialItems={draftItems}
        onCancel={() => setShowMenuFlow(false)}
        onSubmit={async (items) => {
          setShowMenuFlow(false);
          setDraftItems(items);
          await handleSave(items);
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between rounded-[28px] border border-white/70 bg-white/80 p-5">
        <div>
          <h2 className="text-2xl font-bold">
            {t.ticket} #{orderHeaderLabel}
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            {orderHeaderTable} - {orderHeaderGuest}
          </p>
        </div>
        <div className="flex gap-3">
          {canEdit ? (
            <>
              <button
                type="button"
                onClick={() => setShowMenuFlow(true)}
                className="rounded-full border border-slate-200 bg-white px-5 py-2 text-sm font-semibold text-slate-700"
              >
                {t.addFromMenu}
              </button>
              <button
                type="button"
                disabled={saving || draftItems.length === 0 || !orderEditReason.trim()}
                onClick={() => void handleSave()}
                className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-2 text-sm font-semibold text-slate-700 disabled:opacity-50"
              >
                <Save size={16} />
                {saving ? t.saving : t.save}
              </button>
            </>
          ) : null}
          {canCancel ? (
            <button
              type="button"
              disabled={saving || !orderEditReason.trim()}
              onClick={() => void handleCancelOrder()}
              className="rounded-full border border-rose-200 bg-rose-50 px-5 py-2 text-sm font-semibold text-rose-700 disabled:opacity-50"
            >
              {saving ? t.cancelling : t.cancelOrder}
            </button>
          ) : null}
          {canPay ? (
            <button
              type="button"
              onClick={() => openCheckout({ type: 'order', orderId: order.id })}
              className="rounded-full bg-[#a73308] px-5 py-2 text-sm font-semibold text-white"
            >
              {t.pay}
            </button>
          ) : null}
        </div>
      </div>

      {error ? (
        <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
      ) : null}

      {!canEdit ? (
        <p className="rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Cashier can edit this order only before kitchen preparation starts or during payment.
        </p>
      ) : null}

      {canEdit ? (
        <section className="rounded-[28px] border border-white/70 bg-white/80 p-5">
          <h3 className="text-lg font-bold text-slate-950">{t.enterEditReason}</h3>
          <p className="mt-1 text-sm text-slate-500">
            {canCancel ? t.cancelOrderHelper : t.editReasonHelper}
          </p>
          <textarea
            value={orderEditReason}
            onChange={(event) => setOrderEditReason(event.target.value)}
            placeholder={canCancel ? t.cancelOrderReason : t.enterEditReason}
            rows={3}
            className="mt-4 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#a73308]"
          />
        </section>
      ) : null}

      <section className="rounded-[32px] border border-white/70 bg-white/80 p-6">
        <h3 className="text-lg font-bold">{t.orderItems}</h3>
        <div className="mt-4 space-y-4">
          <OrderItemList
            variant="card"
            items={lines}
            canEdit={canEdit}
            onQuantityChange={updateQuantity}
            unitPriceLabel={t.each}
            emptyMessage={t.noItemsYet}
          />
        </div>

        <FinancialSummary variant="total-line" label={t.total} amount={draftTotal} />
      </section>

      <button
        type="button"
        onClick={() => setActiveScreen('orders')}
        className="text-sm font-semibold text-[#a73308]"
      >
        {language === 'ar' ? '←' : '→'} {t.backToBoard}
      </button>
    </div>
  );
}
