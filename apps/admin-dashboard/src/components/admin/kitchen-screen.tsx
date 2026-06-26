'use client';

import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Check, CheckCircle2, Clock, RefreshCw, Search } from 'lucide-react';
import type { OrderResponse, OrderStatus } from '@repo/shared-types';
import { getApiErrorMessage } from '@/lib/api-error';
import { useI18n } from '@/hooks/use-i18n';
import { useAppStore } from '@/store/app.store';
import { listOrders, updateOrderStatus } from '@/services/orders.service';

type KitchenTicket = {
  id: string;
  dailyOrderNumber: number;
  tableLabel: string;
  items: string[];
  status: Extract<OrderStatus, 'PENDING' | 'PREPARING' | 'READY'>;
  elapsedSeconds: number;
  notes?: string;
};

function toKitchenTicket(order: OrderResponse): KitchenTicket {
  const tableNumber = order.table?.number;
  const tableLabel = tableNumber && tableNumber !== 99 ? `Table ${tableNumber}` : 'Takeaway';
  const notes = order.items.map((item) => item.notes).filter(Boolean).join(' | ');

  return {
    id: order.id,
    dailyOrderNumber: order.dailyOrderNumber,
    tableLabel,
    items: order.items.flatMap((item) => {
      const itemName = item.menuItem?.name ?? item.menuItemId;
      const modifierLines =
        item.modifiers?.map((modifier) => `+ ${modifier.groupName}: ${modifier.optionName}`) ?? [];
      return [`${item.quantity}x ${itemName}`, ...modifierLines];
    }),
    status: order.status as KitchenTicket['status'],
    elapsedSeconds: Math.max(0, Math.floor((Date.now() - new Date(order.createdAt).getTime()) / 1000)),
    notes: notes || undefined,
  };
}

function formatElapsed(totalSecs: number) {
  const mins = Math.floor(totalSecs / 60);
  const secs = totalSecs % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export function KitchenScreen() {
  const { t, formatNumber } = useI18n();
  const restaurantId = useAppStore((state) => state.restaurantId);
  const [orders, setOrders] = useState<OrderResponse[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void load();
    const interval = window.setInterval(() => {
      void load(false);
    }, 15000);

    return () => window.clearInterval(interval);
  }, [restaurantId]);

  async function load(showLoader = true) {
    const activeRestaurantId = restaurantId;

    if (!activeRestaurantId) {
      setOrders([]);
      setLoading(false);
      return;
    }

    try {
      if (showLoader) {
        setLoading(true);
      }
      setError(null);
      const data = await listOrders(activeRestaurantId, 'kitchen');
      setOrders(data);
    } catch (nextError) {
      setError(getApiErrorMessage(nextError, t('kitchen.title')));
    } finally {
      if (showLoader) {
        setLoading(false);
      }
    }
  }

  async function moveStatus(orderId: string, status: OrderStatus) {
    try {
      setUpdatingId(orderId);
      setError(null);
      const updated = await updateOrderStatus(orderId, status);
      setOrders((current) => current.map((order) => (order.id === updated.id ? updated : order)));
    } catch (nextError) {
      setError(getApiErrorMessage(nextError, t('orders.status')));
    } finally {
      setUpdatingId(null);
    }
  }

  const tickets = useMemo(() => orders.map(toKitchenTicket), [orders]);

  const filteredTickets = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) {
      return tickets;
    }

    return tickets.filter((ticket) => {
      return (
        ticket.id.toLowerCase().includes(query) ||
        ticket.tableLabel.toLowerCase().includes(query) ||
        ticket.items.some((item) => item.toLowerCase().includes(query)) ||
        (ticket.notes?.toLowerCase().includes(query) ?? false)
      );
    });
  }, [searchQuery, tickets]);

  const pending = filteredTickets.filter((ticket) => ticket.status === 'PENDING');
  const preparing = filteredTickets.filter((ticket) => ticket.status === 'PREPARING');
  const ready = filteredTickets.filter((ticket) => ticket.status === 'READY');

  const completedCount = orders.filter((order) => order.status === 'DELIVERED' || order.status === 'PAID').length;
  const activeElapsed = filteredTickets.map((ticket) => ticket.elapsedSeconds);
  const avgTimeMinutes =
    activeElapsed.length > 0
      ? Math.round(activeElapsed.reduce((sum, value) => sum + value, 0) / activeElapsed.length / 60)
      : 0;

  const columns: Array<{
    key: 'PENDING' | 'PREPARING' | 'READY';
    title: string;
    tickets: KitchenTicket[];
    actionLabel: string;
    nextStatus?: OrderStatus;
    complete?: boolean;
  }> = [
    {
      key: 'PENDING',
      title: t('kitchen.pendingOrders'),
      tickets: pending,
      actionLabel: t('kitchen.startCooking'),
      nextStatus: 'PREPARING',
    },
    {
      key: 'PREPARING',
      title: t('kitchen.preparing'),
      tickets: preparing,
      actionLabel: t('kitchen.markReady'),
      nextStatus: 'READY',
    },
    {
      key: 'READY',
      title: t('kitchen.ready'),
      tickets: ready,
      actionLabel: t('kitchen.completeTicket'),
      nextStatus: 'DELIVERED',
      complete: true,
    },
  ];

  return (
    <>
      <section className="page-header">
        <div>
          <h2>{t('kitchen.title')}</h2>
          <p>{t('kitchen.subtitle')}</p>
        </div>
        <div className="flex gap-3 items-center">
          <div className="flex gap-4 text-xs font-bold bg-white border border-slate-200 rounded-lg px-4 py-2 text-slate-600 shadow-sm">
            <span>
              {t('kitchen.avgSpeed')}: {formatNumber(avgTimeMinutes)}m
            </span>
            <span className="w-px h-3 bg-slate-200" />
            <span>
              {t('kitchen.dispatched')}: {formatNumber(completedCount)}
            </span>
          </div>
          <button type="button" className="ghost-btn" onClick={() => void load()} disabled={loading}>
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            <span>{t('orders.refresh')}</span>
          </button>
        </div>
      </section>

      {error ? <div className="panel error-banner mt-4">{error}</div> : null}

      <div className="panel bg-white border-slate-200 mt-4">
        <div className="flex items-center gap-2 border border-slate-200 rounded-lg px-3 py-2 bg-slate-50 text-slate-600 w-full">
          <Search size={16} />
          <input
            type="text"
            placeholder={t('kitchen.search')}
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            className="w-full bg-transparent border-0 outline-none text-xs"
          />
          {searchQuery ? (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="text-slate-400 hover:text-slate-600 text-xs font-bold"
            >
              {t('kitchen.clear')}
            </button>
          ) : null}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
        {columns.map((column) => (
          <div key={column.key} className="panel bg-slate-50 border-slate-200 flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest">
                {column.title} ({formatNumber(column.tickets.length)})
              </h3>
            </div>

            <div className="flex-1 space-y-4 overflow-y-auto max-h-[600px] pr-1 min-h-[400px]">
              {loading && column.tickets.length === 0 ? (
                <div className="text-center py-16 text-slate-400">
                  <RefreshCw size={20} className="animate-spin mx-auto mb-2" />
                  <p className="text-xs">{t('common.loading')}</p>
                </div>
              ) : column.tickets.length === 0 ? (
                <div className="text-center py-16 text-slate-400 border border-dashed border-slate-200 bg-white rounded-lg flex flex-col items-center gap-2">
                  <Check size={20} className="text-slate-300 bg-slate-100 p-1 rounded-full" />
                  <p className="text-xs">
                    {column.key === 'PENDING'
                      ? t('kitchen.noPending')
                      : column.key === 'PREPARING'
                        ? t('kitchen.noPreparing')
                        : t('kitchen.noReady')}
                  </p>
                </div>
              ) : (
                column.tickets.map((ticket) => {
                  const isOverdue = ticket.elapsedSeconds >= 900;
                  const isWarning = ticket.elapsedSeconds >= 480 && ticket.elapsedSeconds < 900;

                  return (
                    <div
                      key={ticket.id}
                      className={`bg-white border rounded-lg p-4 shadow-sm space-y-3 transition-all hover:shadow-md ${
                        isOverdue
                          ? 'border-rose-200'
                          : isWarning
                            ? 'border-amber-200'
                            : 'border-slate-200'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-extrabold text-slate-800 text-sm">{ticket.tableLabel}</h4>
                          <span className="text-[10px] text-slate-400 font-mono font-bold">
                            #{ticket.dailyOrderNumber}
                          </span>
                        </div>
                        <span
                          className={`text-[11px] font-bold flex items-center gap-1 px-1.5 py-0.5 rounded ${
                            isOverdue
                              ? 'bg-rose-100 text-rose-800'
                              : isWarning
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          <Clock size={12} /> {formatElapsed(ticket.elapsedSeconds)}
                        </span>
                      </div>

                      <ul className="text-xs text-slate-700 font-bold space-y-1.5 pl-3 list-disc">
                        {ticket.items.map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>

                      {ticket.notes ? (
                        <div className="text-[10px] font-bold px-2.5 py-1.5 rounded border-l-2 uppercase tracking-wide flex items-center gap-1 bg-orange-50 text-orange-800 border-orange-400">
                          <AlertTriangle size={10} /> {t('kitchen.note')}: {ticket.notes}
                        </div>
                      ) : null}

                      <button
                        type="button"
                        disabled={updatingId === ticket.id}
                        onClick={() => column.nextStatus && void moveStatus(ticket.id, column.nextStatus)}
                        className="w-full primary-btn flex items-center justify-center gap-1.5 py-2 font-black text-xs"
                      >
                        {column.complete ? <CheckCircle2 size={12} /> : <Check size={12} />}
                        <span>{updatingId === ticket.id ? t('common.saving') : column.actionLabel}</span>
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
