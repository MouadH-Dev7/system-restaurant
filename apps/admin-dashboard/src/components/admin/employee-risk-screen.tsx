'use client';

import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, ChevronDown, ChevronUp, Download, RefreshCw } from 'lucide-react';
import type { AuditLogDTO, StaffMemberDTO } from '@repo/shared-types';
import { getApiErrorMessage } from '@/lib/api-error';
import { useI18n } from '@/hooks/use-i18n';
import { useAppStore } from '@/store/app.store';
import { listLogs } from '@/services/logs.service';
import { listStaff } from '@/services/staff.service';
import { RiskSummaryCards, RiskFilters, exportLogsCsv, asEmployeeRiskDetails } from './risk-sections';

type OrderItemSnapshot = {
  menuItemId?: string;
  menuItemName?: string;
  menuItemNameEn?: string | null;
  menuItemNameFr?: string | null;
  menuItemNameAr?: string | null;
  quantity?: number;
  lineTotal?: number;
  notes?: string | null;
  modifiers?: Array<{
    groupName?: string;
    groupNameEn?: string | null;
    groupNameFr?: string | null;
    groupNameAr?: string | null;
    optionName?: string;
    optionNameEn?: string | null;
    optionNameFr?: string | null;
    optionNameAr?: string | null;
  }>;
};

type EmployeeRiskDetails = {
  orderId?: string;
  dailyOrderNumber?: number;
  displayOrderId?: string;
  tableId?: string | null;
  tableNumber?: number | null;
  orderType?: string;
  previousStatus?: string;
  nextStatus?: string;
  previousVersion?: number;
  nextVersion?: number;
  previousTotal?: number;
  nextTotal?: number;
  totalDelta?: number;
  previousItemCount?: number;
  nextItemCount?: number;
  previousItems?: OrderItemSnapshot[];
  nextItems?: OrderItemSnapshot[];
  before?: {
    status?: string;
    total?: number;
    version?: number;
    items?: OrderItemSnapshot[];
  };
  after?: {
    status?: string;
    total?: number;
    version?: number;
    items?: OrderItemSnapshot[];
  };
  reason?: string | null;
  sourceContext?: string | null;
  riskFlags?: string[];
  staffCode?: string | null;
  editedAt?: string;
  createdAt?: string;
};

type RiskSeverity = 'high' | 'medium' | 'low';
type RangePreset = 'TODAY' | 'WEEK' | 'CUSTOM';

function endOfDayIso(value: string) {
  return new Date(`${value}T23:59:59.999`).toISOString();
}

function startOfDayIso(value: string) {
  return new Date(`${value}T00:00:00.000`).toISOString();
}

function sumItems(items: OrderItemSnapshot[] | undefined) {
  return (items ?? []).reduce((sum, item) => sum + (item.quantity ?? 0), 0);
}

function lineKey(item: OrderItemSnapshot) {
  return [
    item.menuItemId ?? item.menuItemName ?? 'item',
    item.notes ?? '',
    (item.modifiers ?? []).join('|'),
  ].join('::');
}

function detectSeverity(details: EmployeeRiskDetails | null): RiskSeverity {
  const flags = details?.riskFlags ?? [];
  const delta = Math.abs(details?.totalDelta ?? 0);

  if (flags.includes('modified_after_preparation_started') || delta >= 1000 || flags.length >= 3) {
    return 'high';
  }

  if (flags.length >= 1 || delta > 0) {
    return 'medium';
  }

  return 'low';
}

function severityClasses(severity: RiskSeverity) {
  if (severity === 'high') {
    return 'border-rose-200 bg-rose-50/80 text-rose-800';
  }
  if (severity === 'medium') {
    return 'border-amber-200 bg-amber-50/80 text-amber-800';
  }
  return 'border-emerald-200 bg-emerald-50/80 text-emerald-800';
}

function buildChangeSet(beforeItems: OrderItemSnapshot[], afterItems: OrderItemSnapshot[]) {
  const beforeMap = new Map<string, OrderItemSnapshot>();
  const afterMap = new Map<string, OrderItemSnapshot>();

  for (const item of beforeItems) {
    beforeMap.set(lineKey(item), item);
  }

  for (const item of afterItems) {
    afterMap.set(lineKey(item), item);
  }

  const added: OrderItemSnapshot[] = [];
  const removed: OrderItemSnapshot[] = [];
  const changed: Array<{ before: OrderItemSnapshot; after: OrderItemSnapshot }> = [];

  for (const [key, nextItem] of afterMap.entries()) {
    const previousItem = beforeMap.get(key);
    if (!previousItem) {
      added.push(nextItem);
      continue;
    }

    if (
      (previousItem.quantity ?? 0) !== (nextItem.quantity ?? 0) ||
      (previousItem.lineTotal ?? 0) !== (nextItem.lineTotal ?? 0)
    ) {
      changed.push({ before: previousItem, after: nextItem });
    }
  }

  for (const [key, previousItem] of beforeMap.entries()) {
    if (!afterMap.has(key)) {
      removed.push(previousItem);
    }
  }

  return { added, removed, changed };
}

function itemLabel(item: OrderItemSnapshot, language: string) {
  if (language === 'ar') {
    return item.menuItemNameAr ?? item.menuItemName ?? item.menuItemNameFr ?? item.menuItemNameEn ?? item.menuItemId ?? 'Item';
  }

  if (language === 'fr') {
    return item.menuItemNameFr ?? item.menuItemName ?? item.menuItemNameAr ?? item.menuItemNameEn ?? item.menuItemId ?? 'Item';
  }

  return item.menuItemNameEn ?? item.menuItemName ?? item.menuItemNameAr ?? item.menuItemNameFr ?? item.menuItemId ?? 'Item';
}

function localizeEditSource(sourceContext: string | null | undefined, t: (key: string) => string) {
  if (sourceContext === 'history') return t('employeeRisk.editSourceHistory');
  if (sourceContext === 'checkout') return t('employeeRisk.editSourceCheckout');
  if (sourceContext === 'tables') return t('employeeRisk.editSourceTables');
  if (sourceContext === 'board') return t('employeeRisk.editSourceBoard');
  return t('employeeRisk.noReason');
}

function modifierLabel(
  modifier: NonNullable<OrderItemSnapshot['modifiers']>[number],
  language: string,
) {
  const group =
    language === 'ar'
      ? modifier.groupNameAr ?? modifier.groupName
      : language === 'fr'
        ? modifier.groupNameFr ?? modifier.groupNameEn ?? modifier.groupName
        : modifier.groupNameEn ?? modifier.groupName;

  const option =
    language === 'ar'
      ? modifier.optionNameAr ?? modifier.optionName
      : language === 'fr'
        ? modifier.optionNameFr ?? modifier.optionNameEn ?? modifier.optionName
        : modifier.optionNameEn ?? modifier.optionName;

  return group ? `${group}: ${option}` : option ?? '-';
}

function localizeReason(reason: string | null | undefined, t: (key: string) => string) {
  if (!reason?.trim()) {
    return t('employeeRisk.noReason');
  }

  const normalized = reason.trim();

  if (normalized === 'Cashier updated order from POS') {
    return t('employeeRisk.reason.cashierPosUpdate');
  }

  if (
    normalized === 'Cashier updated order from POS history' ||
    normalized === 'Le caissier a modifie la commande depuis l historique POS' ||
    normalized === 'قام الكاشير بتعديل الطلب من سجل POS'
  ) {
    return t('employeeRisk.reason.posHistoryAr');
  }

  if (
    normalized === 'Cashier updated order from payment screen' ||
    normalized === 'Le caissier a modifie la commande depuis la page de paiement' ||
    normalized === 'قام الكاشير بتعديل الطلب من صفحة الدفع'
  ) {
    return t('employeeRisk.reason.paymentScreenAr');
  }

  if (
    normalized === 'Cashier updated order from order board' ||
    normalized === 'Le caissier a modifie la commande depuis le tableau des commandes' ||
    normalized === 'قام الكاشير بتعديل الطلب من لوحة الطلبات'
  ) {
    return t('employeeRisk.reason.orderBoardAr');
  }

  if (
    normalized === 'Cashier updated order from table screen' ||
    normalized === 'Le caissier a modifie la commande depuis l ecran de table' ||
    normalized === 'قام الكاشير بتعديل الطلب من شاشة الطاولة'
  ) {
    return t('employeeRisk.reason.tableScreenAr');
  }

  if (normalized === 'Order settled through payments') {
    return t('employeeRisk.reason.orderSettled');
  }

  return normalized;
}

export function EmployeeRiskScreen() {
  const { t, formatCurrency, formatDateTime, formatNumber, roleLabel, statusLabel, language } = useI18n();
  const restaurantId = useAppStore((state) => state.restaurantId);
  const [logs, setLogs] = useState<AuditLogDTO[]>([]);
  const [staff, setStaff] = useState<StaffMemberDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rangePreset, setRangePreset] = useState<RangePreset>('TODAY');
  const [staffCode, setStaffCode] = useState('');
  const [fromDate, setFromDate] = useState(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  });
  const [toDate, setToDate] = useState(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  });
  const [search, setSearch] = useState('');
  const [severity, setSeverity] = useState<'ALL' | RiskSeverity>('ALL');
  const [expandedId, setExpandedId] = useState<string | null>(null);

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
      const [result, nextStaff] = await Promise.all([
        listLogs(activeRestaurantId, {
          module: 'ORDERS',
          role: 'CASHIER',
          action: 'ORDER_ITEMS_UPDATED',
          staffCode: staffCode || undefined,
          from: fromDate ? startOfDayIso(fromDate) : undefined,
          to: toDate ? endOfDayIso(toDate) : undefined,
        }),
        listStaff(activeRestaurantId),
      ]);
      setLogs(result.data);
      setStaff(nextStaff);
    } catch (nextError) {
      setError(getApiErrorMessage(nextError, t('employeeRisk.title')));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, [restaurantId, staffCode, fromDate, toDate]);

  const filteredLogs = useMemo(() => {
    const query = search.trim().toLowerCase();

    return logs.filter((log) => {
      const details = asEmployeeRiskDetails(log.details);
      const level = detectSeverity(details);
      const orderLabel =
        details?.displayOrderId ??
        (typeof details?.dailyOrderNumber === 'number' ? String(details.dailyOrderNumber) : '');

      if (severity !== 'ALL' && level !== severity) {
        return false;
      }

      if (!query) {
        return true;
      }

      const haystack = [
        log.userName,
        log.action,
        details?.orderId,
        orderLabel,
        details?.staffCode,
        details?.reason,
        ...(details?.previousItems ?? []).map((item) => item.menuItemName ?? item.menuItemId ?? ''),
        ...(details?.nextItems ?? []).map((item) => item.menuItemName ?? item.menuItemId ?? ''),
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return haystack.includes(query);
    });
  }, [logs, search, severity]);

  const summary = useMemo(() => {
    const addedAmount = filteredLogs.reduce((sum, log) => {
      const details = asEmployeeRiskDetails(log.details);
      const delta = details?.totalDelta ?? 0;
      return delta > 0 ? sum + delta : sum;
    }, 0);

    const reducedAmount = filteredLogs.reduce((sum, log) => {
      const details = asEmployeeRiskDetails(log.details);
      const delta = details?.totalDelta ?? 0;
      return delta < 0 ? sum + Math.abs(delta) : sum;
    }, 0);

    const netImpact = addedAmount - reducedAmount;

    const high = filteredLogs.filter((log) => detectSeverity(asEmployeeRiskDetails(log.details)) === 'high').length;

    const staffSet = new Set(
      filteredLogs.map((log) => {
        const details = asEmployeeRiskDetails(log.details);
        return `${log.userName}:${details?.staffCode ?? ''}`;
      }),
    );

    return {
      addedAmount,
      reducedAmount,
      netImpact,
      high,
      staffCount: staffSet.size,
    };
  }, [filteredLogs]);

  return (
    <>
      <section className="page-header">
        <div>
          <h2>{t('employeeRisk.title')}</h2>
          <p>{t('employeeRisk.subtitle')}</p>
        </div>
        <div className="flex gap-3">
          <button type="button" className="ghost-btn" onClick={() => void load()}>
            <RefreshCw size={16} />
            <span>{t('menu.refresh')}</span>
          </button>
          <button type="button" className="primary-btn" onClick={() => exportLogsCsv(filteredLogs)}>
            <Download size={16} />
            <span>{t('employeeRisk.exportCsv')}</span>
          </button>
        </div>
      </section>

      {error ? (
        <div className="panel error-banner mt-4 flex items-center gap-2 text-xs font-bold">
          <AlertTriangle size={16} />
          <span>{error}</span>
        </div>
      ) : null}

      <RiskSummaryCards
        totalEdits={filteredLogs.length}
        reducedAmount={summary.reducedAmount}
        addedAmount={summary.addedAmount}
        netImpact={summary.netImpact}
        highRiskCount={summary.high}
      />

      <RiskFilters
        rangePreset={rangePreset}
        staffCode={staffCode}
        search={search}
        severity={severity}
        fromDate={fromDate}
        toDate={toDate}
        staff={staff}
        onRangePresetChange={setRangePreset}
        onStaffCodeChange={setStaffCode}
        onSearchChange={setSearch}
        onSeverityChange={setSeverity}
        onFromDateChange={setFromDate}
        onToDateChange={setToDate}
        onReset={() => {
          setRangePreset('TODAY');
          setStaffCode('');
          setSearch('');
          setSeverity('ALL');
          const now = new Date();
          const year = now.getFullYear();
          const month = String(now.getMonth() + 1).padStart(2, '0');
          const day = String(now.getDate()).padStart(2, '0');
          const today = `${year}-${month}-${day}`;
          setFromDate(today);
          setToDate(today);
        }}
      />

      <section className="panel mt-6 rounded-[30px] border border-slate-200 bg-white">
        {loading ? (
          <div className="p-10 text-center text-slate-400">{t('common.loading')}</div>
        ) : filteredLogs.length === 0 ? (
          <div className="p-10 text-center text-slate-400">{t('employeeRisk.empty')}</div>
        ) : (
          <div className="space-y-5">
            {filteredLogs.map((log) => {
              const details = asEmployeeRiskDetails(log.details);
              const beforeItems = details?.previousItems ?? details?.before?.items ?? [];
              const afterItems = details?.nextItems ?? details?.after?.items ?? [];
              const changeSet = buildChangeSet(beforeItems, afterItems);
              const severityValue = detectSeverity(details);
              const orderLabel =
                details?.displayOrderId ??
                (typeof details?.dailyOrderNumber === 'number' ? String(details.dailyOrderNumber) : '-');
              const isExpanded = expandedId === log.id;
              const staffCodeValue = details?.staffCode?.trim() ? details.staffCode : t('employeeRisk.noStaffCode');

              return (
                <article
                  key={log.id}
                  className="rounded-[28px] border border-slate-200 bg-[#fcfcfc] p-5 shadow-sm cursor-pointer transition hover:border-[#d4b19a] hover:shadow-md"
                  onClick={() => setExpandedId(isExpanded ? null : log.id)}
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-slate-900 px-3 py-1 text-xs font-bold text-white">
                          #{orderLabel}
                        </span>
                        <span className={`rounded-full border px-3 py-1 text-xs font-bold ${severityClasses(severityValue)}`}>
                          {severityValue === 'high'
                            ? t('employeeRisk.severityHigh')
                            : severityValue === 'medium'
                              ? t('employeeRisk.severityMedium')
                              : t('employeeRisk.severityLow')}
                        </span>
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                          {details?.tableNumber ? `${t('tables.table')} ${details.tableNumber}` : t('logs.takeaway')}
                        </span>
                      </div>

                      <div>
                        <h3 className="text-xl font-black text-slate-950">{log.userName}</h3>
                        <p className="text-sm text-slate-500">
                          {roleLabel(log.role)} / {staffCodeValue} / {formatDateTime(log.createdAt)}
                        </p>
                      </div>
                    </div>

                    <div className="grid min-w-[240px] gap-2 text-sm text-slate-600">
                      <div className="flex items-center justify-between gap-4 rounded-2xl bg-white px-4 py-3">
                        <span>{t('employeeRisk.createdAtLabel')}</span>
                        <strong className="text-slate-900">{details?.createdAt ? formatDateTime(details.createdAt) : '-'}</strong>
                      </div>
                      <div className="flex items-center justify-between gap-4 rounded-2xl bg-white px-4 py-3">
                        <span>{t('employeeRisk.editedAtLabel')}</span>
                        <strong className="text-slate-900">{details?.editedAt ? formatDateTime(details.editedAt) : formatDateTime(log.createdAt)}</strong>
                      </div>
                      <div className="flex items-center justify-between gap-4 rounded-2xl bg-white px-4 py-3">
                        <span>{t('employeeRisk.statusTransition')}</span>
                        <strong className="text-slate-900">
                          {statusLabel(details?.previousStatus ?? '-')} {'->'} {statusLabel(details?.nextStatus ?? '-')}
                        </strong>
                      </div>
                      <div className="flex items-center justify-between gap-4 rounded-2xl bg-white px-4 py-3">
                        <span>{t('employeeRisk.financialImpact')}</span>
                        <strong className={`${(details?.totalDelta ?? 0) < 0 ? 'text-rose-700' : 'text-emerald-700'}`}>
                          {(details?.totalDelta ?? 0) > 0 ? '+' : ''}
                          {formatCurrency(details?.totalDelta ?? 0)}
                        </strong>
                      </div>
                      <div className="flex items-center justify-between gap-4 rounded-2xl bg-white px-4 py-3">
                        <span>{t('employeeRisk.editSource')}</span>
                        <strong className="text-slate-900">{localizeEditSource(details?.sourceContext, t)}</strong>
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 grid gap-3 md:grid-cols-4">
                    <div className="rounded-[22px] bg-white p-4">
                      <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">{t('employeeRisk.beforeTotal')}</p>
                      <p className="mt-2 text-xl font-black text-slate-950">{formatCurrency(details?.previousTotal ?? 0)}</p>
                      <p className="mt-2 text-xs text-slate-500">
                        {t('employeeRisk.itemsCount')}: {formatNumber(details?.previousItemCount ?? sumItems(beforeItems))}
                      </p>
                    </div>
                    <div className="rounded-[22px] bg-white p-4">
                      <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">{t('employeeRisk.afterTotal')}</p>
                      <p className="mt-2 text-xl font-black text-slate-950">{formatCurrency(details?.nextTotal ?? 0)}</p>
                      <p className="mt-2 text-xs text-slate-500">
                        {t('employeeRisk.itemsCount')}: {formatNumber(details?.nextItemCount ?? sumItems(afterItems))}
                      </p>
                    </div>
                    <div className="rounded-[22px] bg-white p-4">
                      <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">{t('employeeRisk.addedItems')}</p>
                      <p className="mt-2 text-xl font-black text-emerald-700">{formatNumber(changeSet.added.length)}</p>
                      <p className="mt-2 text-xs text-slate-500">{t('employeeRisk.changedItems')}: {formatNumber(changeSet.changed.length)}</p>
                    </div>
                    <div className="rounded-[22px] bg-white p-4">
                      <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">{t('employeeRisk.removedItems')}</p>
                      <p className="mt-2 text-xl font-black text-rose-700">{formatNumber(changeSet.removed.length)}</p>
                      <p className="mt-2 text-xs text-slate-500">{t('employeeRisk.versionChange')}: {details?.previousVersion ?? '-'} {'->'} {details?.nextVersion ?? '-'}</p>
                    </div>
                  </div>

                  <div className="mt-4 rounded-[22px] border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
                    <strong>{t('employeeRisk.reasonLabel')}:</strong> {localizeReason(details?.reason, t)}
                  </div>

                  <div className="mt-5 flex justify-end">
                    <div className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-700">
                      {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      <span>{isExpanded ? t('employeeRisk.hideDetails') : t('employeeRisk.showDetails')}</span>
                    </div>
                  </div>

                  {isExpanded ? (
                    <div className="mt-5 grid gap-4 xl:grid-cols-3">
                      <div className="rounded-[24px] border border-rose-200 bg-rose-50/60 p-4">
                        <div className="mb-3 flex items-center justify-between">
                          <h4 className="text-sm font-black text-rose-900">{t('employeeRisk.beforeOrder')}</h4>
                          <span className="text-xs text-rose-700">{statusLabel(details?.previousStatus ?? '-')}</span>
                        </div>
                        <div className="space-y-3">
                          {beforeItems.map((item, index) => (
                            <div key={`before-${log.id}-${index}`} className="rounded-[18px] bg-white/90 p-3 text-sm text-slate-700">
                              <div className="flex items-start justify-between gap-3">
                                <strong className="text-slate-900">{itemLabel(item, language)}</strong>
                                <span className="text-xs font-bold text-rose-700">x{item.quantity ?? 0}</span>
                              </div>
                              <div className="mt-2 text-xs text-slate-500">{formatCurrency(item.lineTotal ?? 0)}</div>
                              {item.notes ? <div className="mt-2 text-xs text-slate-500">{t('logs.notes')}: {item.notes}</div> : null}
                              {item.modifiers?.length ? (
                                <div className="mt-2 text-xs text-slate-500">
                                  {t('employeeRisk.modifiersLabel')}: {item.modifiers.map((modifier) => modifierLabel(modifier, language)).join(' | ')}
                                </div>
                              ) : null}
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="rounded-[24px] border border-slate-200 bg-slate-50/80 p-4">
                        <h4 className="text-sm font-black text-slate-900">{t('employeeRisk.changeSummary')}</h4>
                        <div className="mt-4 space-y-4 text-sm text-slate-700">
                          <div>
                            <p className="font-bold text-emerald-700">{t('employeeRisk.addedItems')}</p>
                            {changeSet.added.length === 0 ? (
                              <p className="mt-1 text-slate-400">{t('employeeRisk.none')}</p>
                            ) : (
                              changeSet.added.map((item, index) => (
                                <p key={`added-${log.id}-${index}`} className="mt-1">
                                  + {itemLabel(item, language)} x{item.quantity ?? 0}
                                </p>
                              ))
                            )}
                          </div>
                          <div>
                            <p className="font-bold text-rose-700">{t('employeeRisk.removedItems')}</p>
                            {changeSet.removed.length === 0 ? (
                              <p className="mt-1 text-slate-400">{t('employeeRisk.none')}</p>
                            ) : (
                              changeSet.removed.map((item, index) => (
                                <p key={`removed-${log.id}-${index}`} className="mt-1">
                                  - {itemLabel(item, language)} x{item.quantity ?? 0}
                                </p>
                              ))
                            )}
                          </div>
                          <div>
                            <p className="font-bold text-amber-700">{t('employeeRisk.changedItems')}</p>
                            {changeSet.changed.length === 0 ? (
                              <p className="mt-1 text-slate-400">{t('employeeRisk.none')}</p>
                            ) : (
                              changeSet.changed.map((entry, index) => (
                                <p key={`changed-${log.id}-${index}`} className="mt-1">
                                  {itemLabel(entry.after, language)}: x{entry.before.quantity ?? 0} {'->'} x{entry.after.quantity ?? 0}
                                </p>
                              ))
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="rounded-[24px] border border-emerald-200 bg-emerald-50/60 p-4">
                        <div className="mb-3 flex items-center justify-between">
                          <h4 className="text-sm font-black text-emerald-900">{t('employeeRisk.afterOrder')}</h4>
                          <span className="text-xs text-emerald-700">{statusLabel(details?.nextStatus ?? '-')}</span>
                        </div>
                        <div className="space-y-3">
                          {afterItems.map((item, index) => (
                            <div key={`after-${log.id}-${index}`} className="rounded-[18px] bg-white/90 p-3 text-sm text-slate-700">
                              <div className="flex items-start justify-between gap-3">
                                <strong className="text-slate-900">{itemLabel(item, language)}</strong>
                                <span className="text-xs font-bold text-emerald-700">x{item.quantity ?? 0}</span>
                              </div>
                              <div className="mt-2 text-xs text-slate-500">{formatCurrency(item.lineTotal ?? 0)}</div>
                              {item.notes ? <div className="mt-2 text-xs text-slate-500">{t('logs.notes')}: {item.notes}</div> : null}
                              {item.modifiers?.length ? (
                                <div className="mt-2 text-xs text-slate-500">
                                  {t('employeeRisk.modifiersLabel')}: {item.modifiers.map((modifier) => modifierLabel(modifier, language)).join(' | ')}
                                </div>
                              ) : null}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : null}
                </article>
              );
            })}
          </div>
        )}
      </section>
    </>
  );
}
