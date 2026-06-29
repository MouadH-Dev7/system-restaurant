'use client';

import { useMemo, useState } from 'react';
import type { BusyHourDTO } from '@repo/shared-types';
import { CalendarDays, Download } from 'lucide-react';
import { useI18n } from '@/hooks/use-i18n';
import { useDashboardAnalytics, useRevenueChart, type RevenuePeriod } from '@/hooks/use-admin-queries';

function busyHourMax(hours: BusyHourDTO[]) {
  return Math.max(...hours.map((hour) => hour.orders), 1);
}

export function DashboardScreen() {
  const { t, formatCurrency, formatNumber, statusLabel, language } = useI18n();
  const [period, setPeriod] = useState<RevenuePeriod>('daily');
  const { data: dashboard, isLoading: loading, error } = useDashboardAnalytics();
  const { data: revenue } = useRevenueChart(period);

  const statCards = useMemo(() => {
    if (!dashboard) {
      return [];
    }

    return [
      {
        label: t('dashboard.revenueToday'),
        value: formatCurrency(dashboard.revenue.today),
        note: `${t('dashboard.weekRevenue')} ${formatCurrency(dashboard.revenue.week)}`,
      },
      {
        label: t('dashboard.thisMonth'),
        value: formatCurrency(dashboard.revenue.month),
        note: t('dashboard.revenueMtd'),
      },
      {
        label: t('dashboard.totalOrders'),
        value: formatNumber(dashboard.orders.total),
        note: `${dashboard.orders.completed} ${t('dashboard.completedCount')}`,
      },
      {
        label: t('dashboard.cancelled'),
        value: formatNumber(dashboard.orders.cancelled),
        note: t('dashboard.needsReview'),
      },
      {
        label: t('dashboard.returningGuests'),
        value: formatNumber(dashboard.customers.returning),
        note: `${dashboard.customers.total} ${t('dashboard.identifiedCustomers')}`,
      },
    ];
  }, [dashboard, formatCurrency, formatNumber, t]);

  const chartMeta = useMemo(() => {
    const points = revenue?.datasets[0]?.data ?? [];
    return { points, max: Math.max(...points, 1) };
  }, [revenue]);

  const localizedLabels = useMemo(() => {
    const formatter = new Intl.DateTimeFormat(
      language === 'ar' ? 'ar-DZ' : language === 'fr' ? 'fr-FR' : 'en-US',
      { weekday: 'short' },
    );

    return (revenue?.labels ?? []).map((label) => {
      const parsed = new Date(`${label} 1, 2026`);
      if (!Number.isNaN(parsed.getTime())) {
        return formatter.format(parsed);
      }

      return label;
    });
  }, [language, revenue?.labels]);

  const busyMax = useMemo(
    () => busyHourMax(dashboard?.busyHours ?? []),
    [dashboard?.busyHours],
  );

  return (
    <>
      <section className="page-header">
        <div>
          <h2>{t('dashboard.title')}</h2>
          <p>{t('dashboard.subtitle')}</p>
        </div>

        <div className="header-actions">
          <button type="button" className="ghost-btn" onClick={() => setPeriod('daily')}>
            <CalendarDays size={16} />
            <span>
              {period === 'daily'
                ? t('dashboard.last7days')
                : period === 'weekly'
                  ? t('dashboard.last4weeks')
                  : t('dashboard.last6months')}
            </span>
          </button>
          <button type="button" className="primary-btn">
            <Download size={16} />
            <span>{t('dashboard.exportReport')}</span>
          </button>
        </div>
      </section>

      {error ? <div className="panel error-banner">{(error as Error)?.message ?? t('analytics.title')}</div> : null}

      <section className="stat-grid">
        {loading && statCards.length === 0
          ? Array.from({ length: 5 }).map((_, index) => (
              <article key={index} className="panel stat-card">
                <span>{t('dashboard.loading')}</span>
                <div className="stat-row">
                  <strong>...</strong>
                  <small>{t('dashboard.pleaseWait')}</small>
                </div>
              </article>
            ))
          : statCards.map((stat) => (
              <article key={stat.label} className="panel stat-card">
                <span>{stat.label}</span>
                <div className="stat-row">
                  <strong>{stat.value}</strong>
                  <small>{stat.note}</small>
                </div>
              </article>
            ))}
      </section>

      <section className="dashboard-layout">
        <div className="dashboard-primary">
          <article className="panel chart-panel">
            <div className="panel-header">
              <div>
                <h3>{t('dashboard.revenueTrends')}</h3>
                <p>{t('dashboard.sparklineDescription')}</p>
              </div>
              <div className="segmented">
                <button
                  type="button"
                  className={period === 'daily' ? 'segment active' : 'segment'}
                  onClick={() => setPeriod('daily')}
                >
                  {t('analytics.daily')}
                </button>
                <button
                  type="button"
                  className={period === 'weekly' ? 'segment active' : 'segment'}
                  onClick={() => setPeriod('weekly')}
                >
                  {t('analytics.weekly')}
                </button>
                <button
                  type="button"
                  className={period === 'monthly' ? 'segment active' : 'segment'}
                  onClick={() => setPeriod('monthly')}
                >
                  {t('analytics.monthly')}
                </button>
              </div>
            </div>

            <div className="analytics-bars">
              {chartMeta.points.map((point, index) => (
                <div key={`${point}-${index}`} className="analytics-bar-col">
                  <div
                    className="analytics-bar"
                    style={{ height: `${Math.max((point / chartMeta.max) * 100, 6)}%` }}
                    title={`${localizedLabels[index] ?? ''}: ${formatCurrency(point)}`}
                  />
                  <span>{localizedLabels[index]}</span>
                </div>
              ))}
            </div>
          </article>

          <div className="split-panels">
            <article className="panel">
              <div className="panel-header">
                <div>
                  <h3>{t('dashboard.topDishes')}</h3>
                  <p>{t('dashboard.topDishesDescription')}</p>
                </div>
              </div>

              <div className="list-stack">
                {(dashboard?.topDishes ?? []).map((item, index) => (
                  <div key={item.menuItemId} className="list-row">
                    <div className="thumb">{index + 1}</div>
                    <div className="list-copy">
                      <strong>{item.name}</strong>
                      <span>
                        {formatNumber(item.quantitySold)} {t('dashboard.soldCount')}
                      </span>
                    </div>
                    <div className="metric-copy">
                      <strong>{formatCurrency(item.revenue)}</strong>
                      <span>{t('dashboard.revenueLabel')}</span>
                    </div>
                  </div>
                ))}
              </div>
            </article>

            <article className="panel">
              <div className="panel-header">
                <div>
                  <h3>{t('dashboard.recentOrders')}</h3>
                  <p>{t('dashboard.latestOrderFlow')}</p>
                </div>
              </div>

              <div className="table-list">
                {(dashboard?.recentOrders ?? []).map((order) => (
                  <div key={order.id} className="order-row">
                    <div>
                      <strong>#{order.dailyOrderNumber}</strong>
                      <span>{order.tableLabel}</span>
                      <span className="text-xs text-slate-400">
                        {order.financialStatus} · Paid {formatCurrency(order.paidAmount)} · Remaining {formatCurrency(order.remainingAmount)}
                      </span>
                    </div>
                    <span className="badge bg-slate-100 text-slate-700">
                      {statusLabel(order.status)}
                    </span>
                    <strong>{formatCurrency(order.grandTotal)}</strong>
                  </div>
                ))}
              </div>
            </article>
          </div>
        </div>

        <aside className="dashboard-side">
          <article className="panel compact-panel">
            <div className="panel-header">
              <div>
                <h3>{t('dashboard.ordersByHour')}</h3>
                <p>{t('dashboard.heatmapDescription')}</p>
              </div>
            </div>
            <div className="bar-chart">
              {(dashboard?.busyHours ?? []).map((bar) => (
                <div key={bar.hour} className="bar-col">
                  <div
                    className="bar active"
                    style={{ height: `${Math.max((bar.orders / busyMax) * 100, 4)}%` }}
                  />
                </div>
              ))}
            </div>
            <div className="chart-labels compact">
              <span>00:00</span>
              <span>12:00</span>
              <span>23:00</span>
            </div>
          </article>

          <article className="panel compact-panel">
            <div className="panel-header">
              <div>
                <h3>{t('dashboard.orderSummary')}</h3>
                <p>{t('dashboard.statusSnapshot')}</p>
              </div>
            </div>
            <div className="summary-stack">
              <div className="summary-row">
                <span>{t('dashboard.totalOrders')}</span>
                <strong>{dashboard?.orders.total ?? 0}</strong>
              </div>
              <div className="summary-row">
                <span>{statusLabel('COMPLETED')}</span>
                <strong>{dashboard?.orders.completed ?? 0}</strong>
              </div>
              <div className="summary-row">
                <span>{statusLabel('CANCELLED')}</span>
                <strong>{dashboard?.orders.cancelled ?? 0}</strong>
              </div>
              <div className="summary-row">
                <span>{t('dashboard.returningGuests')}</span>
                <strong>{dashboard?.customers.returning ?? 0}</strong>
              </div>
            </div>
          </article>
        </aside>
      </section>
    </>
  );
}
