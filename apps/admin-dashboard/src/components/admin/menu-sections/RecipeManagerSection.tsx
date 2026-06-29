'use client';

import { useEffect, useState } from 'react';
import { Plus, Save, Trash2, AlertCircle } from 'lucide-react';
import type { InventoryItemDTO, MenuItemIngredientDTO } from '@repo/shared-types';
import { getApiErrorMessage } from '@/lib/api-error';
import { useI18n } from '@/hooks/use-i18n';
import { useAppStore } from '@/store/app.store';
import { listInventory } from '@/services/inventory.service';
import {
  listMenuItemIngredients,
  createMenuItemIngredient,
  updateMenuItemIngredient,
  deleteMenuItemIngredient,
} from '@/services/menu-item-ingredients.service';

type RecipeManagerSectionProps = {
  menuItemId: string | null;
};

type IngredientRow = {
  id?: string;
  inventoryItemId: string;
  quantityRequired: string;
};

export function RecipeManagerSection({ menuItemId }: RecipeManagerSectionProps) {
  const { t } = useI18n();
  const restaurantId = useAppStore((state) => state.restaurantId);
  const [ingredients, setIngredients] = useState<MenuItemIngredientDTO[]>([]);
  const [inventoryItems, setInventoryItems] = useState<InventoryItemDTO[]>([]);
  const [newRow, setNewRow] = useState<IngredientRow>({ inventoryItemId: '', quantityRequired: '' });
  const [editingRows, setEditingRows] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!menuItemId || !restaurantId) {
      setIngredients([]);
      setInventoryItems([]);
      setLoading(false);
      return;
    }

    const activeMenuItemId = menuItemId;
    const activeRestaurantId = restaurantId;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [ingredientData, inventoryData] = await Promise.all([
          listMenuItemIngredients(activeMenuItemId),
          listInventory(activeRestaurantId),
        ]);
        setIngredients(ingredientData);
        setInventoryItems(inventoryData);
      } catch (nextError) {
        setError(getApiErrorMessage(nextError, t('menu.title')));
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, [menuItemId, restaurantId]);

  async function handleAdd() {
    if (!menuItemId || !newRow.inventoryItemId || !newRow.quantityRequired) {
      return;
    }

    const qty = Number.parseFloat(newRow.quantityRequired);
    if (!Number.isFinite(qty) || qty <= 0) {
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const created = await createMenuItemIngredient({
        menuItemId,
        inventoryItemId: newRow.inventoryItemId,
        quantityRequired: qty,
      });
      setIngredients((current) => [...current, created]);
      setNewRow({ inventoryItemId: '', quantityRequired: '' });
    } catch (nextError) {
      setError(getApiErrorMessage(nextError, t('menu.title')));
    } finally {
      setSaving(false);
    }
  }

  async function handleUpdate(id: string) {
    const qtyRaw = editingRows[id];
    if (qtyRaw === undefined) {
      return;
    }

    const qty = Number.parseFloat(qtyRaw);
    if (!Number.isFinite(qty) || qty <= 0) {
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const updated = await updateMenuItemIngredient(id, { quantityRequired: qty });
      setIngredients((current) => current.map((item) => (item.id === id ? updated : item)));
      setEditingRows((current) => {
        const next = { ...current };
        delete next[id];
        return next;
      });
    } catch (nextError) {
      setError(getApiErrorMessage(nextError, t('menu.title')));
    } finally {
      setSaving(false);
    }
  }

  async function handleRemove(id: string) {
    setSaving(true);
    setError(null);
    try {
      await deleteMenuItemIngredient(id);
      setIngredients((current) => current.filter((item) => item.id !== id));
    } catch (nextError) {
      setError(getApiErrorMessage(nextError, t('menu.title')));
    } finally {
      setSaving(false);
    }
  }

  const availableInventory = inventoryItems.filter(
    (inv) => !ingredients.some((ing) => ing.inventoryItemId === inv.id),
  );

  if (!menuItemId) {
    return (
      <div className="mt-4 rounded-[28px] border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-slate-500">
        {t('menu.selectItemPrompt')}
      </div>
    );
  }

  return (
    <div className="panel space-y-4">
      <div className="panel-header">
        <h3>{t('menu.recipeTitle')}</h3>
        <p>{t('menu.recipeSubtitle')}</p>
      </div>

      {error ? (
        <div className="flex items-center gap-2 text-xs font-bold text-rose-600 bg-rose-50 border border-rose-200 rounded-xl p-3">
          <AlertCircle size={14} />
          <span>{error}</span>
        </div>
      ) : null}

      {loading ? (
        <div className="text-center py-8 text-slate-500 text-sm">{t('common.loading')}</div>
      ) : (
        <div className="space-y-3">
          {ingredients.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-sm border border-dashed border-slate-200 rounded-2xl">
              {t('menu.noIngredients')}
            </div>
          ) : (
            ingredients.map((ingredient) => (
              <div
                key={ingredient.id}
                className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800 truncate">
                    {ingredient.inventoryItemName}
                  </p>
                  <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">
                    {ingredient.inventoryItemUnit}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {editingRows[ingredient.id] !== undefined ? (
                    <input
                      type="number"
                      step="any"
                      min="0"
                      className="w-20 rounded-xl border border-slate-200 px-3 py-1.5 text-sm text-center outline-none focus:border-[#cf6d43] focus:ring-2 focus:ring-[#cf6d43]/10"
                      value={editingRows[ingredient.id]}
                      onChange={(e) =>
                        setEditingRows((current) => ({
                          ...current,
                          [ingredient.id]: e.target.value,
                        }))
                      }
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          void handleUpdate(ingredient.id);
                        }
                      }}
                    />
                  ) : (
                    <span
                      className="text-sm font-bold text-slate-700 cursor-pointer min-w-[4rem] text-right"
                      onClick={() =>
                        setEditingRows((current) => ({
                          ...current,
                          [ingredient.id]: String(ingredient.quantityRequired),
                        }))
                      }
                    >
                      {ingredient.quantityRequired}
                    </span>
                  )}
                  <span className="text-[10px] text-slate-400 font-semibold uppercase w-8">
                    {t('menu.perUnit')}
                  </span>
                  {editingRows[ingredient.id] !== undefined ? (
                    <button
                      type="button"
                      className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
                      disabled={saving}
                      onClick={() => void handleUpdate(ingredient.id)}
                    >
                      <Save size={14} />
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="p-1.5 rounded-lg bg-rose-50 text-rose-500 hover:bg-rose-100"
                      disabled={saving}
                      onClick={() => void handleRemove(ingredient.id)}
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {availableInventory.length > 0 ? (
        <div className="flex items-end gap-3 border-t border-slate-100 pt-4">
          <div className="flex-1 space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              {t('menu.ingredient')}
            </span>
            <select
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-[#cf6d43] focus:ring-2 focus:ring-[#cf6d43]/10"
              value={newRow.inventoryItemId}
              onChange={(e) =>
                setNewRow((current) => ({ ...current, inventoryItemId: e.target.value }))
              }
            >
              <option value="">{t('menu.selectIngredient')}</option>
              {availableInventory.map((inv) => (
                <option key={inv.id} value={inv.id}>
                  {inv.name} ({inv.unit})
                </option>
              ))}
            </select>
          </div>
          <div className="w-28 space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              {t('menu.qtyPerUnit')}
            </span>
            <input
              type="number"
              step="any"
              min="0"
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-[#cf6d43] focus:ring-2 focus:ring-[#cf6d43]/10"
              placeholder="0"
              value={newRow.quantityRequired}
              onChange={(e) =>
                setNewRow((current) => ({ ...current, quantityRequired: e.target.value }))
              }
            />
          </div>
          <button
            type="button"
            className="inline-flex items-center gap-1.5 rounded-2xl bg-[#cf6d43] px-5 py-2.5 text-sm font-bold text-white transition hover:bg-[#b85a34] disabled:opacity-50"
            disabled={saving || !newRow.inventoryItemId || !newRow.quantityRequired}
            onClick={() => void handleAdd()}
          >
            <Plus size={16} />
            <span>{t('menu.addIngredient')}</span>
          </button>
        </div>
      ) : null}
    </div>
  );
}
