'use client';

import { useEffect, useMemo, useState } from 'react';
import { Printer, ReceiptText, Search } from 'lucide-react';
import type { OrderResponse } from '@repo/shared-types';
import { useAuthStore } from '@/auth/store';
import { getApiErrorMessage } from '@/lib/api-error';
import { formatMoney, formatTime } from '@/lib/format';
import { isWalkInOrder, mapOrderToTicket } from '@/lib/mappers/order.mapper';
import { posT } from '@/lib/i18n';
import { getPosOrder, listPosOrderHistory } from '@/services/orders.service';
import { usePosDataStore } from '@/store/pos-data.store';
import { usePosUiStore } from '@/store/pos-ui.store';

export function OrdersHistoryScreen() {
  const restaurantId = useAuthStore((state) => state.session?.user.restaurantId);
  const language = usePosUiStore((state) => state.language);
  const selectOrder = usePosUiStore((state) => state.selectOrder);
  const selectTable = usePosUiStore((state) => state.selectTable);
  const setActiveScreen = usePosUiStore((state) => state.setActiveScreen);
  const setLastReceiptOrder = usePosUiStore((state) => state.setLastReceiptOrder);
  const setLastReceiptBundle = usePosUiStore((state) => state.setLastReceiptBundle);
  const setOrderEditReason = usePosUiStore((state) => state.setOrderEditReason);
  const setOrderEditSource = usePosUiStore((state) => state.setOrderEditSource);
  const setSelectedOrderSnapshot = usePosDataStore((state) => state.setSelectedOrderSnapshot);
  const lastPaymentMethod = usePosUiStore((state) => state.lastPaymentMethod);
  const t = posT(language);

  const [orders, setOrders] = useState<OrderResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    if (!restaurantId) {
      setLoading(false);
      return;
    }

    let active = true;

  async function load() {
      if (!restaurantId) {
        return;
      }
      try {
        setLoading(true);
        setError(null);
        const data = await listPosOrderHistory(restaurantId);
        if (active) {
          setOrders(
            data.slice().sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
          );
        }
      } catch (nextError) {
        if (active) {
          setError(getApiErrorMessage(nextError, t.connectionError));
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
  }, [restaurantId, t.connectionError]);

  const filteredOrders = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return orders;
    }

    return orders.filter((order) => {
      const ticket = mapOrderToTicket(order, language);
      const haystack = [
        ticket.displayId,
        ticket.table,
        ticket.guestName,
        order.status,
        order.source,
        ...(order.items ?? []).map((item) => item.menuItem?.name ?? item.menuItemId),
      ]
        .join(' ')
        .toLowerCase();

      return haystack.includes(query);
    });
  }, [language, orders, search]);

  async function openOrder(order: OrderResponse) {
    setBusyId(order.id);
    try {
      const fresh = await getPosOrder(order.id);
      setOrderEditReason('');
      setOrderEditSource('history');
      setSelectedOrderSnapshot(fresh);
      selectOrder(fresh.id);
      if (fresh.tableId) {
        selectTable(fresh.tableId);
      }
      setActiveScreen('order-detail');
    } finally {
      setBusyId(null);
    }
  }

  async function handlePrint(order: OrderResponse) {
    setBusyId(order.id);
    try {
      setLastReceiptOrder(order, lastPaymentMethod);
      setLastReceiptBundle({
        mode: 'single',
        orderIds: [order.id],
        tableLabel: ticketLabel(order),
        guestLabel: guestLabel(order),
        itemCount: (order.items ?? []).length,
        total: order.grandTotal ?? 0,
        orders: [order],
        createdAt: order.createdAt,
      });
      selectOrder(order.id);
      setActiveScreen('receipt');
    } finally {
      setBusyId(null);
    }
  }

  function ticketLabel(order: OrderResponse) {
    const ticket = mapOrderToTicket(order, language);
    return ticket.table;
  }

  function guestLabel(order: OrderResponse) {
    const ticket = mapOrderToTicket(order, language);
    return ticket.guestName;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-[28px] border border-white/70 bg-white/80 p-5">
        <div>
          <h2 className="text-2xl font-bold">{t.ordersHistoryTitle}</h2>
          <p className="mt-1 text-sm text-slate-500">{t.ordersHistorySubtitle}</p>
        </div>
        <div className="flex items-center gap-3 rounded-full bg-[#eaf2fb] px-4 py-2 text-sm font-semibold text-[#39506b]">
          <ReceiptText size={16} />
          {filteredOrders.length} {t.todayOrdersHistory}
        </div>
      </div>

      <div className="rounded-[28px] border border-white/70 bg-white/80 p-4">
        <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3">
          <Search size={16} className="text-slate-400" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={`${t.order} / ${t.table} / ${t.guest}`}
            className="w-full bg-transparent text-sm outline-none"
          />
        </div>
      </div>

      {error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          {error}
        </div>
      ) : null}

      {loading ? (
        <div className="rounded-[28px] border border-dashed border-slate-200 bg-white/80 p-10 text-center text-slate-500">
          {t.loading}
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="rounded-[28px] border border-dashed border-slate-200 bg-white/80 p-10 text-center text-slate-500">
          {t.noOrdersHistory}
        </div>
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          {filteredOrders.map((order) => {
            const ticket = mapOrderToTicket(order, language);
            const customerSource = order.source === 'CUSTOMER' ? t.customerApp : t.cashier;
            return (
              <article key={order.id} className="rounded-[28px] border border-white/70 bg-white/80 p-5 shadow-sm">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-slate-900 px-3 py-1 text-xs font-bold text-white">
                        #{ticket.displayId}
                      </span>
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                        {isWalkInOrder(order) ? t.takeaway : t.dineIn}
                      </span>
                      <span className="rounded-full bg-[#fff0e8] px-3 py-1 text-xs font-semibold text-[#8d3c19]">
                        {customerSource}
                      </span>
                    </div>
                    <h3 className="mt-3 text-xl font-bold text-slate-950">{ticket.table}</h3>
                    <p className="mt-1 text-sm text-slate-500">{ticket.guestName}</p>
                  </div>
                  <div className="text-right text-sm text-slate-500">
                    <p>{t.orderedAt}</p>
                    <p className="mt-1 font-semibold text-slate-900">{formatTime(order.createdAt)}</p>
                  </div>
                </div>

                <div className="mt-4 grid gap-3 md:grid-cols-3">
                  <div className="rounded-2xl bg-slate-50 px-4 py-3">
                    <p className="text-xs text-slate-500">{t.status}</p>
                    <p className="mt-1 font-bold text-slate-900">{order.status}</p>
                  </div>
                  <div className="rounded-2xl bg-slate-50 px-4 py-3">
                    <p className="text-xs text-slate-500">{t.items}</p>
                    <p className="mt-1 font-bold text-slate-900">{(order.items ?? []).length}</p>
                  </div>
                  <div className="rounded-2xl bg-slate-50 px-4 py-3">
                    <p className="text-xs text-slate-500">{t.total}</p>
                    <p className="mt-1 font-bold text-slate-900">{formatMoney(order.grandTotal ?? 0)}</p>
                  </div>
                </div>

                <div className="mt-4 space-y-2 rounded-2xl bg-[#fcf7f2] px-4 py-4 text-sm text-slate-700">
                  {(order.items ?? []).slice(0, 4).map((item) => (
                    <div key={item.id} className="flex items-center justify-between gap-3">
                      <span>{item.menuItem?.name ?? item.menuItemId}</span>
                      <span className="font-semibold">x{item.quantity}</span>
                    </div>
                  ))}
                  {(order.items ?? []).length > 4 ? (
                    <div className="text-xs text-slate-500">+{(order.items ?? []).length - 4} {t.items}</div>
                  ) : null}
                </div>

                <div className="mt-5 flex gap-3">
                  <button
                    type="button"
                    onClick={() => void openOrder(order)}
                    disabled={busyId === order.id}
                    className="flex-1 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700"
                  >
                    {t.openOrderDetails}
                  </button>
                  <button
                    type="button"
                    onClick={() => void handlePrint(order)}
                    disabled={busyId === order.id}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#a73308] px-4 py-3 text-sm font-semibold text-white"
                  >
                    <Printer size={16} />
                    {t.printInvoice}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
