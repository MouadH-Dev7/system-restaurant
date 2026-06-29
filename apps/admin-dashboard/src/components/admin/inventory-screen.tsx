'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  ClipboardList,
  Plus,
  RefreshCw,
  Search,
  X,
  TrendingUp,
  Info,
} from 'lucide-react';
import type { InventoryItemDTO, InventoryUnit, SupplyLogDTO, SupplierDTO } from '@repo/shared-types';
import { getApiErrorMessage } from '@/lib/api-error';
import { useI18n } from '@/hooks/use-i18n';
import { useAppStore } from '@/store/app.store';
import {
  createInventoryItem,
  deleteInventoryItem,
  listInventory,
  updateInventoryItem,
} from '@/services/inventory.service';
import { listSuppliers } from '@/services/suppliers.service';
import { listSupplyLogs } from '@/services/supply-logs.service';

const UNIT_OPTIONS: InventoryUnit[] = ['KG', 'GRAM', 'LITER', 'ML', 'PIECE', 'PACK'];

const CONVERSION_GROUPS: Record<string, { base: InventoryUnit; sub: InventoryUnit; factor: number }> = {
  KG: { base: 'KG', sub: 'GRAM', factor: 1000 },
  GRAM: { base: 'KG', sub: 'GRAM', factor: 1000 },
  LITER: { base: 'LITER', sub: 'ML', factor: 1000 },
  ML: { base: 'LITER', sub: 'ML', factor: 1000 },
};

const CATEGORY_TABS = ['ALL ITEMS', 'DRY GOODS', 'FRESH PRODUCE', 'DAIRY'] as const;

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  'DRY GOODS': ['rice', 'flour', 'sugar', 'salt', 'oil', 'pasta', 'grain', 'spice', 'bean', 'lentil', 'flake', 'pack'],
  'FRESH PRODUCE': ['vegetable', 'fruit', 'herb', 'salad', 'tomato', 'onion', 'garlic', 'lemon', 'lime', 'mushroom', 'avocado', 'leaf'],
  'DAIRY': ['milk', 'cream', 'cheese', 'butter', 'yogurt', 'dairy', 'egg'],
};

function convertUnit(value: number, from: InventoryUnit, to: InventoryUnit): number {
  if (from === to) return value;
  const group = CONVERSION_GROUPS[from];
  if (!group) return value;
  if (group.base === to) return value / group.factor;
  if (group.sub === to) return value * group.factor;
  return value;
}

type FormData = {
  name: string;
  unit: InventoryUnit;
  stockLevel: string;
  minAlertLevel: string;
  unitPrice: string;
  supplierId: string;
};

const EMPTY_FORM: FormData = {
  name: '',
  unit: 'KG',
  stockLevel: '0',
  minAlertLevel: '0',
  unitPrice: '0',
  supplierId: '',
};

export function InventoryScreen() {
  const { t, formatCurrency, formatNumber, formatDateTime } = useI18n();
  const restaurantId = useAppStore((state) => state.restaurantId);

  const [items, setItems] = useState<InventoryItemDTO[]>([]);
  const [suppliers, setSuppliers] = useState<SupplierDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [categoryTab, setCategoryTab] = useState<string>('ALL ITEMS');
  const [showDrawer, setShowDrawer] = useState(false);
  const [editTarget, setEditTarget] = useState<InventoryItemDTO | null>(null);
  const [form, setForm] = useState<FormData>(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState<Partial<Record<string, string>>>({});
  const [deleteTarget, setDeleteTarget] = useState<InventoryItemDTO | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [showSupplyLogs, setShowSupplyLogs] = useState(false);
  const [supplyLogs, setSupplyLogs] = useState<SupplyLogDTO[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);

  const rid = restaurantId;

  async function load() {
    if (!rid) { setItems([]); setSuppliers([]); setLoading(false); return; }
    try {
      setLoading(true); setError(null);
      const [invData, supData] = await Promise.all([listInventory(rid), listSuppliers(rid)]);
      setItems(invData); setSuppliers(supData);
    } catch (e) { setError(getApiErrorMessage(e, t('inventory.title'))); }
    finally { setLoading(false); }
  }

  useEffect(() => { void load(); }, [restaurantId]);

  const stats = useMemo(() => {
    const alerts = items.filter((item) => item.status !== 'HEALTHY').length;
    const critical = items.filter((item) => item.status === 'CRITICAL').length;
    const valuation = items.reduce((sum, item) => sum + item.stockLevel * item.unitPrice, 0);
    return { total: items.length, alerts, critical, valuation };
  }, [items]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let result = items;
    if (categoryTab !== 'ALL ITEMS') {
      const keywords = CATEGORY_KEYWORDS[categoryTab] || [];
      result = items.filter((item) =>
        keywords.some((kw) => item.name.toLowerCase().includes(kw)),
      );
    }
    if (!q) return result;
    return result.filter((item) =>
      item.name.toLowerCase().includes(q) ||
      (item.supplierName ?? '').toLowerCase().includes(q),
    );
  }, [items, search, categoryTab]);

  async function openSupplyLogs() {
    if (!rid) return;
    try {
      setLogsLoading(true);
      const data = await listSupplyLogs(rid);
      setSupplyLogs(data);
      setShowSupplyLogs(true);
    } catch (e) { setError(getApiErrorMessage(e, t('inventory.title'))); }
    finally { setLogsLoading(false); }
  }

  function openCreate() {
    setEditTarget(null); setForm(EMPTY_FORM); setFormErrors({}); setShowDrawer(true);
  }

  function openEdit(item: InventoryItemDTO) {
    setEditTarget(item);
    setForm({
      name: item.name, unit: item.unit,
      stockLevel: String(item.stockLevel), minAlertLevel: String(item.minAlertLevel),
      unitPrice: String(item.unitPrice), supplierId: item.supplierId ?? '',
    });
    setFormErrors({}); setShowDrawer(true);
  }

  function handleUnitChange(newUnit: InventoryUnit) {
    setForm((s) => {
      const stockValue = Number(s.stockLevel) || 0;
      const minValue = Number(s.minAlertLevel) || 0;
      const convertedStock = convertUnit(stockValue, s.unit as InventoryUnit, newUnit);
      const convertedMin = convertUnit(minValue, s.unit as InventoryUnit, newUnit);
      return {
        ...s,
        unit: newUnit,
        stockLevel: String(Math.round(convertedStock * 100) / 100),
        minAlertLevel: String(Math.round(convertedMin * 100) / 100),
      };
    });
  }

  function closeDrawer() { setShowDrawer(false); setEditTarget(null); }

  function validate(): boolean {
    const errors: typeof formErrors = {};
    if (!form.name.trim()) errors.name = t('common.required');
    const stock = Number(form.stockLevel);
    const minAlert = Number(form.minAlertLevel);
    const price = Number(form.unitPrice);
    if (Number.isNaN(stock) || stock < 0) errors.stockLevel = t('common.invalidNumber');
    if (Number.isNaN(minAlert) || minAlert < 0) errors.minAlertLevel = t('common.invalidNumber');
    if (Number.isNaN(price) || price < 0) errors.unitPrice = t('common.invalidNumber');
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSave() {
    if (!validate()) return;
    if (!rid) return;
    try {
      setSaving(true); setError(null);
      const payload = {
        name: form.name.trim(), unit: form.unit,
        stockLevel: Number(form.stockLevel), minAlertLevel: Number(form.minAlertLevel),
        unitPrice: Number(form.unitPrice), supplierId: form.supplierId || null,
      };
      if (editTarget) await updateInventoryItem(editTarget.id, payload);
      else await createInventoryItem({ ...payload, restaurantId: rid });
      closeDrawer(); await load();
    } catch (e) { setError(getApiErrorMessage(e, t('inventory.title'))); }
    finally { setSaving(false); }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    try { setDeleting(true); await deleteInventoryItem(deleteTarget.id); setDeleteTarget(null); await load(); }
    catch (e) { setError(getApiErrorMessage(e, t('inventory.title'))); }
    finally { setDeleting(false); }
  }

  function statusStyle(status: InventoryItemDTO['status']) {
    switch (status) {
      case 'CRITICAL':
        return 'bg-error-container text-on-error-container';
      case 'LOW_STOCK':
        return 'bg-warning/10 border border-warning/20 text-warning';
      default:
        return 'bg-success/10 border border-success/20 text-success';
    }
  }

  function statusLabel(status: InventoryItemDTO['status']) {
    switch (status) {
      case 'CRITICAL': return t('inventory.lowStock');
      case 'LOW_STOCK': return t('inventory.monitoring');
      default: return t('inventory.healthy');
    }
  }

  const activeSuppliers = useMemo(() => suppliers.filter((s) => s.status === 'ACTIVE'), [suppliers]);

  function formatRelativeTime(dateStr: string) {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins} min ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    return formatDateTime(dateStr);
  }

  return (
    <>
      <section className="page-header">
        <div>
          <nav className="flex items-center gap-1 text-body-sm text-secondary mb-1">
            <span className="hover:text-primary transition-colors cursor-default">OS</span>
            <span className="material-symbols-outlined text-sm">chevron_right</span>
            <span className="text-on-surface font-semibold">{t('inventory.title')}</span>
          </nav>
          <h2 className="font-headline-md text-headline-md text-on-surface">{t('inventory.title')}</h2>
        </div>
        <div className="flex items-center space-x-md">
          <button type="button" className="ghost-btn" onClick={() => void load()}>
            <RefreshCw size={16} /><span>{t('menu.refresh')}</span>
          </button>
          <button type="button" className="ghost-btn" onClick={() => void openSupplyLogs()}>
            <ClipboardList size={16} /><span>{t('inventory.supplyLogs')}</span>
          </button>
          <button type="button" className="primary-btn" onClick={openCreate}>
            <Plus size={16} /><span>{t('inventory.addItem')}</span>
          </button>
        </div>
      </section>

      {error ? (
        <div className="panel error-banner mt-4 flex items-center gap-2 text-xs font-bold">
          <AlertCircle size={16} /><span>{error}</span>
        </div>
      ) : null}

      {/* KPI Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-gutter mb-lg mt-4">
        <div className="bg-surface-container-lowest border border-border-muted rounded-xl shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 -mr-8 -mt-8 bg-primary/5 rounded-full group-hover:scale-110 transition-transform duration-500"></div>
          <div className="relative z-10 flex flex-row items-center justify-between gap-4 p-6">
            <div className="flex flex-col gap-1">
              <p className="text-secondary font-label-md uppercase tracking-wider">{t('inventory.totalItems')}</p>
              <h3 className="text-display-lg font-display-lg text-on-surface">{loading ? '…' : formatNumber(stats.total)}</h3>
              <span className="text-success font-label-md flex items-center gap-1">
                <TrendingUp size={14} />
                +{loading ? '…' : stats.total > 0 ? Math.round(stats.total * 0.12) : 0}
              </span>
            </div>
            <div className="p-3 bg-primary-fixed rounded-lg shrink-0">
              <span className="material-symbols-outlined text-on-primary-fixed-variant">inventory</span>
            </div>
          </div>
        </div>

        <div className="bg-surface-container-lowest border border-border-muted rounded-xl shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 -mr-8 -mt-8 bg-danger/5 rounded-full group-hover:scale-110 transition-transform duration-500"></div>
          <div className="relative z-10 flex flex-row items-center justify-between gap-4 p-6">
            <div className="flex flex-col gap-1">
              <p className="text-danger font-label-md uppercase tracking-wider">{t('inventory.alerts')}</p>
              <h3 className="text-display-lg font-display-lg text-danger">{loading ? '…' : formatNumber(stats.alerts)}</h3>
              <span className="text-secondary font-label-md">{t('inventory.requiresAction')}</span>
            </div>
            <div className="p-3 bg-error-container rounded-lg shrink-0">
              <span className="material-symbols-outlined text-on-error-container">warning</span>
            </div>
          </div>
        </div>

        <div className="bg-surface-container-lowest border border-border-muted rounded-xl shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 -mr-8 -mt-8 bg-primary/5 rounded-full group-hover:scale-110 transition-transform duration-500"></div>
          <div className="relative z-10 flex flex-row items-center justify-between gap-4 p-6">
            <div className="flex flex-col gap-1">
              <p className="text-secondary font-label-md uppercase tracking-wider">{t('inventory.valuation')}</p>
              <h3 className="text-display-lg font-display-lg text-on-surface">{loading ? '…' : formatCurrency(stats.valuation)}</h3>
              <span className="text-secondary font-label-md">{t('inventory.currentFifo')}</span>
            </div>
            <div className="p-3 bg-tertiary-fixed rounded-lg shrink-0">
              <span className="material-symbols-outlined text-tertiary">payments</span>
            </div>
          </div>
        </div>

        <div className="bg-surface-container-lowest border border-border-muted rounded-xl shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 -mr-8 -mt-8 bg-warning/5 rounded-full group-hover:scale-110 transition-transform duration-500"></div>
          <div className="relative z-10 flex flex-row items-center justify-between gap-4 p-6">
            <div className="flex flex-col gap-1">
              <p className="text-secondary font-label-md uppercase tracking-wider">{t('inventory.pendingOrders')}</p>
              <h3 className="text-display-lg font-display-lg text-on-surface">0{stats.alerts > 0 ? Math.ceil(stats.alerts / 3) : 0}</h3>
              <span className="text-warning font-label-md flex items-center gap-1">
                <TrendingUp size={14} />
                {t('inventory.inTransit')}
              </span>
            </div>
            <div className="p-3 bg-warning/10 rounded-lg shrink-0">
              <span className="material-symbols-outlined text-warning">local_shipping</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Tabs + Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-lg">
        <div className="flex bg-surface-container border border-border-muted rounded-lg p-1">
          {CATEGORY_TABS.map((tab) => (
            <button
              key={tab}
              type="button"
              className={`px-4 py-1.5 rounded-md text-label-md font-bold transition-colors ${
                categoryTab === tab
                  ? 'bg-surface-container-lowest text-primary shadow-sm'
                  : 'text-secondary hover:text-on-surface'
              }`}
              onClick={() => setCategoryTab(tab)}
            >
              {tab === 'ALL ITEMS' ? t('inventory.title') : tab}
            </button>
          ))}
        </div>
        <div className="relative w-full max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary" />
          <input
            type="text"
            className="w-full pl-10 pr-4 py-2 bg-surface-container-low border-none rounded-lg text-body-md focus:ring-2 focus:ring-primary transition-all placeholder:text-secondary/50"
            placeholder={t('inventory.search')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-secondary hover:text-on-surface"
              onClick={() => setSearch('')}
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Data Table */}
      <section className="bg-surface-container-lowest border border-border-muted rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-10 text-center text-secondary">{t('inventory.loading')}</div>
        ) : filtered.length === 0 ? (
          <div className="p-10 text-center text-secondary">{t('inventory.noItems')}</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-surface-subtle border-b border-border-muted">
                  <tr>
                    <th className="px-lg py-4 font-label-md text-secondary uppercase tracking-widest">{t('inventory.name')}</th>
                    <th className="px-lg py-4 font-label-md text-secondary uppercase tracking-widest">{t('inventory.stock')}</th>
                    <th className="px-lg py-4 font-label-md text-secondary uppercase tracking-widest">{t('inventory.minAlert')}</th>
                    <th className="px-lg py-4 font-label-md text-secondary uppercase tracking-widest">{t('common.status')}</th>
                    <th className="px-lg py-4 font-label-md text-secondary uppercase tracking-widest">{t('inventory.supplier')}</th>
                    <th className="px-lg py-4 font-label-md text-secondary uppercase tracking-widest">{t('inventory.lastUpdated')}</th>
                    <th className="px-lg py-4 font-label-md text-secondary uppercase tracking-widest text-right">{t('common.actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-muted/50">
                  {filtered.map((item) => (
                    <tr
                      key={item.id}
                      className={`hover:bg-surface-container-low transition-colors group ${
                        item.status === 'CRITICAL' ? 'bg-error/5' : ''
                      }`}
                    >
                      <td className="px-lg py-4 font-semibold text-on-surface whitespace-nowrap">{item.name}</td>
                      <td className="px-lg py-4 font-data-mono text-on-surface whitespace-nowrap">
                        <span className={item.status === 'CRITICAL' ? 'text-danger' : ''}>
                          {formatNumber(item.stockLevel)} {item.unit}
                        </span>
                      </td>
                      <td className="px-lg py-4 font-data-mono text-secondary whitespace-nowrap">{formatNumber(item.minAlertLevel)} {item.unit}</td>
                      <td className="px-lg py-4 whitespace-nowrap">
                        <span
                          className={`text-[10px] font-black px-2 py-1 rounded uppercase tracking-tighter ${statusStyle(item.status)}`}
                        >
                          {statusLabel(item.status)}
                        </span>
                      </td>
                      <td className="px-lg py-4 whitespace-nowrap">
                        {item.supplierName ? (
                          <span className="text-primary font-bold text-body-sm">{item.supplierName}</span>
                        ) : (
                          <span className="text-secondary/50 text-body-sm">{t('inventory.noSupplier')}</span>
                        )}
                      </td>
                      <td className="px-lg py-4 text-body-sm text-secondary whitespace-nowrap">{formatRelativeTime(item.updatedAt)}</td>
                      <td className="px-lg py-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            type="button"
                            className="p-1 hover:bg-surface-container-high rounded transition-all"
                            title={t('common.edit')}
                            onClick={() => openEdit(item)}
                          >
                            <span className="material-symbols-outlined text-secondary">edit</span>
                          </button>
                          <button
                            type="button"
                            className="p-1 hover:bg-surface-container-high rounded transition-all text-danger"
                            title={t('common.delete')}
                            onClick={() => setDeleteTarget(item)}
                          >
                            <span className="material-symbols-outlined text-secondary">delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-lg py-3 border-t border-border-muted flex items-center justify-between bg-surface-subtle">
              <span className="text-body-sm text-secondary">
                Showing <span className="font-semibold text-on-surface">1-{filtered.length}</span> of <span className="font-semibold text-on-surface">{items.length}</span> entries
              </span>
            </div>
          </>
        )}
      </section>

      {/* Supply Logs Modal */}
      {showSupplyLogs ? (
        <div className="modal-backdrop" onClick={() => setShowSupplyLogs(false)}>
          <div className="modal-card" style={{ maxWidth: '800px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <div>
                <h3>{t('inventory.supplyLogs')}</h3>
                <p>{t('inventory.supplyLogsSubtitle')}</p>
              </div>
              <button type="button" className="icon-btn" onClick={() => setShowSupplyLogs(false)}><X size={16} /></button>
            </div>
            <div className="p-6 max-h-[60vh] overflow-y-auto">
              {logsLoading ? (
                <div className="p-6 text-center text-slate-400">{t('common.loading')}</div>
              ) : supplyLogs.length === 0 ? (
                <div className="p-6 text-center text-slate-400">{t('inventory.noItems')}</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-100 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                        <th className="pb-3 pr-4">{t('inventory.itemName')}</th>
                        <th className="pb-3 pr-4">{t('inventory.supplier')}</th>
                        <th className="pb-3 pr-4">{t('inventory.quantityAdded')}</th>
                        <th className="pb-3 pr-4">{t('inventory.unitPrice')}</th>
                        <th className="pb-3 pr-4">{t('inventory.receivedAt')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {supplyLogs.map((log) => (
                        <tr key={log.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                          <td className="py-3 pr-4 font-medium text-slate-800">{log.inventoryItemName}</td>
                          <td className="py-3 pr-4 text-slate-600">{log.supplierName || '—'}</td>
                          <td className="py-3 pr-4 text-slate-600">{formatNumber(log.quantityAdded)}</td>
                          <td className="py-3 pr-4 text-slate-600">{formatCurrency(log.unitPrice)}</td>
                          <td className="py-3 pr-4 text-slate-600 whitespace-nowrap">{formatDateTime(log.receivedAt)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            <div className="modal-actions">
              <button type="button" className="primary-btn" onClick={() => setShowSupplyLogs(false)}>{t('common.cancel')}</button>
            </div>
          </div>
        </div>
      ) : null}

      {/* Side Drawer (Add/Edit) */}
      {showDrawer ? (
        <>
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-md z-[110] transition-opacity duration-300"
            onClick={closeDrawer}
          />
          <div className="fixed right-0 top-0 h-full w-full max-w-lg bg-white dark:bg-slate-900 shadow-2xl z-[120] flex flex-col">
            <div className="p-8 pb-6 border-b border-gray-200 dark:border-slate-700 flex justify-between items-center bg-white dark:bg-slate-900">
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                  {editTarget ? t('inventory.editItem') : t('inventory.addNewIngredient')}
                </h3>
                <p className="text-sm text-gray-500 dark:text-slate-400">
                  {editTarget ? t('inventory.editDescription') : t('inventory.enterDetails')}
                </p>
              </div>
              <button type="button" className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full transition-all" onClick={closeDrawer}>
                <span className="material-symbols-outlined text-gray-600 dark:text-slate-300">close</span>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-8">
              <div className="space-y-4">
                <h4 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-widest border-l-4 border-primary pl-3">
                  {t('inventory.basicInformation')}
                </h4>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-900 dark:text-white">{t('inventory.name')} <span className="text-danger">*</span></label>
                  <input
                    type="text"
                    className={`w-full bg-white border border-gray-300 text-gray-900 placeholder-gray-400 rounded-lg focus:border-primary focus:ring-1 focus:ring-primary py-2.5 px-3 ${formErrors.name ? 'border-red-400' : ''}`}
                    placeholder={t('inventory.namePlaceholder')}
                    value={form.name}
                    onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))}
                  />
                  {formErrors.name ? <p className="text-danger text-body-sm mt-1">{formErrors.name}</p> : null}
                </div>
              </div>

              <div className="space-y-4 pt-2">
                <h4 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-widest border-l-4 border-primary pl-3">
                  {t('inventory.stockInformation')}
                </h4>
                <div className="grid grid-cols-2 gap-md">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-900 dark:text-white">{t('inventory.stock')}</label>
                    <input
                      type="number"
                      min="0"
                      step="0.1"
                      className={`w-full bg-white border border-gray-300 text-gray-900 placeholder-gray-400 rounded-lg focus:border-primary focus:ring-1 focus:ring-primary py-2.5 px-3 ${formErrors.stockLevel ? 'border-red-400' : ''}`}
                      placeholder="0.00"
                      value={form.stockLevel}
                      onChange={(e) => setForm((s) => ({ ...s, stockLevel: e.target.value }))}
                    />
                    {formErrors.stockLevel ? <p className="text-danger text-body-sm mt-1">{formErrors.stockLevel}</p> : null}
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-900 dark:text-white">{t('inventory.unit')}</label>
                    <select
                      className="w-full bg-white border border-gray-300 text-gray-900 rounded-lg focus:border-primary focus:ring-1 focus:ring-primary py-2.5 px-3"
                      value={form.unit}
                      onChange={(e) => handleUnitChange(e.target.value as InventoryUnit)}
                    >
                      {UNIT_OPTIONS.map((u) => (
                        <option key={u} value={u}>{u}</option>
                      ))}
                    </select>
                    {CONVERSION_GROUPS[form.unit] ? (
                      <p className="text-[10px] text-secondary mt-0.5">
                        1 {(CONVERSION_GROUPS[form.unit]!).base} = {(CONVERSION_GROUPS[form.unit]!).factor} {(CONVERSION_GROUPS[form.unit]!).sub}
                      </p>
                    ) : null}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-900 dark:text-white">{t('inventory.minAlert')}</label>
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    className={`w-full bg-white border border-gray-300 text-gray-900 placeholder-gray-400 rounded-lg focus:border-primary focus:ring-1 focus:ring-primary py-2.5 px-3 ${formErrors.minAlertLevel ? 'border-red-400' : ''}`}
                    placeholder="0.00"
                    value={form.minAlertLevel}
                    onChange={(e) => setForm((s) => ({ ...s, minAlertLevel: e.target.value }))}
                  />
                  {formErrors.minAlertLevel ? <p className="text-danger text-body-sm mt-1">{formErrors.minAlertLevel}</p> : null}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-900 dark:text-white">{t('inventory.unitPrice')}</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    className={`w-full bg-white border border-gray-300 text-gray-900 placeholder-gray-400 rounded-lg focus:border-primary focus:ring-1 focus:ring-primary py-2.5 px-3 ${formErrors.unitPrice ? 'border-red-400' : ''}`}
                    placeholder="0.00"
                    value={form.unitPrice}
                    onChange={(e) => setForm((s) => ({ ...s, unitPrice: e.target.value }))}
                  />
                  {formErrors.unitPrice ? <p className="text-danger text-body-sm mt-1">{formErrors.unitPrice}</p> : null}
                </div>
              </div>

              <div className="space-y-4 pt-2">
                <h4 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-widest border-l-4 border-primary pl-3">
                  {t('inventory.supplierInformation')}
                </h4>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-900 dark:text-white">{t('inventory.supplier')}</label>
                  <select
                    className="w-full bg-white border border-gray-300 text-gray-900 rounded-lg focus:border-primary focus:ring-1 focus:ring-primary py-2.5 px-3"
                    value={form.supplierId}
                    onChange={(e) => setForm((s) => ({ ...s, supplierId: e.target.value }))}
                  >
                    <option value="">{t('inventory.noSupplier')}</option>
                    {activeSuppliers.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="bg-gray-50 dark:bg-slate-800 p-4 rounded-lg border border-gray-200 dark:border-slate-700">
                <div className="flex items-start gap-3">
                  <Info size={20} className="text-primary shrink-0 mt-0.5" />
                  <p className="text-sm text-gray-600 dark:text-slate-400 leading-relaxed">
                    {t('inventory.minStockDescription')}
                  </p>
                </div>
              </div>
            </div>

            <div className="p-8 pt-6 bg-gray-50 dark:bg-slate-900 border-t border-gray-200 dark:border-slate-700 flex gap-4">
              <button
                type="button"
                className="flex-1 px-6 py-3 rounded-lg border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-white font-bold hover:bg-gray-100 dark:hover:bg-slate-800 transition-all"
                onClick={closeDrawer}
              >
                {t('common.cancel')}
              </button>
              <button
                type="button"
                className="flex-1 px-6 py-3 rounded-lg bg-primary text-white font-bold shadow active:scale-95 transition-transform disabled:opacity-50"
                disabled={saving}
                onClick={() => void handleSave()}
              >
                {saving ? t('common.saving') : editTarget ? t('inventory.updateIngredient') : t('inventory.saveIngredient')}
              </button>
            </div>
          </div>
        </>
      ) : null}

      {/* Delete confirm */}
      {deleteTarget ? (
        <div className="modal-backdrop" onClick={() => setDeleteTarget(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <div><h3>{t('common.delete')}</h3><p>{t('inventory.deleteConfirm')}</p></div>
              <button type="button" className="icon-btn" onClick={() => setDeleteTarget(null)}><X size={16} /></button>
            </div>
            <div className="px-6 py-4 text-sm text-slate-600">
              <strong>{deleteTarget.name}</strong>
              <span className="text-slate-400 ml-2">({formatNumber(deleteTarget.stockLevel)} {deleteTarget.unit})</span>
            </div>
            <div className="modal-actions">
              <button type="button" className="ghost-btn" onClick={() => setDeleteTarget(null)}>{t('common.cancel')}</button>
              <button type="button" className="primary-btn" style={{ background: '#dc2626' }} disabled={deleting} onClick={() => void handleDelete()}>
                {deleting ? t('common.saving') : t('inventory.delete')}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
