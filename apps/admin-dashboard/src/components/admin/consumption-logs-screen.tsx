'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ClipboardList,
  Download,
  FileText,
  RefreshCw,
  Search,
  X,
} from 'lucide-react';
import type { InventoryConsumptionLogDTO, OrderType } from '@repo/shared-types';
import { getApiErrorMessage } from '@/lib/api-error';
import { useI18n } from '@/hooks/use-i18n';
import { useAppStore } from '@/store/app.store';
import { listConsumptionLogs } from '@/services/inventory-consumption-logs.service';

type DatePreset = 'today' | 'yesterday' | 'last7' | 'custom';

function getPresetRange(preset: DatePreset): { start: string; end: string } {
  const now = new Date();
  const end = now.toISOString().slice(0, 10);
  let start: string;
  switch (preset) {
    case 'today':
      start = end;
      break;
    case 'yesterday': {
      const y = new Date(now);
      y.setDate(y.getDate() - 1);
      start = y.toISOString().slice(0, 10);
      break;
    }
    case 'last7': {
      const w = new Date(now);
      w.setDate(w.getDate() - 7);
      start = w.toISOString().slice(0, 10);
      break;
    }
    default:
      start = end;
  }
  return { start, end };
}

export function ConsumptionLogsScreen() {
  const { t, dir, formatDateTime, formatNumber, locale } = useI18n();
  const restaurantId = useAppStore((state) => state.restaurantId);
  const printFrameRef = useRef<HTMLIFrameElement | null>(null);

  const [logs, setLogs] = useState<InventoryConsumptionLogDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [exportingPdf, setExportingPdf] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [datePreset, setDatePreset] = useState<DatePreset>('today');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [filterOrderType, setFilterOrderType] = useState('');
  const [filterItemName, setFilterItemName] = useState('');
  const [filterOrderNumber, setFilterOrderNumber] = useState('');

  const dateRange = useMemo(() => {
    if (datePreset === 'custom') {
      return { start: customStart, end: customEnd };
    }
    return getPresetRange(datePreset);
  }, [datePreset, customStart, customEnd]);

  const fetchLogs = useCallback(async () => {
    if (!restaurantId) {
      setLogs([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await listConsumptionLogs({
        startDate: dateRange.start || undefined,
        endDate: dateRange.end || undefined,
        orderType: filterOrderType || undefined,
        dailyOrderNumber: filterOrderNumber ? Number(filterOrderNumber) : undefined,
      });
      let filtered = data;
      if (filterItemName) {
        const q = filterItemName.toLowerCase();
        filtered = data.filter((l) => l.inventoryItemName.toLowerCase().includes(q));
      }
      setLogs(filtered);
    } catch (e) {
      setError(getApiErrorMessage(e, t('consumptionLogs.title')));
    } finally {
      setLoading(false);
    }
  }, [restaurantId, dateRange, filterOrderType, filterOrderNumber, filterItemName, t]);

  useEffect(() => {
    void fetchLogs();
  }, [fetchLogs]);

  const orderTypeLabel = (type: OrderType | null) => {
    if (type === 'DINE_IN') return t('consumptionLogs.dineIn');
    if (type === 'TAKEAWAY') return t('consumptionLogs.takeaway');
    if (type === 'DELIVERY') return t('consumptionLogs.delivery');
    return '-';
  };

  const orderTypeBadge = (type: OrderType | null) => {
    if (type === 'DINE_IN') return 'bg-blue-50 text-blue-700 border border-blue-200';
    if (type === 'TAKEAWAY') return 'bg-amber-50 text-amber-700 border border-amber-200';
    if (type === 'DELIVERY') return 'bg-purple-50 text-purple-700 border border-purple-200';
    return 'bg-gray-50 text-gray-500 border border-gray-200';
  };

  const typeBadge = (type: InventoryConsumptionLogDTO['type']) => {
    if (type === 'AUTO_DEDUCTION') return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
    return 'bg-orange-50 text-orange-700 border border-orange-200';
  };

  const typeLabel = (type: InventoryConsumptionLogDTO['type']) =>
    type === 'AUTO_DEDUCTION' ? t('consumptionLogs.auto') : t('consumptionLogs.manual');

  const presetOptions: { value: DatePreset; label: string }[] = [
    { value: 'today', label: t('consumptionLogs.today') },
    { value: 'yesterday', label: t('consumptionLogs.yesterday') },
    { value: 'last7', label: t('consumptionLogs.last7Days') },
    { value: 'custom', label: t('consumptionLogs.customRange') },
  ];

  function handleExportCsv() {
    const headers = [t('consumptionLogs.item'), t('consumptionLogs.qtyUsed'), t('consumptionLogs.unit'), t('consumptionLogs.consumptionType'), t('consumptionLogs.orderNumber'), t('consumptionLogs.orderType'), t('consumptionLogs.table'), t('consumptionLogs.date')];
    const rows = logs.map((log) => [
      log.inventoryItemName,
      String(log.quantityUsed),
      log.unit ?? '',
      log.type === 'AUTO_DEDUCTION' ? t('consumptionLogs.auto') : t('consumptionLogs.manual'),
      log.dailyOrderNumber ? `#${log.dailyOrderNumber}` : '-',
      log.orderType ?? '-',
      log.tableName ?? '-',
      formatDateTime(log.createdAt),
    ]);
    const csv = [headers, ...rows].map((row) => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `consumption-logs-${dateRange.start}-${dateRange.end}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  function generatePdfHtml(): string {
    const isRtl = dir === 'rtl';
    const totalQty = logs.reduce((s, l) => s + l.quantityUsed, 0);
    const uniqueItems = new Set(logs.map((l) => l.inventoryItemName)).size;

    const tableRows = logs
      .map(
        (log) => `
      <tr>
        <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;font-size:13px;${isRtl ? 'text-align:right' : ''}">${log.inventoryItemName}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;font-size:13px;text-align:center;color:#dc2626;font-weight:700">${formatNumber(log.quantityUsed)}${log.unit ? ' ' + t('inventory.unit.' + log.unit) : ''}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;font-size:13px;text-align:center">${log.orderType ? orderTypeLabel(log.orderType) : '-'}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;font-size:13px;text-align:center">${log.tableName ?? '-'}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;font-size:13px;text-align:center">${log.dailyOrderNumber ? `#${log.dailyOrderNumber}` : '-'}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;font-size:13px;text-align:center">${formatDateTime(log.createdAt)}</td>
      </tr>`,
      )
      .join('');

    return `<!DOCTYPE html>
<html dir="${isRtl ? 'rtl' : 'ltr'}" lang="${locale}">
<head>
<meta charset="utf-8">
<title>${t('consumptionLogs.pdfTitle')}</title>
<style>
  @page { margin: 20mm 15mm; }
  body { font-family: Arial, Helvetica, sans-serif; margin: 0; padding: 0; color: #1f2937; }
  .header { text-align: center; padding: 20px 0 16px; border-bottom: 3px solid #ac2d00; margin-bottom: 20px; }
  .header h1 { margin: 0; font-size: 22px; color: #111827; }
  .header p { margin: 6px 0 0; font-size: 13px; color: #6b7280; }
  .summary { display: flex; justify-content: space-around; padding: 16px 0; gap: 16px; }
  .summary-item { text-align: center; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 12px 20px; flex: 1; }
  .summary-item .num { font-size: 24px; font-weight: 700; color: #111827; margin: 4px 0 0; }
  .summary-item .lbl { font-size: 11px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em; }
  table { width: 100%; border-collapse: collapse; margin-top: 16px; }
  th { background: #f3f4f6; padding: 10px 12px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #6b7280; border-bottom: 2px solid #d1d5db; ${isRtl ? 'text-align:right' : 'text-align:left'} }
  td { padding: 8px 12px; font-size: 13px; border-bottom: 1px solid #e5e7eb; }
  .footer { text-align: center; margin-top: 24px; padding-top: 12px; border-top: 1px solid #e5e7eb; font-size: 11px; color: #9ca3af; }
</style>
</head>
<body>
<div class="header">
  <h1>${t('consumptionLogs.pdfTitle')}</h1>
  <p>${dateRange.start} — ${dateRange.end} | ${t('consumptionLogs.pdfSubtitle')}</p>
</div>
<div class="summary">
  <div class="summary-item"><div class="lbl">${t('consumptionLogs.recordsFound').replace('{count}', String(logs.length))}</div><div class="num">${logs.length}</div></div>
  <div class="summary-item"><div class="lbl">${t('consumptionLogs.totalItems')}</div><div class="num">${uniqueItems}</div></div>
  <div class="summary-item"><div class="lbl">${t('consumptionLogs.totalQuantity')}</div><div class="num">${formatNumber(totalQty)}</div></div>
</div>
<table>
  <thead><tr>
    <th>${t('consumptionLogs.item')}</th>
    <th style="text-align:center">${t('consumptionLogs.qtyUsed')}</th>
    <th style="text-align:center">${t('consumptionLogs.orderType')}</th>
    <th style="text-align:center">${t('consumptionLogs.table')}</th>
    <th style="text-align:center">${t('consumptionLogs.orderRef')}</th>
    <th style="text-align:center">${t('consumptionLogs.date')}</th>
  </tr></thead>
  <tbody>${tableRows}</tbody>
</table>
<div class="footer">${t('consumptionLogs.pdfTitle')} — ${new Date().toLocaleDateString(locale)}</div>
</body>
</html>`;
  }

  function handleExportPdf() {
    setExportingPdf(true);
    try {
      const html = generatePdfHtml();
      const blob = new Blob([html], { type: 'text/html' });
      const url = URL.createObjectURL(blob);

      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `consumption-logs-${dateRange.start}-${dateRange.end}.html`;
      anchor.click();

      const iframe = document.createElement('iframe');
      iframe.style.position = 'fixed';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = 'none';
      iframe.src = url;
      document.body.appendChild(iframe);
      printFrameRef.current = iframe;

      iframe.onload = () => {
        setTimeout(() => {
          try {
            iframe.contentWindow?.print();
          } catch {
            window.open(url, '_blank');
          }
          setTimeout(() => {
            document.body.removeChild(iframe);
            URL.revokeObjectURL(url);
            setExportingPdf(false);
          }, 1000);
        }, 500);
      };
    } catch {
      setExportingPdf(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{t('consumptionLogs.title')}</h2>
          <p className="text-sm text-gray-500 mt-1">{t('consumptionLogs.subtitle')}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleExportPdf}
            disabled={exportingPdf || logs.length === 0}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <FileText size={16} />
            <span>{exportingPdf ? t('consumptionLogs.exportingPdf') : t('consumptionLogs.exportPdf')}</span>
          </button>
          <button
            type="button"
            onClick={handleExportCsv}
            disabled={logs.length === 0}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <Download size={16} />
            <span>{t('consumptionLogs.exportCsv')}</span>
          </button>
          <button
            type="button"
            onClick={() => void fetchLogs()}
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-lg text-sm font-bold hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            <span>{t('consumptionLogs.refresh')}</span>
          </button>
        </div>
      </div>

      {error ? (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">{error}</div>
      ) : null}

      {/* Filter Bar */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
        <div className="flex flex-wrap items-end gap-4">
          {/* Date Preset */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">{t('consumptionLogs.dateRange')}</label>
            <div className="flex gap-1.5">
              {presetOptions.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setDatePreset(opt.value)}
                  className={`px-3 py-2 text-sm rounded-lg border transition-all font-medium ${
                    datePreset === opt.value
                      ? 'bg-primary text-white border-primary shadow-sm'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Custom Date Range */}
          {datePreset === 'custom' && (
            <div className="flex items-end gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">{t('consumptionLogs.fromDate')}</label>
                <input
                  type="date"
                  value={customStart}
                  onChange={(e) => setCustomStart(e.target.value)}
                  className="px-3 py-2 bg-white border border-gray-300 text-gray-900 rounded-lg text-sm focus:border-primary focus:ring-1 focus:ring-primary"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">{t('consumptionLogs.toDate')}</label>
                <input
                  type="date"
                  value={customEnd}
                  onChange={(e) => setCustomEnd(e.target.value)}
                  className="px-3 py-2 bg-white border border-gray-300 text-gray-900 rounded-lg text-sm focus:border-primary focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>
          )}

          {/* Order Type Filter */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">{t('consumptionLogs.orderType')}</label>
            <select
              value={filterOrderType}
              onChange={(e) => setFilterOrderType(e.target.value)}
              className="px-3 py-2 bg-white border border-gray-300 text-gray-900 rounded-lg text-sm focus:border-primary focus:ring-1 focus:ring-primary"
            >
              <option value="">{t('consumptionLogs.allOrderTypes')}</option>
              <option value="DINE_IN">{t('consumptionLogs.dineIn')}</option>
              <option value="TAKEAWAY">{t('consumptionLogs.takeaway')}</option>
              <option value="DELIVERY">{t('consumptionLogs.delivery')}</option>
            </select>
          </div>

          {/* Ingredient Name Search */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">{t('consumptionLogs.item')}</label>
            <div className="relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={filterItemName}
                onChange={(e) => setFilterItemName(e.target.value)}
                placeholder={t('consumptionLogs.allItems')}
                className="pl-9 pr-3 py-2 bg-white border border-gray-300 text-gray-900 placeholder-gray-400 rounded-lg text-sm focus:border-primary focus:ring-1 focus:ring-primary w-48"
              />
              {filterItemName && (
                <button
                  type="button"
                  onClick={() => setFilterItemName('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X size={15} />
                </button>
              )}
            </div>
          </div>

          {/* Order Number Filter */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">{t('consumptionLogs.orderNumber')}</label>
            <input
              type="number"
              min="0"
              value={filterOrderNumber}
              onChange={(e) => setFilterOrderNumber(e.target.value)}
              placeholder="#"
              className="px-3 py-2 bg-white border border-gray-300 text-gray-900 placeholder-gray-400 rounded-lg text-sm focus:border-primary focus:ring-1 focus:ring-primary w-24"
            />
          </div>
        </div>
      </div>

      {/* Table Count */}
      <div className="text-sm text-gray-500">
        {t('consumptionLogs.recordsFound').replace('{count}', String(logs.length))}
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center gap-3 py-20 text-gray-500">
            <RefreshCw size={20} className="animate-spin" />
            <span>{t('consumptionLogs.loading')}</span>
          </div>
        ) : logs.length === 0 ? (
          <div className="py-20 text-center">
            <ClipboardList size={48} className="mx-auto text-gray-300 mb-3" />
            <p className="text-sm text-gray-500">{t('consumptionLogs.noOrdersYet')}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse" dir={dir}>
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="px-5 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">{t('consumptionLogs.item')}</th>
                  <th className="px-5 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-center">{t('consumptionLogs.qtyUsed')}</th>
                  <th className="px-5 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-center">{t('consumptionLogs.consumptionType')}</th>
                  <th className="px-5 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-center">{t('consumptionLogs.orderInfo')}</th>
                  <th className="px-5 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-center">{t('consumptionLogs.orderRef')}</th>
                  <th className="px-5 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-center">{t('consumptionLogs.date')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-4 text-sm font-semibold text-gray-900 whitespace-nowrap">
                      {log.inventoryItemName}
                    </td>
                    <td className="px-5 py-4 text-center whitespace-nowrap">
                      <span className="inline-flex items-center justify-center min-w-[60px] px-2.5 py-1 text-sm font-bold text-red-600 bg-red-50 rounded-md">
                        -{formatNumber(log.quantityUsed)}{log.unit ? ` ${t('inventory.unit.' + log.unit)}` : ''}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-center whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-1 text-xs font-bold rounded-md ${typeBadge(log.type)}`}>
                        {typeLabel(log.type)}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-center whitespace-nowrap">
                      <div className="flex flex-col items-center gap-0.5">
                        <span className={`inline-flex items-center px-2 py-0.5 text-xs font-semibold rounded ${orderTypeBadge(log.orderType)}`}>
                          {orderTypeLabel(log.orderType)}
                        </span>
                        {log.tableName && (
                          <span className="text-xs text-gray-500">
                            {t('consumptionLogs.dineInTable').replace('{name}', log.tableName)}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-4 text-center text-sm text-gray-600 font-mono whitespace-nowrap">
                      {log.dailyOrderNumber ? `#${log.dailyOrderNumber}` : '-'}
                    </td>
                    <td className="px-5 py-4 text-center text-sm text-gray-500 whitespace-nowrap">
                      {formatDateTime(log.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
