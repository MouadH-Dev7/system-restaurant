'use client';

import { useMemo, useState } from 'react';
import { CheckCircle2, CreditCard, Landmark, PencilLine, Smartphone, Wallet } from 'lucide-react';
import { usePosOrderActions } from '@/hooks/use-pos-order-actions';
import { computeOrderTotal } from '@/hooks/use-pos-selectors';
import { formatMoney } from '@/lib/format';
import {
  formatCountLabel,
  formatGuestLabel,
  formatTableLabel,
  getLocalizedPaymentMethods,
  getLocalizedPaymentMethod,
  posT,
} from '@/lib/i18n';
import { isWalkInOrder } from '@/lib/mappers/order.mapper';
import { usePosDataStore } from '@/store/pos-data.store';
import { usePosUiStore } from '@/store/pos-ui.store';
import type { ReceiptBundle } from '@/types/pos';

function buildCheckoutBundle(
  orders: ReturnType<typeof usePosDataStore.getState>['orders'],
  checkoutTarget: ReturnType<typeof usePosUiStore.getState>['checkoutTarget'],
  language: ReturnType<typeof usePosUiStore.getState>['language'],
): ReceiptBundle | null {
  if (!checkoutTarget) {
    return null;
  }

  const selectedOrders =
    checkoutTarget.type === 'table'
      ? orders.filter(
          (order) =>
            order.tableId === checkoutTarget.tableId &&
            order.status !== 'PAID' &&
            order.status !== 'CANCELLED',
        )
      : orders.filter((order) => order.id === checkoutTarget.orderId);

  if (!selectedOrders.length) {
    return null;
  }

  const firstOrder = selectedOrders[0];
  const t = posT(language);
  return {
    mode: checkoutTarget.type === 'table' ? 'table' : 'single',
    orderIds: selectedOrders.map((order) => order.id),
    tableLabel: formatTableLabel(
      firstOrder?.table?.number,
      language,
      firstOrder ? isWalkInOrder(firstOrder) : true,
    ),
    guestLabel:
      checkoutTarget.type === 'table'
        ? formatCountLabel(selectedOrders.length, t.ticket, t.tickets, language)
        : formatGuestLabel(
            firstOrder?.guestSessionId,
            firstOrder?.dailyOrderNumber,
            language,
            firstOrder ? isWalkInOrder(firstOrder) : false,
          ),
    itemCount: selectedOrders.reduce((sum, order) => sum + order.items.length, 0),
    total: selectedOrders.reduce((sum, order) => sum + order.remainingAmount, 0),
    orders: selectedOrders,
  };
}

export function CheckoutScreen() {
  const [processing, setProcessing] = useState(false);
  const language = usePosUiStore((state) => state.language);
  const selectOrder = usePosUiStore((state) => state.selectOrder);
  const setActiveScreen = usePosUiStore((state) => state.setActiveScreen);
  const selectedPaymentMethodId = usePosUiStore((state) => state.selectedPaymentMethod);
  const checkoutTarget = usePosUiStore((state) => state.checkoutTarget);
  const selectPaymentMethod = usePosUiStore((state) => state.selectPaymentMethod);
  const orders = usePosDataStore((state) => state.orders);
  const tableBillings = usePosDataStore((state) => state.tableBillings);
  const { collectPayment } = usePosOrderActions();
  const paymentMethods = getLocalizedPaymentMethods(language);
  const selectedPaymentMethod = getLocalizedPaymentMethod(language, selectedPaymentMethodId);
  const bundle = useMemo(
    () => buildCheckoutBundle(orders, checkoutTarget, language),
    [checkoutTarget, language, orders],
  );
  const tableBilling =
    checkoutTarget?.type === 'table' ? tableBillings[checkoutTarget.tableId] : undefined;
  const checkoutTotal = tableBilling?.summary.remainingAmount ?? bundle?.total ?? 0;
  const totals = computeOrderTotal(checkoutTotal);
  const t = posT(language);

  async function handleConfirmPayment() {
    if (!checkoutTarget) {
      return;
    }

    setProcessing(true);
    try {
      await collectPayment(checkoutTarget);
    } finally {
      setProcessing(false);
    }
  }

  if (!bundle || !checkoutTarget) {
    return (
      <div className="rounded-[28px] border border-dashed border-slate-200 bg-white/80 p-10 text-center text-slate-500">
        {t.selectTicketBeforeCheckout}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div className="rounded-[28px] border border-white/70 bg-white/80 p-6 text-center">
        <p className="text-sm text-slate-500">
          {bundle.mode === 'table'
            ? t.groupedTableCheckout
            : `${t.ticket} #${bundle.orders[0]?.displayOrderId ?? bundle.orders[0]?.dailyOrderNumber ?? ''}`}
        </p>
        <h2 className="mt-2 text-2xl font-bold">{bundle.tableLabel}</h2>
        <p className="mt-1 text-slate-500">{bundle.guestLabel}</p>
        <p className="mt-2 text-sm text-slate-500">
          {bundle.itemCount} {t.items} -{' '}
          {formatCountLabel(bundle.orderIds.length, t.order, t.ordersCount, language)}
        </p>
        <p className="mt-6 text-5xl font-bold text-[#a73308]">{formatMoney(totals.total)}</p>
        {tableBilling ? (
          <p className="mt-3 text-sm text-slate-500">
            Paid {formatMoney(tableBilling.summary.paidAmount)} - Remaining{' '}
            {formatMoney(tableBilling.summary.remainingAmount)}
          </p>
        ) : null}
      </div>

      <section className="rounded-[32px] border border-white/70 bg-white/80 p-6">
        <h3 className="text-xl font-bold">{t.includedTickets}</h3>
        <div className="mt-4 space-y-3">
          {bundle.orders.map((order) => (
            <div
              key={order.id}
              className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm"
            >
              <div>
                <p className="font-bold text-slate-900">#{order.displayOrderId ?? order.dailyOrderNumber}</p>
                <p className="mt-1 text-slate-500">
                  {order.items.length} {t.items} -{' '}
                  {formatGuestLabel(order.guestSessionId, order.displayOrderId ?? order.dailyOrderNumber, language)}
                </p>
              </div>
              <div className="flex items-center gap-3">
                {order.status === 'PENDING' || order.status === 'DELIVERED' ? (
                  <button
                    type="button"
                    onClick={() => {
                      selectOrder(order.id);
                      setActiveScreen('order-detail');
                    }}
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700"
                  >
                    <PencilLine size={14} />
                    {t.edit}
                  </button>
                ) : null}
                <span className="font-bold text-slate-900">{formatMoney(order.remainingAmount)}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-[32px] border border-white/70 bg-white/80 p-6">
        <h3 className="text-xl font-bold">{t.paymentMethod}</h3>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {paymentMethods.map((method) => {
            const active = method.id === selectedPaymentMethodId;
            const Icon =
              method.id === 'card'
                ? CreditCard
                : method.id === 'bank-transfer'
                  ? Landmark
                  : method.id === 'mobile-payment'
                    ? Smartphone
                    : Wallet;
            return (
              <button
                key={method.id}
                type="button"
                onClick={() => selectPaymentMethod(method.id)}
                className={[
                  'flex items-center gap-3 rounded-[24px] border p-5 text-left transition',
                  active
                    ? 'border-[#cf6d43] bg-[#fff0e8] text-[#8d3c19]'
                    : 'border-slate-200 bg-slate-50 text-slate-700',
                ].join(' ')}
              >
                <Icon size={22} />
                <div>
                  <p className="font-bold">{method.label}</p>
                  <p className="mt-1 text-sm opacity-80">{method.hint}</p>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      <button
        type="button"
        disabled={processing}
        onClick={() => void handleConfirmPayment()}
        className="flex h-16 w-full items-center justify-center gap-3 rounded-2xl bg-[#a73308] text-lg font-bold text-white disabled:opacity-50"
      >
        <CheckCircle2 size={20} />
        {processing ? t.processing : `${t.pay} ${selectedPaymentMethod?.label ?? t.payNow}`}
      </button>
    </div>
  );
}
