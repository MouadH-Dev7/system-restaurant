'use client';

import { useEffect, useMemo, useState } from 'react';
import { ChevronDown, ChevronUp, CreditCard, ReceiptText } from 'lucide-react';
import type { OrderResponse } from '@repo/shared-types';
import { usePosOrderActions } from '@/hooks/use-pos-order-actions';
import { formatMoney, formatTime } from '@/lib/format';
import {
  formatCountLabel,
  formatGuestLabel,
  formatTableLabel,
  localizeBackendPaymentMethod,
  localizeFinancialStatus,
  localizeUiStatus,
  posT,
} from '@/lib/i18n';
import { isWalkInOrder } from '@/lib/mappers/order.mapper';
import { getTableBilling } from '@/services/tables.service';
import { usePosDataStore } from '@/store/pos-data.store';
import { usePosUiStore } from '@/store/pos-ui.store';

function getBillingStatus(
  paidAmount: number,
  remainingAmount: number,
): 'PAID' | 'UNPAID' | 'PARTIALLY_PAID' {
  if (remainingAmount <= 0) {
    return 'PAID';
  }

  if (paidAmount > 0) {
    return 'PARTIALLY_PAID';
  }

  return 'UNPAID';
}

function countItems(orders: OrderResponse[]) {
  return orders.reduce((sum, order) => sum + order.items.reduce((lineSum, item) => lineSum + item.quantity, 0), 0);
}

function countGuests(orders: OrderResponse[]) {
  const guestKeys = new Set(
    orders
      .map((order) => order.guestSessionId)
      .filter((value): value is string => Boolean(value)),
  );
  return Math.max(guestKeys.size, orders.length ? 1 : 0);
}

export function TableBillingScreen() {
  const language = usePosUiStore((state) => state.language);
  const selectedTableId = usePosUiStore((state) => state.selectedTableId);
  const tableBillingMode = usePosUiStore((state) => state.tableBillingMode);
  const setTableBillingMode = usePosUiStore((state) => state.setTableBillingMode);
  const setTableBilling = usePosDataStore((state) => state.setTableBilling);
  const billing = usePosDataStore((state) =>
    selectedTableId ? state.tableBillings[selectedTableId] : undefined,
  );
  const [expandedOrders, setExpandedOrders] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);
  const t = posT(language);
  const { openCheckout } = usePosOrderActions();

  useEffect(() => {
    if (!selectedTableId) {
      return;
    }

    let active = true;
    setLoading(true);
    void getTableBilling(selectedTableId)
      .then((data) => {
        if (active) {
          setTableBilling(data);
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [selectedTableId, setTableBilling]);

  const summaryCards = useMemo(() => {
    if (!billing) {
      return [];
    }

    return [
      { label: 'Subtotal', value: formatMoney(billing.summary.subtotal) },
      { label: 'Discounts', value: formatMoney(billing.summary.discountTotal) },
      { label: 'Taxes', value: formatMoney(billing.summary.taxTotal) },
      { label: 'Grand Total', value: formatMoney(billing.summary.grandTotal) },
      { label: 'Paid Amount', value: formatMoney(billing.summary.paidAmount) },
      { label: 'Remaining Amount', value: formatMoney(billing.summary.remainingAmount) },
    ];
  }, [billing]);

  if (!selectedTableId) {
    return (
      <div className="rounded-[28px] border border-dashed border-slate-200 bg-white/80 p-10 text-center text-slate-500">
        {t.noBillingData}
      </div>
    );
  }

  if (!billing && loading) {
    return (
      <div className="rounded-[28px] border border-dashed border-slate-200 bg-white/80 p-10 text-center text-slate-500">
        {t.loading}
      </div>
    );
  }

  if (!billing) {
    return (
      <div className="rounded-[28px] border border-dashed border-slate-200 bg-white/80 p-10 text-center text-slate-500">
        {t.noBillingData}
      </div>
    );
  }

  const financialState = getBillingStatus(billing.summary.paidAmount, billing.summary.remainingAmount);
  const tableLabel = formatTableLabel(billing.summary.tableNumber, language, false);
  const itemCount = countItems(billing.orders);
  const guestCount = countGuests(billing.orders);

  return (
    <div className="space-y-6">
      <section className="rounded-[30px] border border-white/70 bg-white/85 p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">
              {t.tableBillingTitle}
            </p>
            <h2 className="mt-2 text-3xl font-bold">{tableLabel}</h2>
            <p className="mt-2 text-sm text-slate-500">{t.allOrdersUnderOneBill}</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <span className="rounded-full bg-[#eef5ff] px-4 py-2 text-sm font-semibold text-[#39506b]">
              {localizeFinancialStatus(financialState, language)}
            </span>
            <button
              type="button"
              onClick={() => openCheckout({ type: 'table', tableId: billing.summary.tableId })}
              className="inline-flex items-center gap-2 rounded-full bg-[#a73308] px-5 py-3 text-sm font-bold text-white"
            >
              <CreditCard size={16} />
              {t.pay}
            </button>
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-5">
          <div className="rounded-2xl bg-slate-50 p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-400">{t.ordersCount}</p>
            <p className="mt-2 text-2xl font-bold">{billing.summary.ordersCount}</p>
          </div>
          <div className="rounded-2xl bg-slate-50 p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-400">{t.items}</p>
            <p className="mt-2 text-2xl font-bold">{itemCount}</p>
          </div>
          <div className="rounded-2xl bg-slate-50 p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-400">{t.guests}</p>
            <p className="mt-2 text-2xl font-bold">{guestCount}</p>
          </div>
          <div className="rounded-2xl bg-slate-50 p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-400">{t.paymentsHistory}</p>
            <p className="mt-2 text-2xl font-bold">{billing.summary.paymentsCount}</p>
          </div>
          <div className="rounded-2xl bg-slate-50 p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-400">{t.status}</p>
            <p className="mt-2 text-lg font-bold">{localizeFinancialStatus(financialState, language)}</p>
          </div>
        </div>
      </section>

      <section className="rounded-[30px] border border-white/70 bg-white/85 p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-bold">{t.financialSummary}</h3>
            <p className="mt-1 text-sm text-slate-500">
              {tableBillingMode === 'unified' ? t.allOrdersUnderOneBill : t.orderViewReadOnly}
            </p>
          </div>
          <div className="inline-flex rounded-full bg-slate-100 p-1">
            <button
              type="button"
              onClick={() => setTableBillingMode('unified')}
              className={[
                'rounded-full px-4 py-2 text-sm font-semibold transition',
                tableBillingMode === 'unified'
                  ? 'bg-white text-[#8d3c19] shadow-sm'
                  : 'text-slate-500',
              ].join(' ')}
            >
              {t.unifiedBilling}
            </button>
            <button
              type="button"
              onClick={() => setTableBillingMode('orders')}
              className={[
                'rounded-full px-4 py-2 text-sm font-semibold transition',
                tableBillingMode === 'orders'
                  ? 'bg-white text-[#8d3c19] shadow-sm'
                  : 'text-slate-500',
              ].join(' ')}
            >
              {t.orderViewMode}
            </button>
          </div>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-3">
          {summaryCards.map((card) => (
            <div key={card.label} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-400">{card.label}</p>
              <p className="mt-2 text-xl font-bold text-slate-900">{card.value}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-[30px] border border-white/70 bg-white/85 p-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-bold">{t.ordersIncluded}</h3>
            <p className="mt-1 text-sm text-slate-500">
              {formatCountLabel(billing.orders.length, t.order, t.ordersCount, language)}
            </p>
          </div>
          <button
            type="button"
            onClick={() => openCheckout({ type: 'table', tableId: billing.summary.tableId })}
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700"
          >
            <ReceiptText size={16} />
            {t.openTableBill}
          </button>
        </div>

        <div className="mt-4 space-y-3">
          {billing.orders.map((order) => {
            const expanded = expandedOrders[order.id] ?? tableBillingMode === 'unified';
            return (
              <article key={order.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <button
                  type="button"
                  onClick={() =>
                    setExpandedOrders((state) => ({
                      ...state,
                      [order.id]: !expanded,
                    }))
                  }
                  className="flex w-full items-start justify-between gap-3 text-left"
                >
                  <div>
                    <p className="text-sm font-bold text-slate-900">#{order.displayOrderId ?? order.dailyOrderNumber}</p>
                    <p className="mt-1 text-sm text-slate-500">
                      {localizeUiStatus(order.status, language)} - {formatGuestLabel(order.guestSessionId, order.displayOrderId ?? order.dailyOrderNumber, language, isWalkInOrder(order))}
                    </p>
                    <p className="mt-1 text-xs text-slate-400">
                      {t.createdTime}: {formatTime(order.createdAt)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-lg font-bold">{formatMoney(order.grandTotal)}</p>
                      <p className="text-xs text-slate-500">
                        {t.outstanding}: {formatMoney(order.remainingAmount)}
                      </p>
                    </div>
                    {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                  </div>
                </button>

                {expanded ? (
                  <div className="mt-4 space-y-2 border-t border-dashed border-slate-200 pt-4">
                    {order.items.map((item) => (
                      <div key={item.id} className="flex justify-between gap-3 text-sm">
                        <span>
                          {item.quantity}x {item.menuItem?.nameAr ?? item.menuItem?.nameEn ?? item.menuItem?.name ?? item.menuItemId}
                        </span>
                        <span className="font-semibold">{formatMoney(item.price * item.quantity)}</span>
                      </div>
                    ))}
                  </div>
                ) : null}
              </article>
            );
          })}
        </div>
      </section>

      <section className="rounded-[30px] border border-white/70 bg-white/85 p-6">
        <h3 className="text-lg font-bold">{t.paymentsHistory}</h3>
        {billing.payments.length === 0 ? (
          <p className="mt-4 text-sm text-slate-500">{t.noPaymentsYet}</p>
        ) : (
          <div className="mt-4 space-y-3">
            {billing.payments.map((payment) => (
              <div
                key={payment.paymentId}
                className="grid gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm md:grid-cols-5"
              >
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-400">{t.amount}</p>
                  <p className="mt-1 font-bold">{formatMoney(payment.amount)}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-400">{t.method}</p>
                  <p className="mt-1 font-semibold">{localizeBackendPaymentMethod(payment.paymentMethod, language)}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-400">{t.status}</p>
                  <p className="mt-1 font-semibold">{payment.status}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-400">{t.employee}</p>
                  <p className="mt-1 font-semibold">{payment.createdBy ?? '-'}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-400">{t.createdTime}</p>
                  <p className="mt-1 font-semibold">{formatTime(payment.createdAt)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
