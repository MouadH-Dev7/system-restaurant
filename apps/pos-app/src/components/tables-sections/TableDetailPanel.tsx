'use client';

import { CreditCard, Plus } from 'lucide-react';
import type { OrderResponse } from '@repo/shared-types';
import type { DiningTable } from '@/types/pos';
import type { PosDictionary } from '@/lib/i18n';
import { formatMoney } from '@/lib/format';
import {
  formatCountLabel,
  localizeMenuItemName,
  localizeTableStatus,
  localizeUiStatus,
} from '@/lib/i18n';

type TableDetailPanelProps = {
  activeTable: DiningTable;
  activeTableOrders: OrderResponse[];
  totals: { total: number };
  moveMode: boolean;
  moveButtonLabel: string;
  savingLayoutId: string | null;
  language: 'en' | 'fr' | 'ar';
  t: PosDictionary;
  onStartCompose: (tableId: string, tableLabel: number) => void;
  onEditOrder: (orderId: string) => void;
  onPayOrder: (orderId: string) => void;
  onToggleMoveMode: (tableId: string) => void;
  onPayTable: (tableId: string) => void;
};

export function TableDetailPanel({
  activeTable,
  activeTableOrders,
  totals,
  moveMode,
  moveButtonLabel,
  savingLayoutId,
  language,
  t,
  onStartCompose,
  onEditOrder,
  onPayOrder,
  onToggleMoveMode,
  onPayTable,
}: TableDetailPanelProps) {
  return (
    <section className="space-y-5">
      <div className="rounded-[30px] border border-white/70 bg-white/80 p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">
              {activeTable.floorName} - {activeTable.area}
            </p>
            <h3 className="mt-2 text-3xl font-bold">
              {t.table} {activeTable.label}
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              {formatCountLabel(activeTable.orderCount, t.ticket, t.activeTickets, language)} -{' '}
              {formatCountLabel(activeTable.seats, t.seat, t.seats, language)}
            </p>
          </div>
          <span className="rounded-full bg-[#eaf2fb] px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-[#39506b]">
            {localizeTableStatus(activeTable.status, language)}
          </span>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => onToggleMoveMode(activeTable.id)}
            className={`rounded-full px-4 py-2 text-xs font-bold ${
              moveMode
                ? 'bg-sky-100 text-sky-700'
                : 'border border-slate-200 bg-white text-slate-700'
            }`}
          >
            {savingLayoutId === activeTable.id ? `${moveButtonLabel}...` : moveButtonLabel}
          </button>
          {moveMode ? (
            <p className="self-center text-xs text-slate-500">
              {language === 'ar'
                ? 'اسحب الطاولة داخل المخطط وسيتم حفظ مكانها تلقائيًا.'
                : language === 'fr'
                  ? 'Glissez la table sur le plan. La position sera enregistree automatiquement.'
                  : 'Drag the table on the map. Its position will be saved automatically.'}
            </p>
          ) : null}
        </div>
      </div>

      <div className="rounded-[30px] border border-white/70 bg-white/80 p-6">
        <div className="flex items-center justify-between gap-3">
          <h4 className="text-lg font-bold">{t.activeTicketsAtTable}</h4>
          <button
            type="button"
            onClick={() => onStartCompose(activeTable.id, Number(activeTable.label))}
            className="inline-flex items-center gap-2 rounded-full bg-[#18222f] px-4 py-2 text-xs font-bold text-white"
          >
            <Plus size={14} />
            {t.newTicket}
          </button>
        </div>
        {activeTable.activeOrders.length === 0 ? (
          <p className="mt-4 text-sm text-slate-500">{t.noTableOrders}</p>
        ) : (
          <div className="mt-4 space-y-3">
            {activeTable.activeOrders.map((orderSummary) => {
              const fullOrder = activeTableOrders.find((entry) => entry.id === orderSummary.orderId);

              return (
              <article
                key={orderSummary.orderId}
                className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold text-slate-900">#{orderSummary.shortId}</p>
                    <p className="mt-1 font-semibold text-[#a73308]">{orderSummary.guestLabel}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      {orderSummary.status === 'DELIVERED'
                        ? t.readyToPay
                        : localizeUiStatus(orderSummary.status, language)}{' '}
                      - {formatCountLabel(orderSummary.itemCount, t.item, t.items, language)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold">{formatMoney(orderSummary.grandTotal)}</p>
                    <p className="text-xs text-slate-500">
                      Paid {formatMoney(orderSummary.paidAmount)} · Remaining {formatMoney(orderSummary.remainingAmount)}
                    </p>
                    <p className="text-[10px] font-semibold uppercase text-slate-400">
                      {orderSummary.financialStatus}
                    </p>
                  </div>
                </div>
                {fullOrder ? (
                  <div className="mt-4 rounded-2xl bg-slate-50 px-3 py-3">
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
                      {language === 'ar'
                        ? 'تفاصيل الطلب'
                        : language === 'fr'
                          ? 'Details de la commande'
                          : 'Order details'}
                    </p>
                    <div className="mt-3 space-y-2">
                      {fullOrder.items.map((item) => (
                        <div
                          key={item.id}
                          className="rounded-xl border border-slate-200 bg-white px-3 py-2"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-sm font-semibold text-slate-900">
                                {item.quantity}x {item.menuItem ? localizeMenuItemName(item.menuItem, language) : item.menuItemId}
                              </p>
                              {item.notes ? (
                                <p className="mt-1 text-xs text-slate-500">{item.notes}</p>
                              ) : null}
                              {item.modifiers?.length ? (
                                <p className="mt-1 text-xs text-slate-500">
                                  {item.modifiers.map((modifier) => modifier.optionName).join(' • ')}
                                </p>
                              ) : null}
                            </div>
                            <p className="text-sm font-bold text-slate-700">
                              {formatMoney(item.price * item.quantity)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => onEditOrder(orderSummary.orderId)}
                    className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700"
                  >
                    {t.edit}
                  </button>
                  <button
                    type="button"
                    onClick={() => onPayOrder(orderSummary.orderId)}
                    className="flex-1 rounded-xl bg-[#a73308] px-3 py-2 text-sm font-semibold text-white"
                  >
                    {t.pay}
                  </button>
                </div>
              </article>
              );
            })}
          </div>
        )}
      </div>

      <div className="rounded-[30px] border border-white/70 bg-white/80 p-6">
        <h4 className="text-lg font-bold">{t.tableTotal}</h4>
        <div className="mt-4 flex justify-between text-lg font-bold">
          <span>{t.total}</span>
          <span className="text-[#a73308]">{formatMoney(totals.total)}</span>
        </div>
        <div className="mt-2 flex justify-between text-sm text-slate-500">
          <span>Paid</span>
          <span>{formatMoney(activeTable.paidAmount)}</span>
        </div>
        <div className="mt-1 flex justify-between text-sm text-slate-500">
          <span>Grand Total</span>
          <span>{formatMoney(activeTable.grandTotalAmount)}</span>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => onStartCompose(activeTable.id, Number(activeTable.label))}
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-700"
          >
            <Plus size={16} />
            {t.edit}
          </button>
          {activeTable.activeOrders.length ? (
            <button
              type="button"
              onClick={() => onPayTable(activeTable.id)}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#a73308] px-4 py-3 text-sm font-bold text-white"
            >
              <CreditCard size={16} />
              {t.pay}
            </button>
          ) : (
            <button
              type="button"
              disabled
              className="rounded-2xl bg-slate-100 px-4 py-3 text-sm font-bold text-slate-400"
            >
              {t.pay}
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
