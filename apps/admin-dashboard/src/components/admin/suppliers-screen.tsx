'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  Check,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  X,
} from 'lucide-react';
import type { SupplierCategoryDTO, SupplierDTO, SupplierStatus } from '@repo/shared-types';
import { getApiErrorMessage } from '@/lib/api-error';
import { useI18n } from '@/hooks/use-i18n';
import { useAppStore } from '@/store/app.store';
import {
  createSupplier,
  deleteSupplier,
  listSuppliers,
  updateSupplier,
} from '@/services/suppliers.service';
import {
  createSupplierCategory,
  deleteSupplierCategory,
  listSupplierCategories,
} from '@/services/supplier-categories.service';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^[+\d][\d\s().-]{4,}$/;

const CATEGORY_OPTIONS = ['Produce', 'Meat', 'Dairy', 'Bakery', 'Dry Goods'];

type FormData = {
  name: string;
  contactName: string;
  phone: string;
  email: string;
  address: string;
  supplyingCategories: string;
  categoryIds: string[];
  status: SupplierStatus;
};

const EMPTY_FORM: FormData = {
  name: '',
  contactName: '',
  phone: '',
  email: '',
  address: '',
  supplyingCategories: '',
  categoryIds: [],
  status: 'ACTIVE',
};

export function SuppliersScreen() {
  const { t } = useI18n();
  const restaurantId = useAppStore((state) => state.restaurantId);

  const [tab, setTab] = useState<'suppliers' | 'categories'>('suppliers');

  // Suppliers state
  const [items, setItems] = useState<SupplierDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<SupplierStatus | 'ALL'>('ALL');
  const [showDrawer, setShowDrawer] = useState(false);
  const [editTarget, setEditTarget] = useState<SupplierDTO | null>(null);
  const [form, setForm] = useState<FormData>(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState<Partial<Record<string, string>>>({});
  const [deleteTarget, setDeleteTarget] = useState<SupplierDTO | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Categories state
  const [categories, setCategories] = useState<SupplierCategoryDTO[]>([]);
  const [catLoading, setCatLoading] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [catSaving, setCatSaving] = useState(false);
  const [deleteCatTarget, setDeleteCatTarget] = useState<SupplierCategoryDTO | null>(null);
  const [catDeleting, setCatDeleting] = useState(false);

  const rid = restaurantId;

  async function loadSuppliers() {
    if (!rid) { setItems([]); setLoading(false); return; }
    try { setLoading(true); const data = await listSuppliers(rid); setItems(data); }
    catch (e) { setError(getApiErrorMessage(e, t('suppliers.title'))); }
    finally { setLoading(false); }
  }

  async function loadCategories() {
    if (!rid) { setCategories([]); return; }
    try { setCatLoading(true); const data = await listSupplierCategories(rid); setCategories(data); }
    catch (e) { setError(getApiErrorMessage(e, t('suppliers.title'))); }
    finally { setCatLoading(false); }
  }

  useEffect(() => { void loadSuppliers(); void loadCategories(); }, [restaurantId]);

  const stats = useMemo(() => {
    const active = items.filter((s) => s.status === 'ACTIVE').length;
    return { total: items.length, active };
  }, [items]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter((s) => {
      if (statusFilter !== 'ALL' && s.status !== statusFilter) return false;
      if (!q) return true;
      return s.name.toLowerCase().includes(q) || (s.phone ?? '').toLowerCase().includes(q);
    });
  }, [items, search, statusFilter]);

  function openCreate() {
    setEditTarget(null);
    setForm(EMPTY_FORM);
    setFormErrors({});
    setShowDrawer(true);
  }

  function openEdit(supplier: SupplierDTO) {
    setEditTarget(supplier);
    setForm({
      name: supplier.name,
      contactName: supplier.contactName ?? '',
      phone: supplier.phone ?? '',
      email: supplier.email ?? '',
      address: supplier.address ?? '',
      supplyingCategories: supplier.supplyingCategories ?? '',
      categoryIds: supplier.categoryIds ?? [],
      status: supplier.status,
    });
    setFormErrors({});
    setShowDrawer(true);
  }

  function closeDrawer() { setShowDrawer(false); setEditTarget(null); }

  function validate(): boolean {
    const errors: typeof formErrors = {};
    if (!form.name.trim()) errors.name = t('common.required');
    if (form.email && !EMAIL_RE.test(form.email)) errors.email = t('common.invalidEmail');
    if (form.phone && !PHONE_RE.test(form.phone)) errors.phone = t('common.invalidPhone');
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }

  function toggleCategory(catId: string) {
    setForm((s) => ({
      ...s,
      categoryIds: s.categoryIds.includes(catId)
        ? s.categoryIds.filter((id) => id !== catId)
        : [...s.categoryIds, catId],
    }));
  }

  async function handleSave() {
    if (!validate()) return;
    if (!rid) return;
    try {
      setSaving(true); setError(null);
      const payload = {
        name: form.name.trim(),
        contactName: form.contactName.trim() || null,
        phone: form.phone.trim() || null,
        email: form.email.trim() || null,
        address: form.address.trim() || null,
        supplyingCategories: form.supplyingCategories.trim() || form.categoryIds.join(',') || null,
        categoryIds: form.categoryIds,
        status: form.status,
      };
      if (editTarget) await updateSupplier(editTarget.id, payload);
      else await createSupplier({ ...payload, restaurantId: rid });
      closeDrawer(); await loadSuppliers();
    } catch (e) { setError(getApiErrorMessage(e, t('suppliers.title'))); }
    finally { setSaving(false); }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    try { setDeleting(true); await deleteSupplier(deleteTarget.id); setDeleteTarget(null); await loadSuppliers(); }
    catch (e) { setError(getApiErrorMessage(e, t('suppliers.title'))); }
    finally { setDeleting(false); }
  }

  async function handleToggleStatus(supplier: SupplierDTO) {
    try {
      setError(null);
      await updateSupplier(supplier.id, { status: supplier.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE' });
      await loadSuppliers();
    } catch (e) { setError(getApiErrorMessage(e, t('suppliers.title'))); }
  }

  async function handleAddCategory() {
    if (!newCatName.trim() || !rid) return;
    try { setCatSaving(true); await createSupplierCategory({ restaurantId: rid, name: newCatName.trim() }); setNewCatName(''); await loadCategories(); }
    catch (e) { setError(getApiErrorMessage(e, t('suppliers.title'))); }
    finally { setCatSaving(false); }
  }

  async function handleDeleteCategory() {
    if (!deleteCatTarget) return;
    try { setCatDeleting(true); await deleteSupplierCategory(deleteCatTarget.id); setDeleteCatTarget(null); await loadCategories(); await loadSuppliers(); }
    catch (e) { setError(getApiErrorMessage(e, t('suppliers.title'))); }
    finally { setCatDeleting(false); }
  }

  function statusBadgeClass(status: SupplierStatus) {
    return status === 'ACTIVE'
      ? 'bg-success/10 text-success border border-success/20'
      : 'bg-danger/10 text-danger border border-danger/20';
  }

  const avatarChar = (name: string) => name.charAt(0).toUpperCase();

  return (
    <>
      <section className="page-header">
        <div>
          <nav className="flex items-center gap-1 text-body-sm text-secondary mb-1">
            <span className="hover:text-primary transition-colors cursor-default">OS</span>
            <span className="material-symbols-outlined text-sm">chevron_right</span>
            <span className="text-on-surface font-semibold">{t('suppliers.title')}</span>
          </nav>
          <h2 className="font-headline-md text-headline-md text-on-surface">{t('suppliers.title')}</h2>
        </div>
        <div className="flex items-center space-x-md">
          <button type="button" className="ghost-btn" onClick={() => { void loadSuppliers(); void loadCategories(); }}>
            <RefreshCw size={16} /><span>{t('menu.refresh')}</span>
          </button>
          {tab === 'suppliers' ? (
            <button type="button" className="primary-btn" onClick={openCreate}>
              <Plus size={16} /><span>{t('suppliers.addSupplier')}</span>
            </button>
          ) : null}
        </div>
      </section>

      {error ? (
        <div className="panel error-banner mt-4 flex items-center gap-2 text-xs font-bold">
          <AlertCircle size={16} /><span>{error}</span>
        </div>
      ) : null}

      {/* Tabs */}
      <div className="flex gap-1 mt-4 border-b border-slate-200">
        <button
          type="button"
          className={`px-5 py-3 text-sm font-bold border-b-2 transition-colors ${tab === 'suppliers' ? 'border-[#ac2d00] text-[#ac2d00]' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
          onClick={() => setTab('suppliers')}
        >
          {t('suppliers.title')}
        </button>
        <button
          type="button"
          className={`px-5 py-3 text-sm font-bold border-b-2 transition-colors ${tab === 'categories' ? 'border-[#ac2d00] text-[#ac2d00]' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
          onClick={() => setTab('categories')}
        >
          {t('suppliers.categories')}
        </button>
      </div>

      {tab === 'suppliers' ? (
        <>
          {/* KPI Bento Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-gutter mb-xl mt-4">
            <div className="bg-surface-container-lowest border border-border-muted rounded-xl shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-24 h-24 -mr-8 -mt-8 bg-primary/5 rounded-full group-hover:scale-110 transition-transform duration-500"></div>
              <div className="relative z-10 flex flex-row items-center justify-between gap-4 p-6">
                <div className="flex flex-col gap-1">
                  <p className="text-secondary font-label-md uppercase tracking-wider">{t('suppliers.totalSuppliers')}</p>
                  <h3 className="text-display-lg font-display-lg text-on-surface">{loading ? '…' : stats.total}</h3>
                  <span className="text-success font-label-md flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">trending_up</span>
                    +{loading ? '…' : stats.total > 0 ? Math.min(stats.total, 5) : 0}
                  </span>
                </div>
                <div className="p-3 bg-primary-fixed rounded-lg shrink-0">
                  <span className="material-symbols-outlined text-on-primary-fixed-variant">inventory</span>
                </div>
              </div>
            </div>

            <div className="bg-surface-container-lowest border border-border-muted rounded-xl shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-24 h-24 -mr-8 -mt-8 bg-success/5 rounded-full group-hover:scale-110 transition-transform duration-500"></div>
              <div className="relative z-10 flex flex-row items-center justify-between gap-4 p-6">
                <div className="flex flex-col gap-1">
                  <p className="text-secondary font-label-md uppercase tracking-wider">{t('suppliers.active')}</p>
                  <h3 className="text-display-lg font-display-lg text-on-surface">{loading ? '…' : stats.active}</h3>
                  <span className="text-secondary font-label-md">
                    {stats.total > 0 ? Math.round((stats.active / stats.total) * 100) : 0}% of total
                  </span>
                </div>
                <div className="p-3 bg-tertiary-fixed rounded-lg shrink-0">
                  <span className="material-symbols-outlined text-tertiary">check_circle</span>
                </div>
              </div>
            </div>

            <div className="md:col-span-2 bg-sidebar-bg p-lg rounded-xl shadow-lg relative overflow-hidden">
              <div className="relative z-10 flex h-full items-center justify-between">
                <div>
                  <p className="text-on-primary-container font-label-md uppercase tracking-wider mb-1">{t('suppliers.logisticsStatus')}</p>
                  <h3 className="text-headline-md font-headline-md text-white mb-2">{t('suppliers.networkStatus')}</h3>
                  <p className="text-secondary-fixed-dim text-body-sm max-w-xs">{t('suppliers.logisticsDescription')}</p>
                </div>
                <div className="flex items-center justify-center w-24 h-24 border-4 border-primary-container rounded-full">
                  <span className="text-white font-display-lg">
                    {loading ? '…' : Math.min(98, stats.active > 0 ? 85 + Math.round((stats.active / Math.max(stats.total, 1)) * 15) : 0)}
                    <span className="text-lg">%</span>
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-col md:flex-row md:items-center gap-3 mb-lg">
            <div className="relative flex-1 max-w-md">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary" />
              <input
                type="text"
                className="w-full pl-10 pr-4 py-2 bg-surface-container-low border-none rounded-lg text-body-md focus:ring-2 focus:ring-primary transition-all placeholder:text-secondary/50"
                placeholder={t('suppliers.search')}
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
            <div className="relative">
              <button className="flex items-center px-4 py-2 bg-surface border border-border-muted rounded-lg text-body-md text-secondary hover:bg-surface-container-low transition-all">
                <span className="material-symbols-outlined mr-2">filter_list</span>
                {t('common.status')}: {statusFilter === 'ALL' ? t('common.all') : statusFilter === 'ACTIVE' ? t('suppliers.active') : t('suppliers.inactive')}
              </button>
            </div>
          </div>

          {/* Data Table */}
          <section className="bg-surface-container-lowest border border-border-muted rounded-xl shadow-sm overflow-hidden">
            {loading ? (
              <div className="p-10 text-center text-secondary">{t('suppliers.loading')}</div>
            ) : filtered.length === 0 ? (
              <div className="p-10 text-center text-secondary">{t('suppliers.noSuppliers')}</div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-surface-subtle border-b border-border-muted">
                      <tr>
                        <th className="px-lg py-4 font-label-md text-secondary uppercase tracking-widest">{t('suppliers.id')}</th>
                        <th className="px-lg py-4 font-label-md text-secondary uppercase tracking-widest">{t('suppliers.name')}</th>
                        <th className="px-lg py-4 font-label-md text-secondary uppercase tracking-widest">{t('suppliers.contactName')}</th>
                        <th className="px-lg py-4 font-label-md text-secondary uppercase tracking-widest">{t('suppliers.contactDetails')}</th>
                        <th className="px-lg py-4 font-label-md text-secondary uppercase tracking-widest">{t('suppliers.supplyingCategories')}</th>
                        <th className="px-lg py-4 font-label-md text-secondary uppercase tracking-widest">{t('common.status')}</th>
                        <th className="px-lg py-4 font-label-md text-secondary uppercase tracking-widest text-right">{t('common.actions')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border-muted/50">
                      {filtered.map((supplier, idx) => (
                        <tr key={supplier.id} className="hover:bg-surface-container-low transition-colors group">
                          <td className="px-lg py-4 font-data-mono text-primary font-medium">SUP-{supplier.id.slice(0, 4).toUpperCase()}</td>
                          <td className="px-lg py-4">
                            <div className="flex items-center">
                              <div className="w-8 h-8 rounded bg-surface-container-high flex items-center justify-center text-primary font-bold mr-3">
                                {avatarChar(supplier.name)}
                              </div>
                              <span className="font-semibold text-on-surface">{supplier.name}</span>
                            </div>
                          </td>
                          <td className="px-lg py-4 text-on-surface">{supplier.contactName || '—'}</td>
                          <td className="px-lg py-4">
                            <p className="text-body-sm text-on-surface">{supplier.phone || '—'}</p>
                            <p className="text-body-sm text-secondary">{supplier.email || '—'}</p>
                          </td>
                          <td className="px-lg py-4">
                            <div className="flex flex-wrap gap-1">
                              {supplier.categoryNames.length > 0
                                ? supplier.categoryNames.map((name, i) => (
                                    <span key={i} className="px-2 py-0.5 bg-surface-container-high text-on-secondary-fixed-variant rounded text-[10px] font-bold uppercase tracking-tight">{name}</span>
                                  ))
                                : supplier.supplyingCategories
                                  ? supplier.supplyingCategories.split(',').map((c, i) => (
                                      <span key={i} className="px-2 py-0.5 bg-surface-container-high text-on-secondary-fixed-variant rounded text-[10px] font-bold uppercase tracking-tight">{c.trim()}</span>
                                    ))
                                  : <span className="text-secondary/50 text-body-sm">—</span>
                              }
                            </div>
                          </td>
                          <td className="px-lg py-4">
                            <span className={`text-[10px] font-black px-2 py-1 rounded uppercase tracking-tighter ${statusBadgeClass(supplier.status)}`}>
                              {supplier.status}
                            </span>
                          </td>
                          <td className="px-lg py-4 text-right">
                            <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                type="button"
                                className="p-1 hover:bg-surface-container-high rounded transition-all"
                                title={t('common.edit')}
                                onClick={() => openEdit(supplier)}
                              >
                                <span className="material-symbols-outlined text-secondary">edit</span>
                              </button>
                              <button
                                type="button"
                                className="p-1 hover:bg-surface-container-high rounded transition-all"
                                title={supplier.status === 'ACTIVE' ? t('suppliers.deactivate') : t('suppliers.activate')}
                                onClick={() => void handleToggleStatus(supplier)}
                              >
                                <span className="material-symbols-outlined text-secondary">toggle_on</span>
                              </button>
                              <button
                                type="button"
                                className="p-1 hover:bg-surface-container-high rounded transition-all text-danger"
                                title={t('common.delete')}
                                onClick={() => setDeleteTarget(supplier)}
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
        </>
      ) : (
        <>
          {/* Categories Tab */}
          <div className="panel mt-4">
            <div className="flex items-center gap-3 mb-4">
              <input
                className="rounded-2xl border border-slate-200 px-4 py-2.5 text-sm flex-1 outline-none"
                placeholder={t('suppliers.categoryName')}
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') void handleAddCategory(); }}
              />
              <button type="button" className="primary-btn" disabled={catSaving || !newCatName.trim()} onClick={() => void handleAddCategory()}>
                {catSaving ? t('common.saving') : <><Plus size={16} /><span>{t('suppliers.addCategory')}</span></>}
              </button>
            </div>

            {catLoading ? (
              <div className="p-6 text-center text-slate-400">{t('common.loading')}</div>
            ) : categories.length === 0 ? (
              <div className="p-6 text-center text-slate-400">{t('suppliers.noSuppliers')}</div>
            ) : (
              <div className="space-y-2">
                {categories.map((cat) => (
                  <div key={cat.id} className="flex items-center justify-between rounded-2xl border border-slate-100 px-4 py-3">
                    <span className="text-sm font-medium text-slate-800">{cat.name}</span>
                    <button type="button" className="icon-btn subtle text-rose-500 hover:bg-rose-50" title={t('common.delete')} onClick={() => setDeleteCatTarget(cat)}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Delete category confirm */}
          {deleteCatTarget ? (
            <div className="modal-backdrop" onClick={() => setDeleteCatTarget(null)}>
              <div className="modal-card" onClick={(e) => e.stopPropagation()}>
                <div className="modal-head">
                  <div><h3>{t('common.delete')}</h3><p>{t('suppliers.categoryDeleteConfirm')}</p></div>
                  <button type="button" className="icon-btn" onClick={() => setDeleteCatTarget(null)}><X size={16} /></button>
                </div>
                <div className="px-6 py-4 text-sm text-slate-600"><strong>{deleteCatTarget.name}</strong></div>
                <div className="modal-actions">
                  <button type="button" className="ghost-btn" onClick={() => setDeleteCatTarget(null)}>{t('common.cancel')}</button>
                  <button type="button" className="primary-btn" style={{ background: '#dc2626' }} disabled={catDeleting} onClick={() => void handleDeleteCategory()}>
                    {catDeleting ? t('common.saving') : t('common.delete')}
                  </button>
                </div>
              </div>
            </div>
          ) : null}
        </>
      )}

      {/* Side Drawer (Add/Edit Supplier) */}
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
                  {editTarget ? t('suppliers.editSupplier') : t('suppliers.addNewSupplier')}
                </h3>
                <p className="text-sm text-gray-500 dark:text-slate-400">
                  {editTarget ? t('suppliers.editDescription') : t('suppliers.registerVendor')}
                </p>
              </div>
              <button type="button" className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full transition-all" onClick={closeDrawer}>
                <span className="material-symbols-outlined text-gray-600 dark:text-slate-300">close</span>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-8">
              <div className="space-y-4">
                <h4 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-widest border-l-4 border-primary pl-3">{t('suppliers.companyInformation')}</h4>
                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-1">
                    <label className="text-sm font-semibold text-gray-900 dark:text-white">{t('suppliers.companyName')} <span className="text-danger">*</span></label>
                    <input
                      type="text"
                      className={`w-full bg-white border border-gray-300 text-gray-900 placeholder-gray-400 rounded-lg focus:border-primary focus:ring-1 focus:ring-primary py-2.5 px-3 ${formErrors.name ? 'border-red-400' : ''}`}
                      placeholder={t('suppliers.name')}
                      value={form.name}
                      onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))}
                    />
                    {formErrors.name ? <p className="text-danger text-body-sm mt-1">{formErrors.name}</p> : null}
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-semibold text-gray-900 dark:text-white">{t('suppliers.address')}</label>
                    <textarea
                      className="w-full bg-white border border-gray-300 text-gray-900 placeholder-gray-400 rounded-lg focus:border-primary focus:ring-1 focus:ring-primary py-2.5 px-3"
                      placeholder="Street, City, Zip Code"
                      rows={3}
                      value={form.address}
                      onChange={(e) => setForm((s) => ({ ...s, address: e.target.value }))}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4 pt-4">
                <h4 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-widest border-l-4 border-primary pl-3">{t('suppliers.primaryContact')}</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1 col-span-2">
                    <label className="text-sm font-semibold text-gray-900 dark:text-white">{t('suppliers.contactName')}</label>
                    <input
                      type="text"
                      className={`w-full bg-white border border-gray-300 text-gray-900 placeholder-gray-400 rounded-lg focus:border-primary focus:ring-1 focus:ring-primary py-2.5 px-3 ${formErrors.contactName ? 'border-red-400' : ''}`}
                      placeholder="e.g. John Doe"
                      value={form.contactName}
                      onChange={(e) => setForm((s) => ({ ...s, contactName: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-semibold text-gray-900 dark:text-white">{t('suppliers.phone')}</label>
                    <input
                      type="tel"
                      className={`w-full bg-white border border-gray-300 text-gray-900 placeholder-gray-400 rounded-lg focus:border-primary focus:ring-1 focus:ring-primary py-2.5 px-3 ${formErrors.phone ? 'border-red-400' : ''}`}
                      placeholder="+1 (000) 000-0000"
                      value={form.phone}
                      onChange={(e) => setForm((s) => ({ ...s, phone: e.target.value }))}
                    />
                    {formErrors.phone ? <p className="text-danger text-body-sm mt-1">{formErrors.phone}</p> : null}
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-semibold text-gray-900 dark:text-white">{t('suppliers.email')}</label>
                    <input
                      type="email"
                      className={`w-full bg-white border border-gray-300 text-gray-900 placeholder-gray-400 rounded-lg focus:border-primary focus:ring-1 focus:ring-primary py-2.5 px-3 ${formErrors.email ? 'border-red-400' : ''}`}
                      placeholder="contact@company.com"
                      value={form.email}
                      onChange={(e) => setForm((s) => ({ ...s, email: e.target.value }))}
                    />
                    {formErrors.email ? <p className="text-danger text-body-sm mt-1">{formErrors.email}</p> : null}
                  </div>
                </div>
              </div>

              <div className="space-y-4 pt-4">
                <h4 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-widest border-l-4 border-primary pl-3">{t('suppliers.operationalDetails')}</h4>
                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-1">
                    <label className="text-sm font-semibold text-gray-900 dark:text-white">{t('suppliers.supplyingCategories')}</label>
                    <div className="grid grid-cols-2 gap-3 p-4 bg-gray-50 dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700">
                      {CATEGORY_OPTIONS.map((cat) => {
                        const catKey = cat.replace(/\s+/g, '');
                        const isSelected = form.supplyingCategories.split(',').map(s => s.trim()).includes(cat) || form.categoryIds.length > 0;
                        return (
                          <label key={cat} className="flex flex-row-reverse items-center justify-end gap-3 cursor-pointer bg-white dark:bg-slate-700 px-3 py-2.5 rounded-lg border border-gray-200 dark:border-slate-600 hover:border-primary transition-all">
                            <input
                              type="checkbox"
                              className="rounded text-primary focus:ring-primary"
                              checked={form.supplyingCategories.includes(cat)}
                              onChange={(e) => {
                                const cats = form.supplyingCategories.split(',').map(s => s.trim()).filter(Boolean);
                                if (e.target.checked) cats.push(cat);
                                else {
                                  const idx = cats.indexOf(cat);
                                  if (idx >= 0) cats.splice(idx, 1);
                                }
                                setForm((s) => ({ ...s, supplyingCategories: cats.join(',') }));
                              }}
                            />
                            <span className="text-sm font-medium text-gray-900 dark:text-white">{t(`suppliers.category.${catKey}`)}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  {/* Category badges from DB */}
                  {categories.length > 0 && (
                    <div className="space-y-1">
                      <label className="text-sm font-semibold text-gray-900 dark:text-white">{t('suppliers.databaseCategories')}</label>
                      <div className="flex flex-wrap gap-2 p-3 border border-gray-200 dark:border-slate-700 rounded-lg bg-gray-50 dark:bg-slate-800">
                        {categories.map((cat) => {
                          const selected = form.categoryIds.includes(cat.id);
                          return (
                            <button
                              key={cat.id}
                              type="button"
                              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold border transition-colors ${
                                selected
                                  ? 'bg-primary text-white border-primary'
                                  : 'bg-white text-gray-700 border-gray-300 hover:border-primary'
                              }`}
                              onClick={() => toggleCategory(cat.id)}
                            >
                              {selected ? <Check size={12} /> : null}
                              {cat.name}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-slate-700 rounded-lg bg-gray-50 dark:bg-slate-800">
                    <div>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">{t('suppliers.supplierStatus')}</p>
                      <p className="text-sm text-gray-500 dark:text-slate-400">{t('suppliers.statusDescription')}</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={form.status === 'ACTIVE'}
                        onChange={(e) => setForm((s) => ({ ...s, status: e.target.checked ? 'ACTIVE' : 'INACTIVE' }))}
                      />
                      <div className="w-11 h-6 bg-gray-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                  </div>
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
                {saving ? t('common.saving') : editTarget ? t('suppliers.save') : t('suppliers.createSupplier')}
              </button>
            </div>
          </div>
        </>
      ) : null}

      {/* Delete supplier confirm */}
      {deleteTarget ? (
        <div className="modal-backdrop" onClick={() => setDeleteTarget(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <div><h3>{t('common.delete')}</h3><p>{t('suppliers.deleteConfirm')}</p></div>
              <button type="button" className="icon-btn" onClick={() => setDeleteTarget(null)}><X size={16} /></button>
            </div>
            <div className="px-6 py-4 text-sm text-slate-600"><strong>{deleteTarget.name}</strong></div>
            <div className="modal-actions">
              <button type="button" className="ghost-btn" onClick={() => setDeleteTarget(null)}>{t('common.cancel')}</button>
              <button type="button" className="primary-btn" style={{ background: '#dc2626' }} disabled={deleting} onClick={() => void handleDelete()}>
                {deleting ? t('common.saving') : t('common.delete')}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
