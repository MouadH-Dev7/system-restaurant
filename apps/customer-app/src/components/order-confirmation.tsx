'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChefHat, ConciergeBell, Pencil, Plus, Utensils, Wifi, WifiOff } from 'lucide-react';
import { AppHeader } from '@/components/app-header';
import { TableSessionSync } from '@/components/table-session-sync';
import { getApiErrorStatus } from '@/lib/api-error';
import { getOrCreateGuestSessionId } from '@/lib/guest-session';
import { useOrderTrackingSocket } from '@/hooks/use-order-tracking-socket';
import { localizeName, t } from '@/lib/i18n';
import { formatMoney } from '@/lib/money';
import {
  getOrderProgress,
  getStatusHeadline,
  getStatusLabel,
  isStepActive,
} from '@/lib/order-status';
import { routes } from '@/lib/routes';
import { cancelCustomerOrder, getOrderById } from '@/services/order.service';
import { callWaiter } from '@/services/table.service';
import { useAppStore } from '@/store/app.store';
import { useCartStore } from '@/store/cart.store';
import { useGuestOrdersStore } from '@/store/guest-orders.store';
import { useLanguageStore } from '@/store/language.store';
import type { OrderContextDTO, OrderResponse } from '@/types/order';

type OrderConfirmationProps = {
  orderId: string | null;
  initialContext: OrderContextDTO | null;
};

function formatModifierLabel(
  modifier: NonNullable<OrderResponse['items'][number]['modifiers']>[number],
  language: ReturnType<typeof useLanguageStore.getState>['language'],
) {
  const group = localizeName(
    {
      name: modifier.groupName,
      nameEn: modifier.groupNameEn,
      nameFr: modifier.groupNameFr,
      nameAr: modifier.groupNameAr,
    },
    language,
  );
  const option = localizeName(
    {
      optionName: modifier.optionName,
      optionNameEn: modifier.optionNameEn,
      optionNameFr: modifier.optionNameFr,
      optionNameAr: modifier.optionNameAr,
    },
    language,
  );

  return group ? `${group}: ${option}` : option;
}

export function OrderConfirmation({ orderId, initialContext }: OrderConfirmationProps) {
  const router = useRouter();
  const language = useLanguageStore((state) => state.language);
  const storedContext = useAppStore((state) => state.context);
  const waiterComingMessage = useAppStore((state) => state.waiterComingMessage);
  const setWaiterComingMessage = useAppStore((state) => state.setWaiterComingMessage);
  const startEditingOrder = useCartStore((state) => state.startEditingOrder);
  const copy = t(language);
  const context = initialContext ?? storedContext;
  const [order, setOrder] = useState<OrderResponse | null>(null);
  const [failed, setFailed] = useState(false);
  const [justUpdated, setJustUpdated] = useState(false);
  const [callingWaiter, setCallingWaiter] = useState(false);
  const [cancellingOrder, setCancellingOrder] = useState(false);
  const waiterFeedbackTimeoutRef = useRef<number | null>(null);
  const activeTableOrders = useGuestOrdersStore((state) => state.orders);

  const handleEditOrder = () => {
    if (order && context) {
      startEditingOrder(order, context);
      router.push(routes.menus(context));
    }
  };

  const showTransientMessage = useCallback((_message: string) => {
    setJustUpdated(true);
    setFailed(false);
    window.clearTimeout(waiterFeedbackTimeoutRef.current ?? undefined);
    waiterFeedbackTimeoutRef.current = window.setTimeout(() => {
      setJustUpdated(false);
      waiterFeedbackTimeoutRef.current = null;
    }, 2400);
  }, []);

  const handleOrderUpdate = useCallback((nextOrder: OrderResponse) => {
    useGuestOrdersStore.getState().upsertOrder(nextOrder);
    setOrder((current) => {
      if (current?.status && current.status !== nextOrder.status) {
        setJustUpdated(true);
        window.setTimeout(() => setJustUpdated(false), 1800);
      }
      return nextOrder;
    });
    setFailed(false);
  }, []);

  useEffect(() => {
    return () => {
      window.clearTimeout(waiterFeedbackTimeoutRef.current ?? undefined);
    };
  }, []);

  async function handleCallWaiter() {
    if (!context || callingWaiter) {
      return;
    }

    setCallingWaiter(true);
    try {
      await callWaiter(context);
      setWaiterComingMessage(copy.waiterCalled);
      showTransientMessage(copy.statusUpdated);
    } catch (error) {
      const status = getApiErrorStatus(error);
      if (status === 409) {
        setWaiterComingMessage(copy.waiterCallAlreadyOpen);
      }
    } finally {
      setCallingWaiter(false);
    }
  }

  async function handleCancelOrder() {
    if (!context || !order || cancellingOrder) {
      return;
    }

    if (order.status !== 'PENDING' || order.source !== 'CUSTOMER') {
      return;
    }

    setCancellingOrder(true);
    try {
      const updated = await cancelCustomerOrder(
        order.id,
        context,
        getOrCreateGuestSessionId(context),
      );
      useGuestOrdersStore.getState().upsertOrder(updated);
      setOrder(updated);
      showTransientMessage(copy.orderCancelled);
    } catch {
      showTransientMessage(copy.cancelOrderFailed);
    } finally {
      setCancellingOrder(false);
    }
  }

  const { status: socketStatus } = useOrderTrackingSocket({
    context,
    orderId,
    onOrderUpdate: handleOrderUpdate,
    onWaiterAccepted: ({ notification }) => {
      if (context && notification.tableId === context.tableId && notification.type === 'CALL_WAITER') {
        setWaiterComingMessage(copy.waiterComing);
      }
    },
    onWaiterResolved: ({ notification }) => {
      if (context && notification.tableId === context.tableId && notification.type === 'CALL_WAITER') {
        setWaiterComingMessage(null);
      }
    },
  });

  useEffect(() => {
    if (!orderId || !context) {
      setFailed(true);
      return;
    }

    const currentOrderId = orderId;
    const orderContext = context;
    let active = true;

    async function loadOrder() {
      try {
        const nextOrder = await getOrderById(currentOrderId, orderContext);
        if (active) {
          setOrder(nextOrder);
          setFailed(false);
        }
      } catch {
        if (active) {
          setFailed(true);
        }
      }
    }

    void loadOrder();

    return () => {
      active = false;
    };
  }, [context, orderId]);

  const progress = getOrderProgress(order?.status);
  const headline = getStatusHeadline(order?.status, language);
  const statusLabel = getStatusLabel(order?.status, language);
  const otherTableOrders = activeTableOrders.filter((item) => item.id !== order?.id);
  const steps = [
    { key: 'pending' as const, label: copy.stepPending, icon: Plus },
    { key: 'preparing' as const, label: copy.stepPreparing, icon: ChefHat },
    { key: 'ready' as const, label: copy.stepReady, icon: Utensils },
    { key: 'delivered' as const, label: copy.stepDelivered, icon: ConciergeBell },
  ];

  return (
    <div className="min-h-screen bg-[#f8f3ec] pb-36">
      <TableSessionSync context={context} />
      <AppHeader />

      <main className="mx-auto flex w-full max-w-2xl flex-col px-5 py-10">
        <section className="rounded-[28px] border border-[#e1cdb5] bg-white p-8 text-center shadow-[0_20px_60px_rgba(70,47,26,0.08)]">
          <p className="text-sm font-bold text-[#8a7764]">
            {order
              ? `${copy.orderLabel} #${order.dailyOrderNumber}`
              : failed
                ? copy.orderLoadFailed
                : copy.connecting}
          </p>
          <h1
            className={`mt-3 text-4xl font-black text-[#1f1b17] transition duration-300 ${
              justUpdated ? 'scale-[1.02] text-[#b26f2f]' : ''
            }`}
          >
            {headline}
          </h1>
          <p className="mt-3 text-[#6b5c4f]">{copy.successHint}</p>

          {order ? (
            <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-[#e7d7c3] bg-[#faf4ec] px-4 py-2 text-sm font-bold text-[#7f5a2e]">
              <span className="h-2 w-2 rounded-full bg-current" />
              {statusLabel}
            </div>
          ) : null}

          <p className="mt-4 flex items-center justify-center gap-2 text-xs font-semibold text-[#7d6d5f]">
            {socketStatus === 'connected' ? (
              <>
                <Wifi className="h-4 w-4 text-[#b26f2f]" aria-hidden="true" />
                {copy.liveTracking}
              </>
            ) : (
              <>
                <WifiOff className="h-4 w-4" aria-hidden="true" />
                {socketStatus === 'connecting' ? copy.connecting : copy.reconnecting}
              </>
            )}
          </p>
          {waiterComingMessage ? (
            <div className="mt-4 rounded-full border border-[#d8c9b2] bg-[#faf4ec] px-4 py-2 text-sm font-bold text-[#8b622e]">
              {waiterComingMessage}
            </div>
          ) : null}
        </section>

        <section className="mt-8 rounded-[28px] border border-[#e1cdb5] bg-white p-6 shadow-[0_20px_60px_rgba(70,47,26,0.08)]">
          <div className="relative mb-8 px-2">
            <div className="absolute left-6 right-6 top-5 h-1 rounded-full bg-[#efe4d7]" />
            <div
              className="absolute left-6 top-5 h-1 rounded-full bg-[#b26f2f] transition-all duration-500"
              style={{ width: `calc((100% - 3rem) * ${progress / 100})` }}
            />
            <div className="relative z-10 grid grid-cols-4 gap-2">
              {steps.map((step) => {
                const active = isStepActive(order?.status, step.key);
                return (
                  <div key={step.key} className="flex flex-col items-center gap-2 text-center">
                    <span
                      className={`grid h-10 w-10 place-items-center rounded-full ${
                        active ? 'bg-[#b26f2f] text-white' : 'bg-[#efe4d7] text-[#9e8c7a]'
                      }`}
                    >
                      <step.icon className="h-4 w-4" aria-hidden="true" />
                    </span>
                    <span className="text-xs font-bold text-[#6b5c4f]">{step.label}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <h2 className="mb-4 text-xl font-black text-[#1f1b17]">{copy.orderDetails}</h2>

          {order ? (
            <div className="space-y-3">
              {order.items.map((line) => (
                <div
                  key={line.id ?? line.menuItemId}
                  className="flex justify-between gap-4 rounded-[20px] border border-[#f0e6da] bg-[#fffdfa] p-4 text-sm"
                >
                  <div className="text-[#5b4c40]">
                    <p className="font-semibold">
                      {line.quantity} x{' '}
                      {line.menuItem ? localizeName(line.menuItem, language) : line.menuItemId}
                    </p>
                    {line.modifiers?.length ? (
                      <p className="mt-1 text-xs text-[#8b7b6d]">
                        {line.modifiers.map((modifier) => formatModifierLabel(modifier, language)).join(' | ')}
                      </p>
                    ) : null}
                    {line.notes ? <p className="mt-1 text-xs text-[#8b7b6d]">{line.notes}</p> : null}
                  </div>
                  <span className="font-bold text-[#2d241d]">{formatMoney(line.price * line.quantity)}</span>
                </div>
              ))}

              <div className="space-y-2 border-t border-[#efe4d7] pt-4 text-sm font-bold text-[#1f1b17]">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>{formatMoney(order.subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Discounts</span>
                  <span>{formatMoney(order.discountTotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tax</span>
                  <span>{formatMoney(order.taxTotal)}</span>
                </div>
                <div className="flex justify-between text-lg">
                  <span>{copy.total}</span>
                  <span className="text-[#b26f2f]">{formatMoney(order.grandTotal)}</span>
                </div>
                <div className="flex justify-between text-xs text-[#7d6d5f]">
                  <span>Paid</span>
                  <span>{formatMoney(order.paidAmount)}</span>
                </div>
                <div className="flex justify-between text-xs text-[#7d6d5f]">
                  <span>Remaining</span>
                  <span>{formatMoney(order.remainingAmount)}</span>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-sm text-[#7d6d5f]">
              {failed ? copy.orderLoadFailed : copy.connecting}
            </p>
          )}
        </section>

        {otherTableOrders.length ? (
          <section className="mt-8 rounded-[28px] border border-[#e1cdb5] bg-white p-6 shadow-[0_20px_60px_rgba(70,47,26,0.08)]">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-black text-[#1f1b17]">{copy.myOrders}</h2>
                <p className="mt-1 text-sm text-[#6b5c4f]">{copy.myOrdersHint}</p>
              </div>
              <span className="rounded-full bg-[#faf4ec] px-3 py-1 text-xs font-bold text-[#8a7764]">
                {otherTableOrders.length}
              </span>
            </div>

            <div className="space-y-3">
              {otherTableOrders.map((tableOrder) => (
                <Link
                  key={tableOrder.id}
                  href={routes.orderConfirmation(tableOrder.id, context)}
                  className="block rounded-[20px] border border-[#f0e6da] bg-[#fffdfa] p-4 transition hover:border-[#d8c2a6]"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-semibold text-[#1f1b17]">
                        {copy.orderLabel} #{tableOrder.dailyOrderNumber}
                      </p>
                      <p className="mt-1 text-xs text-[#8b7b6d]">
                        {getStatusLabel(tableOrder.status, language)}
                      </p>
                    </div>
                    <span className="font-bold text-[#b26f2f]">{formatMoney(tableOrder.grandTotal)}</span>
                  </div>

                  <div className="mt-3 space-y-2">
                    {tableOrder.items.slice(0, 3).map((line) => (
                      <div key={line.id} className="text-sm text-[#5b4c40]">
                        <p className="font-medium">
                          {line.quantity} x{' '}
                          {line.menuItem ? localizeName(line.menuItem, language) : line.menuItemId}
                        </p>
                        {line.modifiers?.length ? (
                          <p className="mt-1 text-xs text-[#8b7b6d]">
                            {line.modifiers
                              .map((modifier) => formatModifierLabel(modifier, language))
                              .join(' | ')}
                          </p>
                        ) : null}
                      </div>
                    ))}
                    {tableOrder.items.length > 3 ? (
                      <p className="text-xs font-semibold text-[#8b7b6d]">
                        +{tableOrder.items.length - 3} more items
                      </p>
                    ) : null}
                  </div>
                </Link>
              ))}
            </div>
          </section>
        ) : null}
      </main>

      <div className="fixed bottom-0 left-0 z-50 flex w-full flex-col gap-3 border-t border-[#e4d3bf] bg-white/92 px-5 py-5 backdrop-blur">
        {order && order.status === 'PENDING' && order.source === 'CUSTOMER' ? (
          <>
            <button
              type="button"
              onClick={handleEditOrder}
              className="flex h-12 items-center justify-center gap-2 rounded-full bg-[#b26f2f] hover:bg-[#9c5f25] text-lg font-black text-white transition shadow-sm"
            >
              <Pencil className="h-5 w-5" aria-hidden="true" />
              {copy.editOrder}
            </button>
            <button
              type="button"
              onClick={() => void handleCancelOrder()}
              disabled={cancellingOrder}
              className="flex h-12 items-center justify-center gap-2 rounded-full border border-rose-200 bg-rose-50 font-bold text-rose-700"
            >
              <Plus className="h-5 w-5 rotate-45" aria-hidden="true" />
              {cancellingOrder ? copy.cancellingOrder : copy.cancelOrder}
            </button>
          </>
        ) : (
          <Link
            href={routes.menus(context)}
            className="flex h-12 items-center justify-center gap-2 rounded-full bg-[#b26f2f] text-lg font-black text-white"
          >
            <Plus className="h-5 w-5" aria-hidden="true" />
            {copy.addMore}
          </Link>
        )}
        <button
          type="button"
          onClick={() => void handleCallWaiter()}
          disabled={callingWaiter || !context}
          className="flex h-12 items-center justify-center gap-2 rounded-full border border-[#e4d3bf] font-bold text-[#5b4c40]"
        >
          <ConciergeBell className="h-5 w-5" aria-hidden="true" />
          {callingWaiter ? copy.connecting : copy.callWaiter}
        </button>
      </div>
    </div>
  );
}
