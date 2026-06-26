'use client';

import { ShoppingBag } from 'lucide-react';
import { usePosOrderActions } from '@/hooks/use-pos-order-actions';
import { usePosOrdersView } from '@/hooks/use-pos-selectors';
import { formatMoney } from '@/lib/format';
import { formatCountLabel, localizeUiStatus, posT } from '@/lib/i18n';
import { usePosUiStore } from '@/store/pos-ui.store';
import { usePosDataStore } from '@/store/pos-data.store';
import type { OrderStatus } from '@/types/pos';

const columns: OrderStatus[] = ['Pending', 'Preparing', 'Ready', 'Delivered'];

const columnTone: Record<OrderStatus, string> = {
  Pending: 'bg-slate-100 text-slate-700',
  Preparing: 'bg-[#dde9f8] text-[#314966]',
  Ready: 'bg-[#ffe0d3] text-[#92330e]',
  Delivered: 'bg-slate-200 text-slate-600',
};

const borderTone: Record<OrderStatus, string> = {
  Pending: 'border-l-slate-300',
  Preparing: 'border-l-[#6e8ab5]',
  Ready: 'border-l-[#d76537]',
  Delivered: 'border-l-slate-300 opacity-70',
};

export function OrdersScreen() {
  const orderBoard = usePosOrdersView();
  const language = usePosUiStore((state) => state.language);
  const selectedOrderId = usePosUiStore((state) => state.selectedOrderId);
  const selectOrder = usePosUiStore((state) => state.selectOrder);
  const selectTable = usePosUiStore((state) => state.selectTable);
  const setActiveScreen = usePosUiStore((state) => state.setActiveScreen);
  const startWalkInCompose = usePosUiStore((state) => state.startWalkInCompose);
  const { openCheckout } = usePosOrderActions();
  const t = posT(language);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-[28px] border border-white/70 bg-white/80 p-5">
        <div>
          <h2 className="text-2xl font-bold">{t.orderBoardTitle}</h2>
          <p className="mt-1 text-sm text-slate-500">{t.orderBoardSubtitle}</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="rounded-full bg-[#eaf2fb] px-4 py-2 text-sm font-semibold text-[#39506b]">
            {formatCountLabel(orderBoard.length, t.ticket, t.activeTickets, language)}
          </span>
          <button
            type="button"
            onClick={() => startWalkInCompose()}
            className="flex items-center gap-2 rounded-full bg-[#a73308] px-5 py-2.5 text-sm font-bold text-white"
          >
            <ShoppingBag size={16} />
            {t.createWalkIn}
          </button>
        </div>
      </div>

      {orderBoard.length === 0 ? (
        <div className="rounded-[28px] border border-dashed border-slate-200 bg-white/80 p-10 text-center text-slate-500">
          {t.noActiveOrders}
        </div>
      ) : null}

      <div className="grid gap-5 xl:grid-cols-4">
        {columns.map((status) => {
          const items = orderBoard.filter((order) => order.status === status);

          return (
            <section key={status} className="rounded-[30px] border border-white/70 bg-white/80 p-4">
              <div className="mb-4 flex items-center justify-between px-2">
                <h3 className="flex items-center gap-2 text-lg font-bold">
                  {localizeUiStatus(status, language)}
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-bold ${columnTone[status]}`}
                  >
                    {items.length}
                  </span>
                </h3>
              </div>

              <div className="space-y-4">
                {items.map((order) => {
                  const active = selectedOrderId === order.id;
                  return (
                    <button
                      key={order.id}
                      type="button"
                      onClick={() => selectOrder(order.id)}
                      className={[
                        'w-full rounded-[24px] border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md',
                        borderTone[status],
                        'border-l-4',
                        active ? 'ring-2 ring-[#a73308]/30' : '',
                      ].join(' ')}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-sm font-bold text-slate-900">#{order.displayId}</p>
                          <h4 className="mt-1 text-lg font-bold">{order.table}</h4>
                          <p className="mt-1 text-xs text-slate-500">{order.guestName}</p>
                        </div>
                        <span className="text-sm text-slate-500">{order.openedAt}</span>
                      </div>

                      <div className="mt-4 flex items-center justify-between text-sm text-slate-500">
                        <span>{formatCountLabel(order.itemCount, t.item, t.items, language)}</span>
                        <span className="font-bold text-slate-900">{formatMoney(order.grandTotal)}</span>
                      </div>

                      <div className="mt-4 flex gap-2">
                        <button
                          type="button"
                          onClick={async (event) => {
                            event.stopPropagation();
                            selectOrder(order.id);
                            if (order.tableId) {
                              selectTable(order.tableId);
                            }
                            setActiveScreen('order-detail');
                          }}
                          className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700"
                        >
                          {t.edit}
                        </button>
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            openCheckout({ type: 'order', orderId: order.id });
                          }}
                          className="flex-1 rounded-xl bg-[#a73308] px-3 py-2 text-sm font-semibold text-white"
                        >
                          {t.payAction}
                        </button>
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
