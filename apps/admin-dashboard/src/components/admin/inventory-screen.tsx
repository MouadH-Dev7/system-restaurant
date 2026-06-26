'use client';

import { useEffect, useMemo, useState } from 'react';
import { AlertCircle, Plus, RefreshCw } from 'lucide-react';
import type { InventoryItemDTO } from '@repo/shared-types';
import { getApiErrorMessage } from '@/lib/api-error';
import { useI18n } from '@/hooks/use-i18n';
import { useAppStore } from '@/store/app.store';
import {
  createInventoryItem,
  listInventory,
  updateInventoryItem,
} from '@/services/inventory.service';

export function InventoryScreen() {
  const { t, formatCurrency, formatNumber, statusLabel } = useI18n();
  const restaurantId = useAppStore((state) => state.restaurantId);
  const [items, setItems] = useState<InventoryItemDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState({
    name: '',
    unit: 'kg',
    stockLevel: '0',
    minAlertLevel: '0',
    unitPrice: '0',
    supplier: '',
  });

  async function load() {
    const activeRestaurantId = restaurantId;

    if (!activeRestaurantId) {
      setItems([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setItems(await listInventory(activeRestaurantId));
    } catch (nextError) {
      setError(getApiErrorMessage(nextError, t('inventory.title')));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, [restaurantId]);

  const stats = useMemo(() => {
    const low = items.filter((item) => item.status !== 'HEALTHY').length;
    const valuation = items.reduce((sum, item) => sum + item.stockLevel * item.unitPrice, 0);
    return { total: items.length, low, valuation };
  }, [items]);

  async function handleCreate() {
    const activeRestaurantId = restaurantId;

    if (!activeRestaurantId) {
      setError(t('inventory.title'));
      return;
    }

    try {
      setSaving(true);
      setError(null);
      await createInventoryItem({
        restaurantId: activeRestaurantId,
        name: draft.name,
        unit: draft.unit,
        stockLevel: Number(draft.stockLevel),
        minAlertLevel: Number(draft.minAlertLevel),
        unitPrice: Number(draft.unitPrice),
        supplier: draft.supplier,
      });
      setDraft({
        name: '',
        unit: 'kg',
        stockLevel: '0',
        minAlertLevel: '0',
        unitPrice: '0',
        supplier: '',
      });
      await load();
    } catch (nextError) {
      setError(getApiErrorMessage(nextError, t('inventory.addItem')));
    } finally {
      setSaving(false);
    }
  }

  async function handleRestock(item: InventoryItemDTO) {
    try {
      await updateInventoryItem(item.id, { stockLevel: item.stockLevel + item.minAlertLevel });
      await load();
    } catch (nextError) {
      setError(getApiErrorMessage(nextError, t('inventory.restock')));
    }
  }

  return (
    <>
      <section className="page-header">
        <div>
          <h2>{t('inventory.title')}</h2>
          <p>{t('inventory.subtitle')}</p>
        </div>
        <button type="button" className="ghost-btn" onClick={() => void load()}>
          <RefreshCw size={16} />
          <span>{t('menu.refresh')}</span>
        </button>
      </section>

      {error ? (
        <div className="panel error-banner mt-4 flex items-center gap-2 text-xs font-bold">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      ) : null}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
        <div className="panel">
          <strong>{formatNumber(stats.total)}</strong>
          <p>{t('inventory.totalItems')}</p>
        </div>
        <div className="panel">
          <strong>{formatNumber(stats.low)}</strong>
          <p>{t('inventory.alerts')}</p>
        </div>
        <div className="panel">
          <strong>{formatCurrency(stats.valuation)}</strong>
          <p>{t('inventory.valuation')}</p>
        </div>
      </div>

      <section className="panel mt-6">
        <div className="panel-header">
          <div>
            <h3>{t('inventory.addItem')}</h3>
            <p>{t('inventory.createDescription')}</p>
          </div>
        </div>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-6 mt-4">
          <input
            className="rounded-2xl border border-slate-200 px-4 py-3 text-sm"
            placeholder={t('inventory.name')}
            value={draft.name}
            onChange={(e) => setDraft((s) => ({ ...s, name: e.target.value }))}
          />
          <input
            className="rounded-2xl border border-slate-200 px-4 py-3 text-sm"
            placeholder={t('inventory.unit')}
            value={draft.unit}
            onChange={(e) => setDraft((s) => ({ ...s, unit: e.target.value }))}
          />
          <input
            className="rounded-2xl border border-slate-200 px-4 py-3 text-sm"
            placeholder={t('inventory.stock')}
            value={draft.stockLevel}
            onChange={(e) => setDraft((s) => ({ ...s, stockLevel: e.target.value }))}
          />
          <input
            className="rounded-2xl border border-slate-200 px-4 py-3 text-sm"
            placeholder={t('inventory.minAlert')}
            value={draft.minAlertLevel}
            onChange={(e) => setDraft((s) => ({ ...s, minAlertLevel: e.target.value }))}
          />
          <input
            className="rounded-2xl border border-slate-200 px-4 py-3 text-sm"
            placeholder={t('inventory.unitPrice')}
            value={draft.unitPrice}
            onChange={(e) => setDraft((s) => ({ ...s, unitPrice: e.target.value }))}
          />
          <input
            className="rounded-2xl border border-slate-200 px-4 py-3 text-sm"
            placeholder={t('inventory.supplier')}
            value={draft.supplier}
            onChange={(e) => setDraft((s) => ({ ...s, supplier: e.target.value }))}
          />
        </div>
        <button
          type="button"
          className="primary-btn mt-4"
          disabled={saving}
          onClick={() => void handleCreate()}
        >
          <Plus size={16} />
          <span>{saving ? t('common.saving') : t('inventory.add')}</span>
        </button>
      </section>

      <section className="panel mt-6">
        {loading ? (
          <div className="p-10 text-center text-slate-400">{t('inventory.loading')}</div>
        ) : (
          <div className="space-y-3">
            {items.map((item) => (
              <div
                key={item.id}
                className="rounded-2xl border border-slate-100 p-4 flex items-center justify-between gap-3"
              >
                <div>
                  <strong className="block text-slate-800">{item.name}</strong>
                  <span className="text-xs text-slate-500">
                    {formatNumber(item.stockLevel)} {item.unit} / {t('inventory.minimum')}{' '}
                    {formatNumber(item.minAlertLevel)} / {statusLabel(item.status)}
                  </span>
                </div>
                <button
                  type="button"
                  className="ghost-btn small"
                  onClick={() => void handleRestock(item)}
                >
                  <span>{t('inventory.restock')}</span>
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
