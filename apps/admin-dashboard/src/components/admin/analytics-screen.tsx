'use client';

import { useEffect, useMemo, useState } from 'react';
import { AlertCircle, Download } from 'lucide-react';
import type {
  BusyHourDTO,
  OrdersSummaryDTO,
  RevenueChartResponse,
  TopDishDTO,
} from '@repo/shared-types';
import { getApiErrorMessage } from '@/lib/api-error';
import { useI18n } from '@/hooks/use-i18n';
import { useAppStore } from '@/store/app.store';
import {
  getBusyHours,
  getOrdersSummary,
  getRevenueChart,
  getTopDishes,
} from '@/services/analytics.service';

type TimeRange = 'daily' | 'weekly' | 'monthly';

export function AnalyticsScreen() {
  const { t, formatCurrency, formatNumber, statusLabel } = useI18n();
  const restaurantId = useAppStore((state) => state.restaurantId);
  const [timeRange, setTimeRange] = useState<TimeRange>('daily');
  const [revenue, setRevenue] = useState<RevenueChartResponse | null>(null);
  const [topDishes, setTopDishes] = useState<TopDishDTO[]>([]);
  const [busyHours, setBusyHours] = useState<BusyHourDTO[]>([]);
  const [summary, setSummary] = useState<OrdersSummaryDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function load() {
      if (!restaurantId) {
        setRevenue(null);
        setTopDishes([]);
        setBusyHours([]);
        setSummary(null);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const [revenueData, dishesData, hoursData, summaryData] = await Promise.all([
          getRevenueChart(timeRange, restaurantId),
          getTopDishes(restaurantId),
          getBusyHours(restaurantId),
          getOrdersSummary(restaurantId),
        ]);

        if (!active) {
          return;
        }

        setRevenue(revenueData);
        setTopDishes(dishesData);
        setBusyHours(hoursData);
        setSummary(summaryData);
      } catch (nextError) {
        if (active) {
          setError(getApiErrorMessage(nextError, t('analytics.title')));
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
  }, [restaurantId, timeRange]);

  const chartValues = revenue?.datasets[0]?.data ?? [];
  const chartMax = Math.max(...chartValues, 1);
  const totalRevenue = chartValues.reduce((sum, value) => sum + value, 0);
  const avgRevenue = chartValues.length > 0 ? totalRevenue / chartValues.length : 0;
  const totalOrders = summary?.total ?? 0;
  const completedOrders = (summary?.delivered ?? 0) + (summary?.paid ?? 0);
  const completionRate = totalOrders > 0 ? Math.round((completedOrders / totalOrders) * 100) : 0;
  const busyMax = Math.max(...busyHours.map((hour) => hour.orders), 1);

  const headlineStats = useMemo(
    () => [
      {
        label: t('analytics.revenueTotal'),
        value: formatCurrency(totalRevenue),
        note: loading
          ? t('common.loading')
          : `${t('analytics.averageRevenue')} ${formatCurrency(avgRevenue)}`,
      },
      {
        label: t('dashboard.totalOrders'),
        value: formatNumber(totalOrders),
        note: `${completedOrders} ${t('dashboard.completedCount')}`,
      },
      {
        label: t('analytics.cancelledOrders'),
        value: formatNumber(summary?.cancelled ?? 0),
        note: `${completionRate}% ${t('analytics.completionRate')}`,
      },
      {
        label: t('analytics.topDishesCount'),
        value: formatNumber(topDishes.length),
        note: t('analytics.rankedPaidOrders'),
      },
    ],
    [
      avgRevenue,
      completedOrders,
      completionRate,
      formatCurrency,
      formatNumber,
      loading,
      summary?.cancelled,
      topDishes.length,
      totalOrders,
      totalRevenue,
    ],
  );

  return (
    <>
      <section className="page-header">
        <div>
          <h2>{t('analytics.title')}</h2>
          <p>{t('analytics.subtitle')}</p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            className={`ghost-btn small ${timeRange === 'daily' ? 'active' : ''}`}
            onClick={() => setTimeRange('daily')}
          >
            {t('analytics.daily')}
          </button>
          <button
            type="button"
            className={`ghost-btn small ${timeRange === 'weekly' ? 'active' : ''}`}
            onClick={() => setTimeRange('weekly')}
          >
            {t('analytics.weekly')}
          </button>
          <button
            type="button"
            className={`ghost-btn small ${timeRange === 'monthly' ? 'active' : ''}`}
            onClick={() => setTimeRange('monthly')}
          >
            {t('analytics.monthly')}
          </button>
          <button type="button" className="primary-btn flex items-center gap-1 text-xs">
            <Download size={14} />
            <span>{t('analytics.exportSheets')}</span>
          </button>
        </div>
      </section>

      {error ? (
        <div className="panel error-banner flex items-center gap-2 mt-4 text-xs font-bold">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      ) : null}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-4">
        {headlineStats.map((card) => (
          <div key={card.label} className="panel bg-white border-slate-200">
            <span className="text-[10px] uppercase font-black text-slate-400 tracking-wider">
              {card.label}
            </span>
            <strong className="text-3xl font-bold text-slate-800 block mt-2">
              {loading ? '...' : card.value}
            </strong>
            <span className="text-[10px] font-bold text-slate-500 block mt-1">{card.note}</span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        <div className="panel lg:col-span-2 space-y-4">
          <h3 className="text-sm font-black uppercase text-slate-600 tracking-wider border-b border-slate-100 pb-2">
            {t('analytics.revenuePerformance')}
          </h3>
          <div className="h-[280px] bg-slate-50 border border-slate-100 rounded-lg flex flex-col justify-end p-4">
            <div className="flex justify-between items-end h-full gap-4 px-2">
              {(revenue?.labels ?? []).map((label, index) => {
                const value = chartValues[index] ?? 0;

                return (
                  <div
                    key={label}
                    className="w-full flex flex-col items-center justify-end h-full gap-1"
                  >
                    <div
                      className="w-full bg-orange-500 rounded-t-md hover:bg-orange-600 transition-colors"
                      style={{ height: `${Math.max((value / chartMax) * 100, 6)}%` }}
                      title={`${label}: ${formatCurrency(value)}`}
                    />
                    <span className="text-[9px] font-bold text-slate-400 font-mono">{label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="panel space-y-4">
          <h3 className="text-sm font-black uppercase text-slate-600 tracking-wider border-b border-slate-100 pb-2">
            {t('analytics.peakHourlyHeatmap')}
          </h3>
          <div className="h-[280px] bg-slate-50 border border-slate-100 rounded-lg flex flex-col justify-between p-4">
            <div className="space-y-3 w-full">
              {busyHours.map((hour) => {
                const percent = Math.round((hour.orders / busyMax) * 100);

                return (
                  <div key={hour.hour} className="space-y-1">
                    <div className="flex justify-between text-[10px] font-bold text-slate-600">
                      <span>{hour.hour}</span>
                      <span>
                        {hour.orders} {t('analytics.ordersCount')}
                      </span>
                    </div>
                    <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div className="h-full bg-orange-500" style={{ width: `${percent}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <div className="panel">
          <h3 className="text-sm font-black uppercase text-slate-600 tracking-wider border-b border-slate-100 pb-2">
            {t('dashboard.topDishes')}
          </h3>
          <div className="space-y-3 mt-4">
            {topDishes.map((dish, index) => (
              <div
                key={dish.menuItemId}
                className="flex items-center justify-between rounded-2xl border border-slate-100 px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-orange-100 text-xs font-black text-orange-700">
                    {index + 1}
                  </div>
                  <div>
                    <strong className="block text-sm text-slate-800">{dish.name}</strong>
                    <span className="text-xs text-slate-500">
                      {dish.quantitySold} {t('dashboard.soldCount')}
                    </span>
                  </div>
                </div>
                <strong className="text-sm text-slate-700">{formatCurrency(dish.revenue)}</strong>
              </div>
            ))}
          </div>
        </div>

        <div className="panel">
          <h3 className="text-sm font-black uppercase text-slate-600 tracking-wider border-b border-slate-100 pb-2">
            {t('analytics.orderStatusSummary')}
          </h3>
          <div className="space-y-3 mt-4">
            {[
              [statusLabel('PENDING'), summary?.pending ?? 0],
              [statusLabel('PREPARING'), summary?.preparing ?? 0],
              [statusLabel('READY'), summary?.ready ?? 0],
              [statusLabel('DELIVERED'), summary?.delivered ?? 0],
              [statusLabel('PAID'), summary?.paid ?? 0],
              [statusLabel('CANCELLED'), summary?.cancelled ?? 0],
            ].map(([label, value]) => (
              <div
                key={label}
                className="flex items-center justify-between rounded-2xl border border-slate-100 px-4 py-3"
              >
                <span className="text-sm font-semibold text-slate-600">{label}</span>
                <strong className="text-sm text-slate-800">{loading ? '...' : value}</strong>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
