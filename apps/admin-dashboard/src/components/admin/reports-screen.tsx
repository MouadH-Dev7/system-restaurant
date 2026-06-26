'use client';

import { useEffect, useMemo, useState } from 'react';
import { AlertCircle, Download, Plus, RefreshCw } from 'lucide-react';
import type { ReportExportJobDTO, ReportType } from '@repo/shared-types';
import { getApiErrorMessage } from '@/lib/api-error';
import { useI18n } from '@/hooks/use-i18n';
import { useAppStore } from '@/store/app.store';
import { getRevenueChart } from '@/services/analytics.service';
import { createReport, listReports } from '@/services/reports.service';

export function ReportsScreen() {
  const { t, formatCurrency, formatDateTime, formatNumber, reportTypeLabel, statusLabel } =
    useI18n();
  const restaurantId = useAppStore((state) => state.restaurantId);
  const [reports, setReports] = useState<ReportExportJobDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [revenueMeta, setRevenueMeta] = useState<string>(t('dashboard.loading'));
  const [draft, setDraft] = useState({
    name: '',
    type: 'FINANCIAL' as ReportType,
    format: 'CSV' as 'CSV' | 'JSON',
    rangeStart: '',
    rangeEnd: '',
  });

  async function load() {
    const activeRestaurantId = restaurantId;

    if (!activeRestaurantId) {
      setReports([]);
      setRevenueMeta(t('dashboard.loading'));
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const [reportData, revenueData] = await Promise.all([
        listReports(activeRestaurantId),
        getRevenueChart('weekly'),
      ]);

      setReports(reportData);
      const total = revenueData.datasets[0]?.data.reduce((sum, value) => sum + value, 0) ?? 0;
      setRevenueMeta(`${t('reports.weeklyRevenueTotal')}: ${formatCurrency(total)}`);
    } catch (nextError) {
      setError(getApiErrorMessage(nextError, t('reports.title')));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, [formatCurrency, t]);

  const reportStats = useMemo(() => {
    return {
      total: reports.length,
      completed: reports.filter((report) => report.status === 'COMPLETED').length,
      financial: reports.filter((report) => report.type === 'FINANCIAL').length,
    };
  }, [reports]);

  async function handleCreate() {
    const activeRestaurantId = restaurantId;

    if (!activeRestaurantId) {
      setError(t('reports.title'));
      return;
    }

    if (!draft.rangeStart || !draft.rangeEnd) {
      setError(t('reports.invalidDateRange'));
      return;
    }

    try {
      setSaving(true);
      setError(null);
      await createReport({
        restaurantId: activeRestaurantId,
        name: draft.name || `${reportTypeLabel(draft.type)} ${t('reports.defaultReportSuffix')}`,
        type: draft.type,
        format: draft.format,
        rangeStart: new Date(draft.rangeStart).toISOString(),
        rangeEnd: new Date(draft.rangeEnd).toISOString(),
      });
      setDraft({ name: '', type: 'FINANCIAL', format: 'CSV', rangeStart: '', rangeEnd: '' });
      await load();
    } catch (nextError) {
      setError(getApiErrorMessage(nextError, t('reports.create')));
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <section className="page-header">
        <div>
          <h2>{t('reports.title')}</h2>
          <p>{t('reports.subtitle')}</p>
        </div>
        <button type="button" className="ghost-btn" onClick={() => void load()}>
          <RefreshCw size={16} />
          <span>{t('menu.refresh')}</span>
        </button>
      </section>

      {error ? (
        <div className="panel error-banner flex items-center gap-2 mt-4 text-xs font-bold">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      ) : null}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
        <div className="panel">
          <strong>{formatNumber(reportStats.total)}</strong>
          <p>{t('reports.total')}</p>
        </div>
        <div className="panel">
          <strong>{formatNumber(reportStats.completed)}</strong>
          <p>{t('reports.completed')}</p>
        </div>
        <div className="panel">
          <strong>{formatNumber(reportStats.financial)}</strong>
          <p>{t('reports.financial')}</p>
        </div>
      </div>

      <section className="panel mt-6">
        <div className="panel-header">
          <div>
            <h3>{t('reports.create')}</h3>
            <p>{revenueMeta}</p>
          </div>
        </div>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-5 mt-4">
          <input
            className="rounded-2xl border border-slate-200 px-4 py-3 text-sm"
            placeholder={t('reports.reportName')}
            value={draft.name}
            onChange={(e) => setDraft((s) => ({ ...s, name: e.target.value }))}
          />
          <select
            className="rounded-2xl border border-slate-200 px-4 py-3 text-sm"
            value={draft.type}
            onChange={(e) => setDraft((s) => ({ ...s, type: e.target.value as ReportType }))}
          >
            <option value="FINANCIAL">{reportTypeLabel('FINANCIAL')}</option>
            <option value="OPERATIONS">{reportTypeLabel('OPERATIONS')}</option>
            <option value="PRINTING">{reportTypeLabel('PRINTING')}</option>
          </select>
          <select
            className="rounded-2xl border border-slate-200 px-4 py-3 text-sm"
            value={draft.format}
            onChange={(e) => setDraft((s) => ({ ...s, format: e.target.value as 'CSV' | 'JSON' }))}
          >
            <option value="CSV">CSV</option>
            <option value="JSON">JSON</option>
          </select>
          <input
            className="rounded-2xl border border-slate-200 px-4 py-3 text-sm"
            type="date"
            aria-label={t('common.rangeStart')}
            value={draft.rangeStart}
            onChange={(e) => setDraft((s) => ({ ...s, rangeStart: e.target.value }))}
          />
          <input
            className="rounded-2xl border border-slate-200 px-4 py-3 text-sm"
            type="date"
            aria-label={t('common.rangeEnd')}
            value={draft.rangeEnd}
            onChange={(e) => setDraft((s) => ({ ...s, rangeEnd: e.target.value }))}
          />
        </div>
        <button
          type="button"
          className="primary-btn mt-4"
          disabled={saving}
          onClick={() => void handleCreate()}
        >
          <Plus size={16} />
          <span>{saving ? t('common.generating') : t('reports.generate')}</span>
        </button>
      </section>

      <section className="panel mt-6">
        <div className="panel-header">
          <div>
            <h3>{t('reports.archived')}</h3>
            <p>{t('reports.archivedDescription')}</p>
          </div>
        </div>
        {loading ? (
          <div className="p-10 text-center text-slate-400">{t('reports.loading')}</div>
        ) : (
          <div className="space-y-3 mt-4">
            {reports.map((report) => (
              <div
                key={report.id}
                className="rounded-2xl border border-slate-100 p-4 flex items-center justify-between gap-3"
              >
                <div>
                  <strong className="block text-slate-800">{report.name}</strong>
                  <span className="text-xs text-slate-500">
                    {reportTypeLabel(report.type)} / {report.format} / {statusLabel(report.status)}{' '}
                    / {t('reports.rows')}: {formatNumber(report.rowCount)}
                  </span>
                  <div className="mt-2 text-xs text-slate-500">
                    {formatDateTime(report.rangeStart)} - {formatDateTime(report.rangeEnd)}
                  </div>
                </div>
                <button type="button" className="ghost-btn small">
                  <Download size={14} />
                  <span>{report.format}</span>
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
