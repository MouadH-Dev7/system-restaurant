'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Download,
  FileText,
  RefreshCw,
  Search,
  X,
} from 'lucide-react';
import type { AuditLogDTO, PaginatedResponse } from '@repo/shared-types';
import { getApiErrorMessage } from '@/lib/api-error';
import { useI18n } from '@/hooks/use-i18n';
import { useAppStore } from '@/store/app.store';
import { useAuthStore } from '@/auth/store';
import { listLogs, listLogUsers } from '@/services/logs.service';
import { translate, type AdminLanguage } from '@/lib/i18n';

type DatePreset = 'today' | 'yesterday' | 'thisWeek' | 'thisMonth' | 'custom';

function getPresetRange(preset: DatePreset): { from: string; to: string } {
  const now = new Date();
  const to = now.toISOString().slice(0, 10);
  let from: string;
  switch (preset) {
    case 'today':
      from = to;
      break;
    case 'yesterday': {
      const y = new Date(now);
      y.setDate(y.getDate() - 1);
      from = y.toISOString().slice(0, 10);
      break;
    }
    case 'thisWeek': {
      const w = new Date(now);
      w.setDate(w.getDate() - w.getDay());
      from = w.toISOString().slice(0, 10);
      break;
    }
    case 'thisMonth':
      from = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
      break;
    default:
      from = to;
  }
  return { from, to };
}

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
  amountDelta?: number;
  staffCode?: string;
  orderTypeLabel?: string;
};

function asOrderAuditDetails(value: unknown): OrderAuditDetails | null {
  if (!value || typeof value !== 'object') return null;
  return value as OrderAuditDetails;
}

function endOfDayIso(value: string) {
  return new Date(`${value}T23:59:59.999`).toISOString();
}

function computeRoleStats(logs: AuditLogDTO[]) {
  let takeawayOrders = 0;
  let totalCash = 0;
  let totalCard = 0;
  let ordersCreated = 0;
  let ordersDelivered = 0;
  let dishesPrepared = 0;

  for (const log of logs) {
    const d = asOrderAuditDetails(log.details);
    if (!d) continue;

    if (log.role === 'CASHIER') {
      if (d.orderType === 'TAKEAWAY' || d.orderTypeLabel?.toLowerCase().includes('takeaway')) {
        takeawayOrders++;
      }
      if (d.paymentMethod === 'CASH' && typeof d.nextTotal === 'number') {
        totalCash += d.nextTotal;
      }
      if (d.paymentMethod === 'CARD' && typeof d.nextTotal === 'number') {
        totalCard += d.nextTotal;
      }
    }

    if (log.role === 'WAITER') {
      if (log.action.includes('CREATE') || log.action === 'ORDER_CREATED') {
        ordersCreated++;
      }
      if (log.action === 'ORDER_DELIVERED' || log.action.includes('DELIVER')) {
        ordersDelivered++;
      }
    }

    if (log.role === 'CHEF') {
      if (log.action === 'ORDER_PREPARING' || log.action === 'ORDER_READY' || log.action.includes('PREPARE')) {
        ordersPreparedCount++;
      }
      const prevCount = d.previousItemCount ?? 0;
      const nextCount = d.nextItemCount ?? 0;
      if (nextCount > prevCount) {
        dishesPrepared += nextCount - prevCount;
      } else if (nextCount > 0) {
        dishesPrepared += nextCount;
      }
    }
  }

  return { takeawayOrders, totalCash, totalCard, ordersCreated, ordersDelivered, dishesPrepared };
}

let ordersPreparedCount = 0;

type ReportType = 'summary' | 'detailed';

export function LogsScreen() {
  const { t, formatCurrency, formatDateTime, roleLabel, statusLabel, riskFlagLabel, paymentMethodLabel, language, dir, locale } = useI18n();
  const restaurantId = useAppStore((state) => state.restaurantId);

  const [pageData, setPageData] = useState<PaginatedResponse<AuditLogDTO> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exportingPdf, setExportingPdf] = useState(false);

  const [datePreset, setDatePreset] = useState<DatePreset>('today');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [filterUser, setFilterUser] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const [users, setUsers] = useState<string[]>([]);
  const printFrameRef = useRef<HTMLIFrameElement | null>(null);
  const [showPdfModal, setShowPdfModal] = useState(false);
  const [pdfLang, setPdfLang] = useState<AdminLanguage>(language);
  const [pdfReportType, setPdfReportType] = useState<ReportType>('detailed');

  const dateRange = useMemo(() => {
    if (datePreset === 'custom') {
      return { from: customFrom, to: customTo };
    }
    return getPresetRange(datePreset);
  }, [datePreset, customFrom, customTo]);

  const load = useCallback(async () => {
    const activeRestaurantId = restaurantId;
    if (!activeRestaurantId) {
      setPageData(null);
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const result = await listLogs(activeRestaurantId, {
        role: filterRole || undefined,
        userName: filterUser || undefined,
        from: dateRange.from ? new Date(`${dateRange.from}T00:00:00.000`).toISOString() : undefined,
        to: dateRange.to ? endOfDayIso(dateRange.to) : undefined,
        page: currentPage,
        limit: 15,
      });
      setPageData(result);
    } catch (nextError) {
      setError(getApiErrorMessage(nextError, t('logs.title')));
    } finally {
      setLoading(false);
    }
  }, [restaurantId, filterRole, filterUser, dateRange, currentPage, t]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    setCurrentPage(1);
  }, [datePreset, customFrom, customTo, filterRole, filterUser]);

  useEffect(() => {
    if (!restaurantId) return;
    listLogUsers(restaurantId).then(setUsers).catch(() => {});
  }, [restaurantId]);

  const logs = pageData?.data ?? [];
  const total = pageData?.total ?? 0;
  const totalPages = pageData?.totalPages ?? 0;

  const flaggedCount = useMemo(
    () => logs.filter((log) => {
      const details = asOrderAuditDetails(log.details);
      return (details?.riskFlags?.length ?? 0) > 0;
    }).length,
    [logs],
  );

  const waiterAndCashierCount = useMemo(
    () => logs.filter((log) => log.role === 'WAITER' || log.role === 'CASHIER').length,
    [logs],
  );

  const roleStats = useMemo(() => {
    ordersPreparedCount = 0;
    const stats = computeRoleStats(logs);
    return stats;
  }, [logs]);

  const presetOptions: { value: DatePreset; label: string }[] = [
    { value: 'today', label: t('logs.today') },
    { value: 'yesterday', label: t('logs.yesterday') },
    { value: 'thisWeek', label: t('logs.thisWeek') },
    { value: 'thisMonth', label: t('logs.thisMonth') },
    { value: 'custom', label: t('logs.customRange') },
  ];

  function goToPage(page: number) {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
  }

  function handleExportCsv() {
    const headers = [
      t('logs.csv.createdAt'), t('logs.csv.userName'), t('logs.csv.role'), t('logs.csv.action'), t('logs.csv.module'), t('logs.csv.status'),
      t('logs.csv.orderId'), t('logs.csv.dailyOrderNumber'), t('logs.csv.tableNumber'), t('logs.csv.orderType'),
      t('logs.csv.previousStatus'), t('logs.csv.nextStatus'), t('logs.csv.previousTotal'), t('logs.csv.nextTotal'),
      t('logs.csv.totalDelta'), t('logs.csv.riskFlags'), t('logs.csv.paymentMethod'),
    ];
    const rows = logs.map((log) => {
      const d = asOrderAuditDetails(log.details);
      return [
        log.createdAt,
        log.userName,
        log.role,
        log.action,
        log.module,
        log.status,
        d?.orderId ?? '',
        d?.dailyOrderNumber ?? '',
        d?.tableNumber ?? '',
        d?.orderType ?? '',
        d?.previousStatus ?? '',
        d?.nextStatus ?? '',
        d?.previousTotal ?? '',
        d?.nextTotal ?? '',
        d?.totalDelta ?? '',
        (d?.riskFlags ?? []).join('; '),
        d?.paymentMethod ?? '',
      ];
    });
    const csv = [headers, ...rows].map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `audit-logs-${dateRange.from}-${dateRange.to}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  function generatePdfHtml(): string {
    const isRtl = pdfLang === 'ar';
    const reportLang = pdfLang;
    const tl = (key: string) => translate(reportLang, key);

    const riskLabel = (flag: string) => translate(reportLang, `riskFlag.${flag.toLowerCase()}`);

    const roleStatHtml = () => {
      const userRole = filterUser
        ? logs.find((l) => l.userName === filterUser)?.role
        : undefined;
      if (!userRole) return '';

      if (userRole === 'CASHIER') {
        return `
          <div class="stat-block">
            <h3>${tl('logs.cashierStats')}</h3>
            <div class="stats-grid">
              <div class="stat-item"><span class="stat-label">${tl('logs.takeawayOrders')}</span><span class="stat-value">${roleStats.takeawayOrders}</span></div>
              <div class="stat-item"><span class="stat-label">${tl('logs.totalCashReceived')}</span><span class="stat-value">${formatCurrency(roleStats.totalCash)}</span></div>
              <div class="stat-item"><span class="stat-label">${tl('logs.totalCardReceived')}</span><span class="stat-value">${formatCurrency(roleStats.totalCard)}</span></div>
            </div>
          </div>`;
      }
      if (userRole === 'WAITER') {
        return `
          <div class="stat-block">
            <h3>${tl('logs.waiterStats')}</h3>
            <div class="stats-grid">
              <div class="stat-item"><span class="stat-label">${tl('logs.ordersCreated')}</span><span class="stat-value">${roleStats.ordersCreated}</span></div>
              <div class="stat-item"><span class="stat-label">${tl('logs.ordersDelivered')}</span><span class="stat-value">${roleStats.ordersDelivered}</span></div>
            </div>
          </div>`;
      }
      if (userRole === 'CHEF') {
        return `
          <div class="stat-block">
            <h3>${tl('logs.chefStats')}</h3>
            <div class="stats-grid">
              <div class="stat-item"><span class="stat-label">${tl('logs.dishesPrepared')}</span><span class="stat-value">${roleStats.dishesPrepared}</span></div>
            </div>
          </div>`;
      }
      return '';
    };

    const logTableRows = logs
      .map((log) => {
        const d = asOrderAuditDetails(log.details);
        const flags = d?.riskFlags ?? [];
        return `
        <tr>
          <td style="padding:6px 10px;border-bottom:1px solid #e5e7eb;font-size:12px">${log.userName}</td>
          <td style="padding:6px 10px;border-bottom:1px solid #e5e7eb;font-size:12px">${translate(reportLang, `role.${log.role.toLowerCase()}`)}</td>
          <td style="padding:6px 10px;border-bottom:1px solid #e5e7eb;font-size:12px">${log.action}</td>
          <td style="padding:6px 10px;border-bottom:1px solid #e5e7eb;font-size:12px">${translate(reportLang, `status.${log.status.toLowerCase()}`)}</td>
          <td style="padding:6px 10px;border-bottom:1px solid #e5e7eb;font-size:12px">${d?.dailyOrderNumber ? `#${d.dailyOrderNumber}` : '-'}</td>
          <td style="padding:6px 10px;border-bottom:1px solid #e5e7eb;font-size:12px">${flags.length ? flags.map(riskLabel).join(', ') : '-'}</td>
          <td style="padding:6px 10px;border-bottom:1px solid #e5e7eb;font-size:12px">${new Date(log.createdAt).toLocaleDateString(reportLang === 'ar' ? 'ar-DZ' : reportLang === 'fr' ? 'fr-FR' : 'en-US', { dateStyle: 'medium', timeStyle: 'short' })}</td>
        </tr>`;
      })
      .join('');

    return `<!DOCTYPE html>
<html dir="${isRtl ? 'rtl' : 'ltr'}" lang="${reportLang}">
<head>
<meta charset="utf-8">
<title>${tl('logs.pdfTitle')}</title>
<style>
  @page { margin: 15mm 12mm; }
  body { font-family: Arial, Helvetica, sans-serif; margin: 0; padding: 0; color: #1f2937; font-size: 13px; }
  .header { text-align: center; padding: 20px 0 16px; border-bottom: 3px solid #ac2d00; margin-bottom: 20px; }
  .header h1 { margin: 0; font-size: 24px; color: #111827; }
  .header p { margin: 4px 0 0; font-size: 12px; color: #6b7280; }
  .meta { text-align: center; font-size: 11px; color: #6b7280; margin-bottom: 16px; }
  .summary-cards { display: flex; justify-content: center; gap: 12px; margin-bottom: 20px; flex-wrap: wrap; }
  .summary-card { text-align: center; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 10px 18px; min-width: 120px; }
  .summary-card .num { font-size: 22px; font-weight: 700; color: #111827; }
  .summary-card .lbl { font-size: 10px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em; margin-top: 2px; }
  .stat-block { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 12px 16px; margin-bottom: 16px; }
  .stat-block h3 { margin: 0 0 8px; font-size: 14px; color: #166534; }
  .stats-grid { display: flex; gap: 16px; flex-wrap: wrap; }
  .stat-item { display: flex; justify-content: space-between; gap: 12px; font-size: 12px; padding: 4px 8px; background: white; border-radius: 4px; flex: 1; min-width: 140px; }
  .stat-label { color: #374151; }
  .stat-value { font-weight: 700; color: #111827; }
  table { width: 100%; border-collapse: collapse; margin-top: 8px; font-size: 11px; }
  th { background: #f3f4f6; padding: 8px 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #6b7280; border-bottom: 2px solid #d1d5db; ${isRtl ? 'text-align:right' : 'text-align:left'} }
  td { padding: 6px 10px; border-bottom: 1px solid #e5e7eb; }
  .footer { text-align: center; margin-top: 20px; padding-top: 10px; border-top: 1px solid #e5e7eb; font-size: 10px; color: #9ca3af; }
  @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
</style>
</head>
<body>
<div class="header">
  <h1>${tl('logs.pdfTitle')}</h1>
  <p>${tl('logs.pdfSubtitle')}</p>
</div>
<div class="meta">
  ${filterUser ? `<p>${tl('logs.pdfEmployeeTarget')}: ${filterUser}</p>` : ''}
  <p>${tl('logs.pdfPeriod')}: ${dateRange.from || '-'} — ${dateRange.to || '-'}</p>
</div>
<div class="summary-cards">
  <div class="summary-card"><div class="num">${total}</div><div class="lbl">${tl('logs.pdfTotalRecords')}</div></div>
  <div class="summary-card"><div class="num">${waiterAndCashierCount}</div><div class="lbl">${tl('logs.pdfWaiterCashierActions')}</div></div>
  <div class="summary-card"><div class="num">${flaggedCount}</div><div class="lbl">${tl('logs.pdfRecordsForReview')}</div></div>
</div>
${roleStatHtml()}
${pdfReportType === 'detailed' ? `
<table>
  <thead><tr>
    <th>${tl('logs.employeeName')}</th>
    <th>${tl('logs.allRoles')}</th>
    <th>${tl('logs.actionContains')}</th>
    <th>${tl('logs.allStatuses')}</th>
    <th>${tl('logs.order')}</th>
    <th>${tl('logs.review')}</th>
    <th>${tl('logs.after')}</th>
  </tr></thead>
  <tbody>${logTableRows}</tbody>
</table>` : ''}
<div class="footer">${tl('logs.pdfGeneratedAt')}: ${new Date().toLocaleDateString(reportLang === 'ar' ? 'ar-DZ' : reportLang === 'fr' ? 'fr-FR' : 'en-US', { dateStyle: 'full', timeStyle: 'short' })}</div>
</body>
</html>`;
  }

  function handleExportPdf() {
    setExportingPdf(true);
    setShowPdfModal(false);
    try {
      const session = useAuthStore.getState().session;
      if (!session?.accessToken) {
        setError(t('logs.pdfAuthError'));
        setExportingPdf(false);
        return;
      }

      const html = generatePdfHtml();
      const blob = new Blob([html], { type: 'text/html' });
      const url = URL.createObjectURL(blob);

      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `audit-logs-${dateRange.from}-${dateRange.to}.html`;
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
          <h2 className="text-2xl font-bold text-gray-900">{t('logs.title')}</h2>
          <p className="text-sm text-gray-500 mt-1">{t('logs.subtitle')}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowPdfModal(true)}
            disabled={exportingPdf || logs.length === 0}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <FileText size={16} />
            <span>{exportingPdf ? t('logs.exportingPdf') : t('logs.exportPdf')}</span>
          </button>
          <button
            type="button"
            onClick={handleExportCsv}
            disabled={logs.length === 0}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <Download size={16} />
            <span>{t('logs.exportCsv')}</span>
          </button>
          <button
            type="button"
            onClick={() => void load()}
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-lg text-sm font-bold hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            <span>{t('menu.refresh')}</span>
          </button>
        </div>
      </div>

      {error ? (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm flex items-center gap-2">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      ) : null}

      {/* Date Presets & Filters */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
        <div className="flex flex-wrap items-end gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">{t('logs.filtersTitle')}</label>
            <div className="flex gap-1.5 flex-wrap">
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

          {datePreset === 'custom' && (
            <div className="flex items-end gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">{t('logs.fromDate')}</label>
                <input
                  type="date"
                  value={customFrom}
                  onChange={(e) => setCustomFrom(e.target.value)}
                  className="px-3 py-2 bg-white border border-gray-300 text-gray-900 rounded-lg text-sm focus:border-primary focus:ring-1 focus:ring-primary"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">{t('logs.toDate')}</label>
                <input
                  type="date"
                  value={customTo}
                  onChange={(e) => setCustomTo(e.target.value)}
                  className="px-3 py-2 bg-white border border-gray-300 text-gray-900 rounded-lg text-sm focus:border-primary focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>
          )}

          {/* Role filter */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">{t('logs.allRoles')}</label>
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="px-3 py-2 bg-white border border-gray-300 text-gray-900 rounded-lg text-sm focus:border-primary focus:ring-1 focus:ring-primary"
            >
              <option value="">{t('logs.allRoles')}</option>
              <option value="WAITER">{roleLabel('WAITER')}</option>
              <option value="CASHIER">{roleLabel('CASHIER')}</option>
              <option value="CHEF">{roleLabel('CHEF')}</option>
              <option value="MANAGER">{roleLabel('MANAGER')}</option>
              <option value="ADMIN">{roleLabel('ADMIN')}</option>
            </select>
          </div>

          {/* User filter */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">{t('logs.filterByUser')}</label>
            <select
              value={filterUser}
              onChange={(e) => setFilterUser(e.target.value)}
              className="px-3 py-2 bg-white border border-gray-300 text-gray-900 rounded-lg text-sm focus:border-primary focus:ring-1 focus:ring-primary"
            >
              <option value="">{t('logs.allUsers')}</option>
              {users.map((u) => (
                <option key={u} value={u}>{u}</option>
              ))}
            </select>
          </div>

          <div className="flex items-end">
            <button
              type="button"
              onClick={() => void load()}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-bold hover:bg-primary/90 transition-colors"
            >
              <Search size={16} />
              <span>{t('logs.applyFilters')}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <div className="text-2xl font-bold text-gray-900">{total}</div>
          <p className="text-sm text-gray-500 mt-1">{t('logs.visibleRecords')}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <div className="text-2xl font-bold text-gray-900">{waiterAndCashierCount}</div>
          <p className="text-sm text-gray-500 mt-1">{t('logs.waiterCashierActions')}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <div className="text-2xl font-bold text-amber-600">{flaggedCount}</div>
          <p className="text-sm text-gray-500 mt-1">{t('logs.recordsForReview')}</p>
        </div>
      </div>

      {/* Role-specific statistics */}
      {filterUser && logs.length > 0 && (() => {
        const userRole = logs.find((l) => l.userName === filterUser)?.role;
        if (!userRole) return null;

        if (userRole === 'CASHIER') {
          return (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5">
              <h3 className="text-sm font-bold text-emerald-800 uppercase tracking-wider mb-3">{t('logs.cashierStats')}</h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="bg-white rounded-lg p-4 border border-emerald-100">
                  <div className="text-xs text-gray-500">{t('logs.takeawayOrders')}</div>
                  <div className="text-xl font-bold text-gray-900 mt-1">{roleStats.takeawayOrders}</div>
                </div>
                <div className="bg-white rounded-lg p-4 border border-emerald-100">
                  <div className="text-xs text-gray-500">{t('logs.totalCashReceived')}</div>
                  <div className="text-xl font-bold text-gray-900 mt-1">{formatCurrency(roleStats.totalCash)}</div>
                </div>
                <div className="bg-white rounded-lg p-4 border border-emerald-100">
                  <div className="text-xs text-gray-500">{t('logs.totalCardReceived')}</div>
                  <div className="text-xl font-bold text-gray-900 mt-1">{formatCurrency(roleStats.totalCard)}</div>
                </div>
              </div>
            </div>
          );
        }

        if (userRole === 'WAITER') {
          return (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
              <h3 className="text-sm font-bold text-blue-800 uppercase tracking-wider mb-3">{t('logs.waiterStats')}</h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="bg-white rounded-lg p-4 border border-blue-100">
                  <div className="text-xs text-gray-500">{t('logs.ordersCreated')}</div>
                  <div className="text-xl font-bold text-gray-900 mt-1">{roleStats.ordersCreated}</div>
                </div>
                <div className="bg-white rounded-lg p-4 border border-blue-100">
                  <div className="text-xs text-gray-500">{t('logs.ordersDelivered')}</div>
                  <div className="text-xl font-bold text-gray-900 mt-1">{roleStats.ordersDelivered}</div>
                </div>
              </div>
            </div>
          );
        }

        if (userRole === 'CHEF') {
          return (
            <div className="bg-orange-50 border border-orange-200 rounded-xl p-5">
              <h3 className="text-sm font-bold text-orange-800 uppercase tracking-wider mb-3">{t('logs.chefStats')}</h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="bg-white rounded-lg p-4 border border-orange-100">
                  <div className="text-xs text-gray-500">{t('logs.dishesPrepared')}</div>
                  <div className="text-xl font-bold text-gray-900 mt-1">{roleStats.dishesPrepared}</div>
                </div>
              </div>
            </div>
          );
        }

        return null;
      })()}

      {/* Record count & pagination info */}
      {!loading && (
        <div className="flex items-center justify-between text-sm text-gray-500">
          <span>{total} {t('logs.visibleRecords').toLowerCase()}</span>
          {totalPages > 1 && (
            <span>{t('logs.pageInfo').replace('{current}', String(currentPage)).replace('{total}', String(totalPages))}</span>
          )}
        </div>
      )}

      {/* Log Entries */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center gap-3 py-20 text-gray-500">
            <RefreshCw size={20} className="animate-spin" />
            <span>{t('logs.loading')}</span>
          </div>
        ) : logs.length === 0 ? (
          <div className="py-20 text-center">
            <ClipboardList size={48} className="mx-auto text-gray-300 mb-3" />
            <p className="text-sm text-gray-500">{t('logs.noResults')}</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {logs.map((log) => {
              const details = asOrderAuditDetails(log.details);
              const riskFlags = details?.riskFlags ?? [];
              const previousTotal = details?.previousTotal;
              const nextTotal = details?.nextTotal;
              const previousItems = details?.previousItems ?? [];
              const nextItems = details?.nextItems ?? [];

              return (
                <div key={log.id} className="p-5 hover:bg-gray-50 transition-colors">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <strong className="text-sm text-gray-900">{log.userName}</strong>
                        <span className="inline-flex items-center px-2 py-0.5 text-xs font-semibold bg-gray-100 text-gray-700 rounded-full">{roleLabel(log.role)}</span>
                        <span className={`inline-flex items-center px-2 py-0.5 text-xs font-semibold rounded-full ${
                          log.status === 'SUCCESS' ? 'bg-emerald-100 text-emerald-700' :
                          log.status === 'WARNING' ? 'bg-amber-100 text-amber-700' :
                          'bg-red-100 text-red-700'
                        }`}>{statusLabel(log.status)}</span>
                        <span className="text-xs text-gray-400">{log.module}</span>
                      </div>
                      <div className="mt-1 text-sm text-gray-700">{log.action}</div>
                      <div className="mt-0.5 text-xs text-gray-400">{formatDateTime(log.createdAt)}</div>
                    </div>
                    {riskFlags.length > 0 ? (
                      <div className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800 shrink-0">
                        {t('logs.review')}: {riskFlags.map(riskFlagLabel).join(', ')}
                      </div>
                    ) : null}
                  </div>

                  {details?.orderId ? (
                    <div className="mt-4 grid gap-3 md:grid-cols-3">
                      <div className="rounded-xl bg-slate-50 p-3 text-sm">
                        <div className="font-semibold text-slate-700 mb-1">{t('logs.order')}</div>
                        <div>#{details.dailyOrderNumber ?? '-'}</div>
                        <div>{t('logs.table')}: {details.tableNumber ?? t('logs.takeaway')}</div>
                        <div>{t('logs.type')}: {details.orderType ?? '-'}</div>
                      </div>
                      <div className="rounded-xl bg-slate-50 p-3 text-sm">
                        <div className="font-semibold text-slate-700 mb-1">{t('logs.statusBlock')}</div>
                        <div>{details.previousStatus ?? '-'} → {details.nextStatus ?? '-'}</div>
                        <div>{t('logs.itemsSummary')}: {details.previousItemCount ?? '-'} → {details.nextItemCount ?? '-'}</div>
                        {details.paymentMethod ? <div>{t('logs.payment')}: {paymentMethodLabel(details.paymentMethod)}</div> : null}
                      </div>
                      <div className="rounded-xl bg-slate-50 p-3 text-sm">
                        <div className="font-semibold text-slate-700 mb-1">{t('logs.financial')}</div>
                        <div>{t('logs.before')}: {previousTotal !== undefined ? formatCurrency(previousTotal) : '-'}</div>
                        <div>{t('logs.after')}: {nextTotal !== undefined ? formatCurrency(nextTotal) : '-'}</div>
                        {typeof details.totalDelta === 'number' ? (
                          <div>{t('logs.delta')}: {details.totalDelta > 0 ? '+' : ''}{formatCurrency(details.totalDelta)}</div>
                        ) : null}
                      </div>
                    </div>
                  ) : null}

                  {previousItems.length > 0 || nextItems.length > 0 ? (
                    <div className="mt-4 grid gap-3 md:grid-cols-2">
                      {previousItems.length > 0 ? (
                        <div className="rounded-xl border border-rose-100 bg-rose-50/60 p-3">
                          <div className="mb-2 text-sm font-semibold text-rose-800">{t('logs.before')}</div>
                          <div className="space-y-2 text-sm text-slate-700">
                            {previousItems.map((item, index) => (
                              <div key={`prev-${log.id}-${index}`} className="rounded-lg bg-white/80 p-2">
                                <div className="font-medium">{item.menuItemName ?? t('logs.itemFallback')} x{item.quantity ?? 0}</div>
                                {typeof item.lineTotal === 'number' ? <div>{formatCurrency(item.lineTotal)}</div> : null}
                                {item.notes ? <div className="text-xs text-gray-500">{t('logs.notes')}: {item.notes}</div> : null}
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : null}
                      {nextItems.length > 0 ? (
                        <div className="rounded-xl border border-emerald-100 bg-emerald-50/60 p-3">
                          <div className="mb-2 text-sm font-semibold text-emerald-800">{t('logs.after')}</div>
                          <div className="space-y-2 text-sm text-slate-700">
                            {nextItems.map((item, index) => (
                              <div key={`next-${log.id}-${index}`} className="rounded-lg bg-white/80 p-2">
                                <div className="font-medium">{item.menuItemName ?? t('logs.itemFallback')} x{item.quantity ?? 0}</div>
                                {typeof item.lineTotal === 'number' ? <div>{formatCurrency(item.lineTotal)}</div> : null}
                                {item.notes ? <div className="text-xs text-gray-500">{t('logs.notes')}: {item.notes}</div> : null}
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && !loading && (
          <div className="flex items-center justify-between px-5 py-4 border-t border-gray-200 bg-gray-50">
            <button
              type="button"
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage <= 1}
              className="inline-flex items-center gap-1 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft size={16} />
              <span>{t('logs.previous')}</span>
            </button>
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                let pageNum: number;
                if (totalPages <= 7) {
                  pageNum = i + 1;
                } else if (currentPage <= 4) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 3) {
                  pageNum = totalPages - 6 + i;
                } else {
                  pageNum = currentPage - 3 + i;
                }
                return (
                  <button
                    key={pageNum}
                    type="button"
                    onClick={() => goToPage(pageNum)}
                    className={`w-9 h-9 text-sm font-medium rounded-lg transition-colors ${
                      pageNum === currentPage
                        ? 'bg-primary text-white'
                        : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>
            <button
              type="button"
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage >= totalPages}
              className="inline-flex items-center gap-1 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <span>{t('logs.next')}</span>
              <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>

      {/* PDF Export Modal */}
      {showPdfModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6" dir={dir}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">{t('logs.exportPdf')}</h3>
              <button type="button" onClick={() => setShowPdfModal(false)} className="text-gray-400 hover:text-gray-600 p-1">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-5">
              {/* Report language */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">{t('logs.pdfReportLanguage')}</label>
                <div className="flex gap-2">
                  {(['ar', 'fr', 'en'] as AdminLanguage[]).map((l) => (
                    <button
                      key={l}
                      type="button"
                      onClick={() => setPdfLang(l)}
                      className={`flex-1 px-4 py-2.5 text-sm font-semibold rounded-lg border transition-all ${
                        pdfLang === l
                          ? 'bg-primary text-white border-primary shadow-sm'
                          : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      {t('logs.pdfLang' + (l === 'ar' ? 'Ar' : l === 'fr' ? 'Fr' : 'En'))}
                    </button>
                  ))}
                </div>
              </div>

              {/* Report type */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">{t('logs.pdfReportType')}</label>
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={() => setPdfReportType('summary')}
                    className={`w-full text-left p-3 rounded-lg border transition-all ${
                      pdfReportType === 'summary'
                        ? 'bg-primary/5 border-primary'
                        : 'bg-white border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="text-sm font-semibold text-gray-900">{t('logs.pdfSummaryReport')}</div>
                    <div className="text-xs text-gray-500 mt-0.5">{t('logs.pdfSummaryDesc')}</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPdfReportType('detailed')}
                    className={`w-full text-left p-3 rounded-lg border transition-all ${
                      pdfReportType === 'detailed'
                        ? 'bg-primary/5 border-primary'
                        : 'bg-white border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="text-sm font-semibold text-gray-900">{t('logs.pdfDetailedReport')}</div>
                    <div className="text-xs text-gray-500 mt-0.5">{t('logs.pdfDetailedDesc')}</div>
                  </button>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch gap-3 mt-6 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={() => setShowPdfModal(false)}
                className="px-4 py-3 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                {t('logs.pdfCancel')}
              </button>
              <button
                type="button"
                onClick={handleExportPdf}
                disabled={exportingPdf}
                className="px-4 py-3 text-sm font-bold text-white bg-primary rounded-lg hover:bg-primary/90 disabled:opacity-50 inline-flex items-center justify-center gap-2"
              >
                <FileText size={16} />
                <span>{exportingPdf ? t('logs.exportingPdf') : t('logs.pdfGenerate')}</span>
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
