'use client';

import { memo } from 'react';
import { ChefHat, ConciergeBell, Plus, Utensils } from 'lucide-react';
import { formatElapsedMinutes, formatMoney } from '@/lib/format';
import {
  localizeMenuItemName,
  localizeOrderStatus,
  localizeTableLabel,
  replaceTemplate,
  waiterT,
} from '@/lib/i18n';
import type { OrderResponse, TableDTO } from '@repo/shared-types';
import type { WaiterLanguage } from '@/store/waiter.store';

function getTrackingProgress(status: OrderResponse['status']) {
  switch (status) {
    case 'PREPARING':
      return 50;
    case 'READY':
      return 75;
    case 'DELIVERED':
    case 'PAID':
      return 100;
    case 'CANCELLED':
      return 0;
    default:
      return 25;
  }
}

function isTrackingStepActive(
  status: OrderResponse['status'],
  step: 'pending' | 'preparing' | 'ready' | 'delivered',
) {
  const rank = {
    PENDING: 0,
    PREPARING: 1,
    READY: 2,
    DELIVERED: 3,
    PAID: 4,
    CANCELLED: -1,
  } as const;

  const stepRank = { pending: 0, preparing: 1, ready: 2, delivered: 3 }[step];
  return rank[status] >= stepRank && status !== 'CANCELLED';
}

interface WaiterTrackingViewProps {
  selectedTable: TableDTO | null;
  tableOrders: OrderResponse[];
  language: WaiterLanguage;
  isRtl: boolean;
}

const trackingSteps = [
  { key: 'pending' as const, labelKey: 'stepPending' as const, icon: Plus },
  { key: 'preparing' as const, labelKey: 'stepPreparing' as const, icon: ChefHat },
  { key: 'ready' as const, labelKey: 'stepReady' as const, icon: Utensils },
  { key: 'delivered' as const, labelKey: 'stepDelivered' as const, icon: ConciergeBell },
];

export const WaiterTrackingView = memo(function WaiterTrackingView({
  selectedTable,
  tableOrders,
  language,
  isRtl,
}: WaiterTrackingViewProps) {
  const t = waiterT(language);

  return (
    <div className="flex min-h-0 flex-1 flex-col px-4 py-4 md:px-5 md:py-5">
      <div className="rounded-[28px] border border-[#ecd8c7] bg-white px-5 py-5 shadow-[0_18px_45px_rgba(116,58,28,0.08)]">
        <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[#b55229]">
          {t.trackTableOrders}
        </p>
        <h2 className="mt-2 text-2xl font-black text-slate-950">
          {selectedTable ? localizeTableLabel(selectedTable.number, language) : t.selectTable}
        </h2>
        <p className="mt-2 text-sm text-slate-500">
          {selectedTable
            ? replaceTemplate(t.trackingOrdersCount, { count: tableOrders.length })
            : t.trackOrdersHint}
        </p>
      </div>

      {!selectedTable ? (
        <div className="mt-5 rounded-[28px] border border-dashed border-[#dcc6b5] bg-[#fff9f4] px-5 py-12 text-center text-sm text-slate-500">
          {t.trackOrdersHint}
        </div>
      ) : tableOrders.length === 0 ? (
        <div className="mt-5 rounded-[28px] border border-dashed border-[#dcc6b5] bg-[#fff9f4] px-5 py-12 text-center text-sm text-slate-500">
          {t.noOrdersForTracking}
        </div>
      ) : (
        <div className="mt-5 grid gap-4">
          {tableOrders.map((order) => {
            const progress = getTrackingProgress(order.status);

            return (
              <article
                key={order.id}
                className="rounded-[28px] border border-[#ead7c8] bg-white px-5 py-5 shadow-[0_16px_45px_rgba(116,58,28,0.06)]"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#b55229]">
                      {t.currentTicket}
                    </p>
                    <h3 className="mt-2 text-2xl font-black text-slate-950">
                      #{order.displayOrderId ?? order.dailyOrderNumber}
                    </h3>
                    <p className="mt-2 text-sm font-semibold text-[#8d2d0e]">
                      {localizeOrderStatus(order.status, language)}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">{t.trackingUpdatedLive}</p>
                  </div>
                  <div className={`rounded-[20px] bg-[#fff7f0] px-4 py-3 ${isRtl ? 'text-left' : 'text-right'}`}>
                    <p className="text-xs text-slate-500">{t.total}</p>
                    <p className="mt-1 text-xl font-black text-slate-950">
                      {formatMoney(order.grandTotal ?? 0, language)}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {formatElapsedMinutes(order.createdAt, language)}
                    </p>
                  </div>
                </div>

                <div className="mt-5 grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.95fr)] xl:items-start">
                  <div>
                    <div className="h-2 overflow-hidden rounded-full bg-[#f0e2d4]">
                      <div
                        className="h-full rounded-full bg-[linear-gradient(90deg,#8d2d0e,#cf835f)] transition-all duration-500"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <div className="mt-4 grid gap-3 md:grid-cols-4">
                      {trackingSteps.map((step, index) => {
                        const active = isTrackingStepActive(order.status, step.key);
                        const Icon = step.icon;

                        return (
                          <div
                            key={step.key}
                            className={`rounded-[20px] px-4 py-4 transition ${
                              active
                                ? 'bg-[#fff3ea] text-[#8d2d0e] ring-1 ring-[#cf835f]'
                                : 'bg-[#f7f3ef] text-slate-400'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div
                                className={`flex h-10 w-10 items-center justify-center rounded-full ${
                                  active ? 'bg-[#8d2d0e] text-white' : 'bg-white text-slate-400'
                                }`}
                              >
                                <Icon className="h-4 w-4" />
                              </div>
                              <div>
                                <p className="text-xs font-bold uppercase tracking-[0.18em]">
                                  0{index + 1}
                                </p>
                                <p className="mt-1 text-sm font-bold">{t[step.labelKey]}</p>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="hidden rounded-[22px] bg-[#fcf8f3] px-4 py-4 xl:block">
                    <p className="text-sm font-bold text-slate-950">{t.items}</p>
                    <div className="mt-3 space-y-3">
                      {(order.items ?? []).map((item) => (
                        <div
                          key={`tracking-side-${item.id}`}
                          className="rounded-[20px] border border-[#f0dfd1] bg-[linear-gradient(180deg,#fffdfb_0%,#fff7f1_100%)] px-4 py-3 shadow-[0_8px_24px_rgba(116,58,28,0.05)]"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="inline-flex min-w-10 items-center justify-center rounded-full bg-[#8d2d0e] px-2.5 py-1 text-[11px] font-bold text-white">
                                  {t.qtyLabel} {item.quantity}
                                </span>
                                <p className="text-sm font-semibold text-slate-950">
                                  {item.menuItem
                                    ? localizeMenuItemName(item.menuItem, language)
                                    : item.menuItemId}
                                </p>
                              </div>
                              {item.notes ? (
                                <div className="mt-3 rounded-[16px] bg-[#fff3ea] px-3 py-2">
                                  <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#b55229]">
                                    {t.notesLabel}
                                  </p>
                                  <p className="mt-1 text-xs text-slate-600">{item.notes}</p>
                                </div>
                              ) : null}
                              {item.modifiers?.length ? (
                                <div className="mt-3 rounded-[16px] bg-white px-3 py-2 ring-1 ring-[#f1e3d7]">
                                  <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">
                                    {t.addonsLabel}
                                  </p>
                                  <div className="mt-2 flex flex-wrap gap-2">
                                    {item.modifiers.map((modifier, index) => (
                                      <span
                                        key={`${item.id}-modifier-${index}`}
                                        className="rounded-full bg-[#f7efe8] px-2.5 py-1 text-[11px] font-semibold text-slate-600"
                                      >
                                        {modifier.groupName}: {modifier.optionName}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              ) : null}
                            </div>
                            <p className="text-sm font-bold text-slate-700">
                              {formatMoney(item.price * item.quantity, language)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-5 rounded-[22px] bg-[#fcf8f3] px-4 py-4 xl:hidden">
                  <p className="text-sm font-bold text-slate-950">{t.items}</p>
                  <div className="mt-3 space-y-3">
                    {(order.items ?? []).map((item) => (
                      <div
                        key={item.id}
                        className="rounded-[20px] border border-[#f0dfd1] bg-[linear-gradient(180deg,#fffdfb_0%,#fff7f1_100%)] px-4 py-3"
                      >
                        <div>
                          <p className="text-sm font-semibold text-slate-950">
                            {item.quantity} ×{' '}
                            {item.menuItem
                              ? localizeMenuItemName(item.menuItem, language)
                              : item.menuItemId}
                          </p>
                          {item.notes ? (
                            <p className="mt-1 text-xs text-slate-500">{item.notes}</p>
                          ) : null}
                        </div>
                        <p className="rounded-full bg-white px-3 py-1 text-sm font-bold text-slate-700 ring-1 ring-[#f1e3d7]">
                          {formatMoney(item.price * item.quantity, language)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
});
