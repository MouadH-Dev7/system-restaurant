'use client';

import { useEffect, useMemo, useState } from 'react';
import { AlertCircle, RefreshCw, Search } from 'lucide-react';
import type { AuditLogDTO } from '@repo/shared-types';
import { getApiErrorMessage } from '@/lib/api-error';
import { useI18n } from '@/hooks/use-i18n';
import { useAppStore } from '@/store/app.store';
import { listLogs } from '@/services/logs.service';

type OrderAuditDetails = {
  orderId?: string;
  dailyOrderNumber?: number;
  tableNumber?: number | null;
  orderType?: string;
  previousStatus?: string;
  nextStatus?: string;
  previousTotal?: number;
  nextTotal?: number;
  totalDelta?: number;
  previousItemCount?: number;
  nextItemCount?: number;
  previousItems?: Array<{
    menuItemName?: string;
    quantity?: number;
    lineTotal?: number;
    notes?: string | null;
    modifiers?: string[];
  }>;
  nextItems?: Array<{
    menuItemName?: string;
    quantity?: number;
    lineTotal?: number;
    notes?: string | null;
    modifiers?: string[];
  }>;
  paymentMethod?: string | null;
  riskFlags?: string[];
};

function asOrderAuditDetails(value: unknown): OrderAuditDetails | null {
  if (!value || typeof value !== 'object') {
    return null;
  }

  return value as OrderAuditDetails;
}

function endOfDayIso(value: string) {
  return new Date(`${value}T23:59:59.999`).toISOString();
}

export function LogsScreen() {
  const { t, formatCurrency, formatDateTime, roleLabel, statusLabel, riskFlagLabel, paymentMethodLabel } = useI18n();
  const restaurantId = useAppStore((state) => state.restaurantId);
  const [logs, setLogs] = useState<AuditLogDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    role: '',
    module: '',
    status: '',
    userName: '',
    action: '',
    from: '',
    to: '',
  });

  async function load() {
    const activeRestaurantId = restaurantId;

    if (!activeRestaurantId) {
      setLogs([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setLogs(
        await listLogs(activeRestaurantId, {
          role: filters.role || undefined,
          module: filters.module || undefined,
          status: filters.status || undefined,
          userName: filters.userName.trim() || undefined,
          action: filters.action.trim() || undefined,
          from: filters.from ? new Date(`${filters.from}T00:00:00.000`).toISOString() : undefined,
          to: filters.to ? endOfDayIso(filters.to) : undefined,
        }),
      );
    } catch (nextError) {
      setError(getApiErrorMessage(nextError, t('logs.title')));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, [restaurantId]);

  const flaggedCount = useMemo(
    () =>
      logs.filter((log) => {
        const details = asOrderAuditDetails(log.details);
        return (details?.riskFlags?.length ?? 0) > 0;
      }).length,
    [logs],
  );

  const waiterAndCashierCount = useMemo(
    () => logs.filter((log) => log.role === 'WAITER' || log.role === 'CASHIER').length,
    [logs],
  );

  return (
    <>
      <section className="page-header">
        <div>
          <h2>{t('logs.title')}</h2>
          <p>{t('logs.subtitle')}</p>
        </div>
        <button type="button" className="ghost-btn" onClick={() => void load()}>
          <RefreshCw size={16} />
          <span>{t('menu.refresh')}</span>
        </button>
      </section>

      <section className="grid grid-cols-1 gap-6 md:grid-cols-3 mt-4">
        <div className="panel">
          <strong>{logs.length}</strong>
          <p>{t('logs.visibleRecords')}</p>
        </div>
        <div className="panel">
          <strong>{waiterAndCashierCount}</strong>
          <p>{t('logs.waiterCashierActions')}</p>
        </div>
        <div className="panel">
          <strong>{flaggedCount}</strong>
          <p>{t('logs.recordsForReview')}</p>
        </div>
      </section>

      {error ? (
        <div className="panel error-banner mt-4 flex items-center gap-2 text-xs font-bold">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      ) : null}

      <section className="panel mt-6">
        <div className="panel-header">
          <div>
            <h3>{t('logs.filtersTitle')}</h3>
            <p>{t('logs.filtersSubtitle')}</p>
          </div>
        </div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4 mt-4">
          <select
            className="rounded-2xl border border-slate-200 px-4 py-3 text-sm"
            value={filters.role}
            onChange={(event) => setFilters((current) => ({ ...current, role: event.target.value }))}
          >
            <option value="">{t('logs.allRoles')}</option>
            <option value="WAITER">{roleLabel('WAITER')}</option>
            <option value="CASHIER">{roleLabel('CASHIER')}</option>
            <option value="CHEF">{roleLabel('CHEF')}</option>
            <option value="MANAGER">{roleLabel('MANAGER')}</option>
            <option value="ADMIN">{roleLabel('ADMIN')}</option>
          </select>
          <select
            className="rounded-2xl border border-slate-200 px-4 py-3 text-sm"
            value={filters.module}
            onChange={(event) =>
              setFilters((current) => ({ ...current, module: event.target.value }))
            }
          >
            <option value="">{t('logs.allModules')}</option>
            <option value="ORDERS">{t('nav.orders')}</option>
            <option value="WAITER_NOTIFICATIONS">{t('logs.waiterNotifications')}</option>
            <option value="PRINTING">{t('nav.printers')}</option>
            <option value="STAFF">{t('nav.staff')}</option>
            <option value="SETTINGS">{t('nav.settings')}</option>
          </select>
          <select
            className="rounded-2xl border border-slate-200 px-4 py-3 text-sm"
            value={filters.status}
            onChange={(event) =>
              setFilters((current) => ({ ...current, status: event.target.value }))
            }
          >
            <option value="">{t('logs.allStatuses')}</option>
            <option value="SUCCESS">{statusLabel('SUCCESS')}</option>
            <option value="WARNING">{statusLabel('WARNING')}</option>
            <option value="FAILED">{statusLabel('FAILED')}</option>
          </select>
          <input
            className="rounded-2xl border border-slate-200 px-4 py-3 text-sm"
            placeholder={t('logs.employeeName')}
            value={filters.userName}
            onChange={(event) =>
              setFilters((current) => ({ ...current, userName: event.target.value }))
            }
          />
          <input
            className="rounded-2xl border border-slate-200 px-4 py-3 text-sm"
            placeholder={t('logs.actionContains')}
            value={filters.action}
            onChange={(event) =>
              setFilters((current) => ({ ...current, action: event.target.value }))
            }
          />
          <input
            className="rounded-2xl border border-slate-200 px-4 py-3 text-sm"
            type="date"
            value={filters.from}
            onChange={(event) => setFilters((current) => ({ ...current, from: event.target.value }))}
          />
          <input
            className="rounded-2xl border border-slate-200 px-4 py-3 text-sm"
            type="date"
            value={filters.to}
            onChange={(event) => setFilters((current) => ({ ...current, to: event.target.value }))}
          />
          <button type="button" className="primary-btn" onClick={() => void load()}>
            <Search size={16} />
            <span>{t('logs.applyFilters')}</span>
          </button>
        </div>
      </section>

      <section className="panel mt-6">
        {loading ? (
          <div className="p-10 text-center text-slate-400">{t('logs.loading')}</div>
        ) : (
          <div className="space-y-3">
            {logs.map((log) => (
              (() => {
                const details = asOrderAuditDetails(log.details);
                const riskFlags = details?.riskFlags ?? [];
                const previousTotal = details?.previousTotal;
                const nextTotal = details?.nextTotal;
                const previousItems = details?.previousItems ?? [];
                const nextItems = details?.nextItems ?? [];

                return (
                  <div key={log.id} className="rounded-2xl border border-slate-100 p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <strong className="block text-slate-800">
                          {log.userName} / {log.module}
                        </strong>
                        <span className="text-xs text-slate-500">
                          {roleLabel(log.role)} / {statusLabel(log.status)} /{' '}
                          {formatDateTime(log.createdAt)}
                        </span>
                        <div className="mt-2 text-sm text-slate-700">{log.action}</div>
                      </div>
                      {riskFlags.length > 0 ? (
                        <div className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">
                          {t('logs.review')}: {riskFlags.map(riskFlagLabel).join(', ')}
                        </div>
                      ) : null}
                    </div>

                    {details?.orderId ? (
                      <div className="mt-4 grid gap-3 md:grid-cols-3">
                        <div className="rounded-2xl bg-slate-50 p-3 text-sm">
                          <div className="font-semibold text-slate-700">{t('logs.order')}</div>
                          <div>#{details.dailyOrderNumber ?? '-'}</div>
                          <div>{t('logs.table')}: {details.tableNumber ?? t('logs.takeaway')}</div>
                          <div>{t('logs.type')}: {details.orderType ?? '-'}</div>
                        </div>
                        <div className="rounded-2xl bg-slate-50 p-3 text-sm">
                          <div className="font-semibold text-slate-700">{t('logs.statusBlock')}</div>
                          <div>
                            {details.previousStatus ?? '-'} to {details.nextStatus ?? '-'}
                          </div>
                          <div>
                            {t('logs.itemsSummary')}: {details.previousItemCount ?? '-'} to {details.nextItemCount ?? '-'}
                          </div>
                          {details.paymentMethod ? <div>{t('logs.payment')}: {paymentMethodLabel(details.paymentMethod)}</div> : null}
                        </div>
                        <div className="rounded-2xl bg-slate-50 p-3 text-sm">
                          <div className="font-semibold text-slate-700">{t('logs.financial')}</div>
                          <div>
                            {t('logs.before')}: {previousTotal !== undefined ? formatCurrency(previousTotal) : '-'}
                          </div>
                          <div>
                            {t('logs.after')}: {nextTotal !== undefined ? formatCurrency(nextTotal) : '-'}
                          </div>
                          {typeof details.totalDelta === 'number' ? (
                            <div>
                              {t('logs.delta')}: {details.totalDelta > 0 ? '+' : ''}
                              {formatCurrency(details.totalDelta)}
                            </div>
                          ) : null}
                        </div>
                      </div>
                    ) : null}

                    {previousItems.length > 0 || nextItems.length > 0 ? (
                      <div className="mt-4 grid gap-3 md:grid-cols-2">
                        <div className="rounded-2xl border border-rose-100 bg-rose-50/60 p-3">
                          <div className="mb-2 text-sm font-semibold text-rose-800">{t('logs.before')}</div>
                          <div className="space-y-2 text-sm text-slate-700">
                            {previousItems.map((item, index) => (
                              <div key={`previous-${log.id}-${index}`} className="rounded-xl bg-white/80 p-2">
                                <div className="font-medium">
                                  {item.menuItemName ?? t('logs.itemFallback')} x{item.quantity ?? 0}
                                </div>
                                {typeof item.lineTotal === 'number' ? (
                                  <div>{formatCurrency(item.lineTotal)}</div>
                                ) : null}
                                {item.notes ? <div>{t('logs.notes')}: {item.notes}</div> : null}
                              </div>
                            ))}
                          </div>
                        </div>
                        <div className="rounded-2xl border border-emerald-100 bg-emerald-50/60 p-3">
                          <div className="mb-2 text-sm font-semibold text-emerald-800">{t('logs.after')}</div>
                          <div className="space-y-2 text-sm text-slate-700">
                            {nextItems.map((item, index) => (
                              <div key={`next-${log.id}-${index}`} className="rounded-xl bg-white/80 p-2">
                                <div className="font-medium">
                                  {item.menuItemName ?? t('logs.itemFallback')} x{item.quantity ?? 0}
                                </div>
                                {typeof item.lineTotal === 'number' ? (
                                  <div>{formatCurrency(item.lineTotal)}</div>
                                ) : null}
                                {item.notes ? <div>{t('logs.notes')}: {item.notes}</div> : null}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    ) : null}
                  </div>
                );
              })()
            ))}
          </div>
        )}
      </section>
    </>
  );
}
