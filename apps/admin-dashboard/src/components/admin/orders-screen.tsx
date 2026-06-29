'use client';

import { useEffect, useMemo, useState } from 'react';
import { AlertCircle, CalendarDays, Download, RefreshCw } from 'lucide-react';
import type { BusyHourDTO, OrderResponse, OrdersSummaryDTO } from '@repo/shared-types';
import { getApiErrorMessage } from '@/lib/api-error';
import { useI18n } from '@/hooks/use-i18n';
import { useAppStore } from '@/store/app.store';
import { getBusyHours, getOrdersSummary } from '@/services/analytics.service';
import { listOrders } from '@/services/orders.service';
import { statusBadge } from './data';

export function OrdersScreen() {
  const { t, formatCurrency, formatNumber, statusLabel } = useI18n();
  const restaurantId = useAppStore((state) => state.restaurantId);
  const [orders, setOrders] = useState<OrderResponse[]>([]);
  const [busyHours, setBusyHours] = useState<BusyHourDTO[]>([]);
  const [summary, setSummary] = useState<OrdersSummaryDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    const activeRestaurantId = restaurantId;

    if (!activeRestaurantId) {
      setOrders([]);
      setBusyHours([]);
      setSummary(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const [ordersData, busyHoursData, summaryData] = await Promise.all([
        listOrders(activeRestaurantId),
        getBusyHours(),
        getOrdersSummary(),
      ]);

      setOrders(ordersData);
      setBusyHours(busyHoursData);
      setSummary(summaryData);
    } catch (nextError) {
      setError(getApiErrorMessage(nextError, t('orders.title')));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, [restaurantId]);

  const stats = useMemo(() => {
    const pending = orders.filter((order) => order.status === 'PENDING').length;
    const cooking = orders.filter((order) => order.status === 'PREPARING').length;
    const ready = orders.filter((order) => order.status === 'READY').length;
    const avg =
      orders.length > 0 ? orders.reduce((sum, order) => sum + order.grandTotal, 0) / orders.length : 0;

    return {
      pending: String(pending).padStart(2, '0'),
      cooking: String(cooking).padStart(2, '0'),
      ready: String(ready).padStart(2, '0'),
      avg: formatCurrency(avg),
    };
  }, [formatCurrency, orders]);

  const kitchenLoad = [
    { label: statusLabel('PENDING'), value: summary?.pending ?? 0, total: summary?.total ?? 0 },
    { label: statusLabel('PREPARING'), value: summary?.preparing ?? 0, total: summary?.total ?? 0 },
    { label: statusLabel('READY'), value: summary?.ready ?? 0, total: summary?.total ?? 0 },
  ];

  const hourlyMax = Math.max(...busyHours.map((item) => item.orders), 1);

  return (
    <>
      <section className="page-header">
        <div>
          <h2>{t('orders.title')}</h2>
          <p>{t('orders.subtitle')}</p>
        </div>

        <div className="header-actions">
          <button type="button" className="ghost-btn">
            <CalendarDays size={16} />
            <span>{t('orders.today')}</span>
          </button>
          <button type="button" className="primary-btn">
            <Download size={16} />
            <span>{t('orders.export')}</span>
          </button>
        </div>
      </section>

      {error ? (
        <div className="panel error-banner flex items-center gap-2 mt-4 text-xs font-bold">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      ) : null}

      <section className="stat-grid order-stats mt-4">
        <article className="panel stat-card">
          <span>{t('orders.pendingQueue')}</span>
          <div className="stat-row">
            <strong className="text-[var(--admin-warning)]">
              {loading ? '...' : stats.pending}
            </strong>
            <small>{t('orders.needsKitchenAttention')}</small>
          </div>
        </article>
        <article className="panel stat-card">
          <span>{t('orders.cookingNow')}</span>
          <div className="stat-row">
            <strong className="text-[var(--admin-tertiary)]">
              {loading ? '...' : stats.cooking}
            </strong>
            <small>{t('orders.activePreparation')}</small>
          </div>
        </article>
        <article className="panel stat-card">
          <span>{t('orders.readyForHandoff')}</span>
          <div className="stat-row">
            <strong className="text-[var(--admin-primary)]">{loading ? '...' : stats.ready}</strong>
            <small>{t('orders.awaitingRunner')}</small>
          </div>
        </article>
        <article className="panel stat-card">
          <span>{t('orders.averageTicket')}</span>
          <div className="stat-row">
            <strong className="text-[var(--admin-success)]">{loading ? '...' : stats.avg}</strong>
            <small>{t('orders.liveAverage')}</small>
          </div>
        </article>
      </section>

      <section className="orders-layout mt-4">
        <article className="panel">
          <div className="panel-header">
            <div>
              <h3>{t('orders.liveQueue')}</h3>
              <p>{t('orders.currentServiceFlow')}</p>
            </div>
            <button type="button" className="ghost-btn" onClick={() => void load()}>
              <RefreshCw size={16} />
              <span>{t('orders.refresh')}</span>
            </button>
          </div>

          <div className="orders-table mt-4">
            <div className="orders-table-head">
              <span>{t('orders.orderId')}</span>
              <span>{t('orders.source')}</span>
              <span>{t('orders.status')}</span>
              <span>{t('orders.items')}</span>
              <span>{t('orders.total')}</span>
              <span>{t('orders.elapsed')}</span>
            </div>

            {loading ? (
              <div className="text-center p-12 text-slate-400">
                <RefreshCw size={24} className="animate-spin mx-auto mb-2 text-slate-300" />
                {t('orders.loadingQueue')}
              </div>
            ) : orders.length === 0 ? (
              <div className="text-center p-12 text-slate-400">{t('orders.noOrders')}</div>
            ) : (
              orders.map((order) => {
                const tableNumber = order.table?.number ?? 0;
                const isWalkIn = tableNumber === 99;
                const source = isWalkIn
                  ? t('orders.takeaway')
                  : `${t('tables.table')} ${tableNumber} / ${t('orders.dineIn')}`;
                const totalItems = (order.items ?? []).reduce((sum, item) => sum + item.quantity, 0);
                const elapsedMinutes = Math.floor(
                  (Date.now() - new Date(order.createdAt).getTime()) / 60000,
                );
                const elapsed =
                  elapsedMinutes <= 0
                    ? t('orders.justNow')
                    : `${formatNumber(elapsedMinutes)} ${t('orders.mins')}`;

                return (
                  <div key={order.id} className="orders-table-row">
                    <strong>#{order.dailyOrderNumber}</strong>
                    <span>{source}</span>
                    <span className={`badge ${statusBadge(order.status)}`}>
                      {statusLabel(order.status)}
                    </span>
                    <span>
                      {formatNumber(totalItems)} {t('orders.items').toLowerCase()}
                    </span>
                    <strong>{formatCurrency(order.grandTotal)}</strong>
                    <span>{elapsed}</span>
                  </div>
                );
              })
            )}
          </div>
        </article>

        <aside className="dashboard-side">
          <article className="panel compact-panel">
            <div className="panel-header">
              <div>
                <h3>{t('orders.kitchenLoad')}</h3>
                <p>{t('orders.realPressure')}</p>
              </div>
            </div>
            <div className="load-stack">
              {kitchenLoad.map((item) => {
                const percent = item.total > 0 ? Math.round((item.value / item.total) * 100) : 0;

                return (
                  <div key={item.label} className="load-item">
                    <div className="load-meta">
                      <span>{item.label}</span>
                      <strong>{percent}%</strong>
                    </div>
                    <div className="load-track">
                      <div className="load-fill" style={{ width: `${percent}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </article>

          <article className="panel compact-panel">
            <div className="panel-header">
              <div>
                <h3>{t('orders.hourlyVolume')}</h3>
                <p>{t('orders.groupedByHour')}</p>
              </div>
            </div>
            <div className="mini-bars">
              {busyHours.map((entry, index) => (
                <div
                  key={`${entry.hour}-${index}`}
                  className="mini-bar-wrap"
                  title={`${entry.hour}: ${entry.orders} ${t('analytics.ordersCount')}`}
                >
                  <div
                    className={entry.orders > 0 ? 'mini-bar active' : 'mini-bar'}
                    style={{ height: `${Math.max((entry.orders / hourlyMax) * 100, 8)}%` }}
                  />
                </div>
              ))}
            </div>
          </article>
        </aside>
      </section>
    </>
  );
}
