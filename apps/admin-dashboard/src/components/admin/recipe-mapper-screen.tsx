'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  ChevronDown,
  ChevronRight,
  FlaskConical,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  X,
} from 'lucide-react';
import type {
  CreateMenuItemIngredientInput,
  CreateModifierIngredientInput,
  InventoryUnit,
  MenuDTO,
  MenuItemDTO,
  MenuItemIngredientDTO,
  ModifierGroupDTO,
  ModifierIngredientDTO,
  ModifierOptionDTO,
} from '@repo/shared-types';
import { getApiErrorMessage } from '@/lib/api-error';
import { useI18n } from '@/hooks/use-i18n';
import { useAppStore } from '@/store/app.store';
import { listMenus, listMenuItems } from '@/services/menu.service';
import {
  createMenuItemIngredient,
  deleteMenuItemIngredient,
  listMenuItemIngredients,
  updateMenuItemIngredient,
} from '@/services/menu-item-ingredients.service';
import {
  createModifierIngredient,
  deleteModifierIngredient,
  listModifierIngredients,
  updateModifierIngredient,
} from '@/services/modifier-ingredients.service';
import { listInventory } from '@/services/inventory.service';
import type { InventoryItemDTO } from '@repo/shared-types';

const CONVERSION_GROUPS: Record<string, { base: InventoryUnit; sub: InventoryUnit; factor: number }> = {
  KG: { base: 'KG', sub: 'GRAM', factor: 1000 },
  GRAM: { base: 'KG', sub: 'GRAM', factor: 1000 },
  LITER: { base: 'LITER', sub: 'ML', factor: 1000 },
  ML: { base: 'LITER', sub: 'ML', factor: 1000 },
};

function convertUnit(value: number, from: InventoryUnit, to: InventoryUnit): number {
  if (from === to) return value;
  const group = CONVERSION_GROUPS[from];
  if (!group) return value;
  if (group.base === to) return value / group.factor;
  if (group.sub === to) return value * group.factor;
  return value;
}

function getDisplayUnit(quantity: number, baseUnit: string): { value: number; unit: string } {
  const subUnitMap: Record<string, { unit: string; factor: number }> = {
    KG: { unit: 'GRAM', factor: 1000 },
    LITER: { unit: 'ML', factor: 1000 },
  };
  const conversion = subUnitMap[baseUnit];
  if (conversion && quantity > 0 && quantity < 1) {
    return { value: Math.round(quantity * conversion.factor * 100) / 100, unit: conversion.unit };
  }
  return { value: quantity, unit: baseUnit };
}

type IngredientFormData = {
  inventoryItemId: string;
  quantityRequired: string;
  inputUnit: InventoryUnit;
};

const EMPTY_INGREDIENT_FORM: IngredientFormData = {
  inventoryItemId: '',
  quantityRequired: '1',
  inputUnit: 'KG',
};

export function RecipeMapperScreen() {
  const { t, dir, formatNumber } = useI18n();
  const restaurantId = useAppStore((state) => state.restaurantId);

  const [menus, setMenus] = useState<MenuDTO[]>([]);
  const [menuItemsByMenu, setMenuItemsByMenu] = useState<Record<string, MenuItemDTO[]>>({});
  const [expandedMenus, setExpandedMenus] = useState<Set<string>>(new Set());
  const [selectedMenuItem, setSelectedMenuItem] = useState<MenuItemDTO | null>(null);
  const [selectedModifierOption, setSelectedModifierOption] = useState<ModifierOptionDTO | null>(null);
  const [tab, setTab] = useState<'recipe' | 'modifiers'>('recipe');

  const [menuItemIngredients, setMenuItemIngredients] = useState<MenuItemIngredientDTO[]>([]);
  const [modifierIngredients, setModifierIngredients] = useState<ModifierIngredientDTO[]>([]);
  const [allInventory, setAllInventory] = useState<InventoryItemDTO[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const [showDrawer, setShowDrawer] = useState(false);
  const [drawerTab, setDrawerTab] = useState<'item-ingredient' | 'modifier-ingredient'>('item-ingredient');
  const [editTargetId, setEditTargetId] = useState<string | null>(null);
  const [form, setForm] = useState<IngredientFormData>(EMPTY_INGREDIENT_FORM);
  const [formErrors, setFormErrors] = useState<Partial<Record<string, string>>>({});

  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const rid = restaurantId;

  async function loadMenus() {
    if (!rid) { setMenus([]); setLoading(false); return; }
    try {
      setLoading(true); setError(null);
      const data = await listMenus(rid);
      setMenus(data);
    } catch (e) {
      setError(getApiErrorMessage(e, t('recipeMapper.title')));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void loadMenus(); }, [restaurantId]);

  useEffect(() => {
    if (!selectedMenuItem || tab !== 'recipe') return;
    void loadMenuItemIngredients();
  }, [selectedMenuItem, tab]);

  async function loadMenuItemIngredients() {
    if (!selectedMenuItem) return;
    try {
      const data = await listMenuItemIngredients(selectedMenuItem.id);
      setMenuItemIngredients(data);
    } catch (e) {
      setMenuItemIngredients([]);
    }
  }

  useEffect(() => {
    if (!selectedModifierOption) return;
    void loadModifierIngredients();
  }, [selectedModifierOption]);

  async function loadModifierIngredients() {
    if (!selectedModifierOption) return;
    try {
      const data = await listModifierIngredients(selectedModifierOption.id);
      setModifierIngredients(data);
    } catch (e) {
      setModifierIngredients([]);
    }
  }

  async function loadInventory() {
    if (!rid) return;
    try {
      const data = await listInventory(rid);
      setAllInventory(data);
    } catch {
      setAllInventory([]);
    }
  }

  async function toggleMenu(menuId: string) {
    const next = new Set(expandedMenus);
    if (next.has(menuId)) {
      next.delete(menuId);
      setExpandedMenus(next);
      return;
    }
    next.add(menuId);
    setExpandedMenus(next);

    if (!menuItemsByMenu[menuId] && rid) {
      try {
        const items = await listMenuItems(rid, menuId);
        setMenuItemsByMenu((prev) => ({ ...prev, [menuId]: items }));
      } catch {
        setMenuItemsByMenu((prev) => ({ ...prev, [menuId]: [] }));
      }
    }
  }

  function selectMenuItem(item: MenuItemDTO) {
    setSelectedMenuItem(item);
    setSelectedModifierOption(null);
    setTab('recipe');
    setMenuItemIngredients([]);
    setModifierIngredients([]);
  }

  function selectModifierOption(option: ModifierOptionDTO) {
    setSelectedModifierOption(option);
    setModifierIngredients([]);
  }

  const filteredMenus = useMemo(() => {
    if (!search.trim()) return menus;
    const q = search.toLowerCase();
    return menus.filter((m) => m.name.toLowerCase().includes(q));
  }, [menus, search]);

  function openCreateItemIngredient() {
    setDrawerTab('item-ingredient');
    setEditTargetId(null);
    setForm(EMPTY_INGREDIENT_FORM);
    setFormErrors({});
    setShowDrawer(true);
    void loadInventory();
  }

  function openEditItemIngredient(ingredient: MenuItemIngredientDTO) {
    setDrawerTab('item-ingredient');
    setEditTargetId(ingredient.id);
    setForm({
      inventoryItemId: ingredient.inventoryItemId,
      quantityRequired: String(ingredient.quantityRequired),
      inputUnit: ingredient.inventoryItemUnit as InventoryUnit,
    });
    setFormErrors({});
    setShowDrawer(true);
    void loadInventory();
  }

  function openCreateModifierIngredient() {
    setDrawerTab('modifier-ingredient');
    setEditTargetId(null);
    setForm(EMPTY_INGREDIENT_FORM);
    setFormErrors({});
    setShowDrawer(true);
    void loadInventory();
  }

  function openEditModifierIngredient(ingredient: ModifierIngredientDTO) {
    setDrawerTab('modifier-ingredient');
    setEditTargetId(ingredient.id);
    setForm({
      inventoryItemId: ingredient.inventoryItemId,
      quantityRequired: String(ingredient.quantityRequired),
      inputUnit: ingredient.inventoryItemUnit as InventoryUnit,
    });
    setFormErrors({});
    setShowDrawer(true);
    void loadInventory();
  }

  function closeDrawer() {
    setShowDrawer(false);
    setEditTargetId(null);
  }

  function validateForm(): boolean {
    const errors: Partial<Record<string, string>> = {};
    if (!form.inventoryItemId) errors.inventoryItemId = t('common.required');
    const qty = Number(form.quantityRequired);
    if (!form.quantityRequired || isNaN(qty) || qty < 0) errors.quantityRequired = t('common.required');
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSave() {
    if (!validateForm()) return;
    setSaving(true);
    try {
      const inv = inventoryMap.get(form.inventoryItemId);
      const baseUnit = inv ? (inv.unit as InventoryUnit) : form.inputUnit;
      const rawQty = Number(form.quantityRequired);
      const baseQuantity = isNaN(rawQty) ? 0 : convertUnit(rawQty, form.inputUnit, baseUnit);

      if (editTargetId) {
        if (drawerTab === 'item-ingredient') {
          await updateMenuItemIngredient(editTargetId, {
            inventoryItemId: form.inventoryItemId,
            quantityRequired: baseQuantity,
          });
          await loadMenuItemIngredients();
        } else {
          await updateModifierIngredient(editTargetId, {
            inventoryItemId: form.inventoryItemId,
            quantityRequired: baseQuantity,
          });
          await loadModifierIngredients();
        }
      } else {
        if (drawerTab === 'item-ingredient') {
          const input: CreateMenuItemIngredientInput = {
            menuItemId: selectedMenuItem!.id,
            inventoryItemId: form.inventoryItemId,
            quantityRequired: baseQuantity,
          };
          await createMenuItemIngredient(input);
          await loadMenuItemIngredients();
        } else {
          const input: CreateModifierIngredientInput = {
            modifierOptionId: selectedModifierOption!.id,
            inventoryItemId: form.inventoryItemId,
            quantityRequired: baseQuantity,
          };
          await createModifierIngredient(input);
          await loadModifierIngredients();
        }
      }
      closeDrawer();
    } catch (e) {
      setError(getApiErrorMessage(e, t('recipeMapper.saveError')));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteTargetId) return;
    setDeleting(true);
    try {
      if (drawerTab === 'item-ingredient') {
        await deleteMenuItemIngredient(deleteTargetId);
        await loadMenuItemIngredients();
      } else {
        await deleteModifierIngredient(deleteTargetId);
        await loadModifierIngredients();
      }
      setDeleteTargetId(null);
    } catch (e) {
      setError(getApiErrorMessage(e, t('recipeMapper.saveError')));
    } finally {
      setDeleting(false);
    }
  }

  const inventoryMap = useMemo(() => {
    const map = new Map<string, InventoryItemDTO>();
    for (const item of allInventory) map.set(item.id, item);
    return map;
  }, [allInventory]);

  const displayUnits = useMemo(() => {
    if (!form.inventoryItemId) return null;
    const inv = inventoryMap.get(form.inventoryItemId);
    if (!inv) return null;
    const group = CONVERSION_GROUPS[inv.unit];
    return group ? [group.base, group.sub] : [inv.unit as InventoryUnit];
  }, [form.inventoryItemId, inventoryMap]);

  if (!rid) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-400" dir={dir}>
        <p>{t('common.noRestaurant')}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full" dir={dir}>
      {/* Header */}
      <div className="flex items-center justify-between mb-lg">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">{t('recipeMapper.title')}</h1>
          <p className="text-sm text-slate-500">{t('recipeMapper.subtitle')}</p>
        </div>
        <button
          onClick={() => void loadMenus()}
          className="p-2 text-slate-400 hover:text-slate-600 transition-colors"
          title={t('common.refresh') ?? 'Refresh'}
        >
          <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 mb-lg bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
          <button onClick={() => setError(null)} className="ml-auto"><X className="w-4 h-4" /></button>
        </div>
      )}

      <div className="flex gap-lg flex-1 min-h-0">
        {/* Left Panel - Menu Tree */}
        <div className="w-80 shrink-0 bg-white border border-border-muted rounded-xl flex flex-col overflow-hidden">
          <div className="p-3 border-b border-border-muted">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t('recipeMapper.searchMenus')}
                className="w-full pl-9 pr-3 py-2 text-sm border border-border-muted rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ac2d00]/20 focus:border-[#ac2d00]"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-2">
            {loading && menus.length === 0 ? (
              <div className="flex items-center justify-center h-32 text-sm text-slate-400">
                {t('common.loading')}
              </div>
            ) : filteredMenus.length === 0 ? (
              <div className="flex items-center justify-center h-32 text-sm text-slate-400">
                {t('recipeMapper.noMenus')}
              </div>
            ) : (
              <div className="space-y-1">
                {filteredMenus.map((menu) => (
                  <div key={menu.id}>
                    <button
                      onClick={() => void toggleMenu(menu.id)}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 rounded-lg transition-colors"
                    >
                      {expandedMenus.has(menu.id) ? (
                        <ChevronDown className="w-4 h-4 text-slate-400" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-slate-400" />
                      )}
                      {menu.name}
                    </button>
                    {expandedMenus.has(menu.id) && (menuItemsByMenu[menu.id] ?? []).length > 0 && (
                      <div className="ml-4 space-y-0.5">
                        {(menuItemsByMenu[menu.id] ?? []).map((item) => (
                          <button
                            key={item.id}
                            onClick={() => selectMenuItem(item)}
                            className={`w-full text-left px-3 py-1.5 text-sm rounded-lg transition-colors ${
                              selectedMenuItem?.id === item.id
                                ? 'bg-[#ac2d00]/10 text-[#ac2d00] font-semibold'
                                : 'text-slate-600 hover:bg-slate-50'
                            }`}
                          >
                            {item.name}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Panel - Content */}
        <div className="flex-1 bg-white border border-border-muted rounded-xl flex flex-col overflow-hidden">
          {!selectedMenuItem ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-400">
              <FlaskConical className="w-12 h-12 mb-3" />
              <p className="text-sm">{t('recipeMapper.selectMenuItem')}</p>
            </div>
          ) : (
            <>
              {/* Tab bar */}
              <div className="flex items-center justify-between px-lg pt-lg pb-3 border-b border-border-muted">
                <h2 className="text-lg font-bold text-slate-800">{selectedMenuItem.name}</h2>
                <div className="flex gap-1">
                  <button
                    onClick={() => { setTab('recipe'); setSelectedModifierOption(null); }}
                    className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${
                      tab === 'recipe'
                        ? 'bg-[#ac2d00] text-white'
                        : 'text-slate-500 hover:bg-slate-100'
                    }`}
                  >
                    {t('recipeMapper.recipe')}
                  </button>
                  <button
                    onClick={() => setTab('modifiers')}
                    className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${
                      tab === 'modifiers'
                        ? 'bg-[#ac2d00] text-white'
                        : 'text-slate-500 hover:bg-slate-100'
                    }`}
                  >
                    {t('recipeMapper.modifiers')}
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-lg">
                {tab === 'recipe' ? (
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-semibold text-slate-600 uppercase tracking-wide">
                        {t('recipeMapper.ingredients')}
                      </h3>
                      <button
                        onClick={openCreateItemIngredient}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold bg-[#ac2d00] text-white rounded-lg hover:bg-[#8a2400] transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                        {t('recipeMapper.addIngredient')}
                      </button>
                    </div>
                    {menuItemIngredients.length === 0 ? (
                      <p className="text-sm text-slate-400 py-8 text-center">
                        {t('recipeMapper.noIngredients')}
                      </p>
                    ) : (
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-border-muted text-left text-slate-500">
                            <th className="pb-2 font-semibold">{t('recipeMapper.inventoryItem')}</th>
                            <th className="pb-2 font-semibold">{t('recipeMapper.quantity')}</th>
                            <th className="pb-2 font-semibold w-24">{t('common.actions')}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {menuItemIngredients.map((ing) => (
                            <tr key={ing.id} className="border-b border-border-muted/50">
                              <td className="py-2.5 text-slate-700">{ing.inventoryItemName}</td>
                              <td className="py-2.5 text-slate-700">
                                {(() => {
                                  const { value, unit } = getDisplayUnit(ing.quantityRequired, ing.inventoryItemUnit);
                                  return `${formatNumber(value)} ${unit}`;
                                })()}
                              </td>
                              <td className="py-2.5">
                                <div className="flex gap-1">
                                  <button
                                    onClick={() => openEditItemIngredient(ing)}
                                    className="p-1.5 text-slate-400 hover:text-slate-600 transition-colors"
                                  >
                                    <Pencil className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => {
                                      setDrawerTab('item-ingredient');
                                      setDeleteTargetId(ing.id);
                                    }}
                                    className="p-1.5 text-slate-400 hover:text-rose-600 transition-colors"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                ) : (
                  <div>
                    <div className="space-y-4">
                      {(selectedMenuItem.modifierGroups ?? []).length === 0 ? (
                        <p className="text-sm text-slate-400 py-8 text-center">
                          {t('recipeMapper.noModifiers')}
                        </p>
                      ) : (
                        (selectedMenuItem.modifierGroups ?? []).map((group) => (
                          <div key={group.id}>
                            <h4 className="text-sm font-bold text-slate-700 mb-2">{group.name}</h4>
                            <div className="space-y-1">
                              {group.options.map((option) => (
                                <div
                                  key={option.id}
                                  className={`rounded-lg border transition-colors ${
                                    selectedModifierOption?.id === option.id
                                      ? 'border-[#ac2d00] bg-[#ac2d00]/5'
                                      : 'border-border-muted hover:border-slate-300'
                                  }`}
                                >
                                  <button
                                    onClick={() => selectModifierOption(option)}
                                    className="w-full flex items-center justify-between px-4 py-2.5 text-sm"
                                  >
                                    <span className="font-semibold text-slate-700">{option.name}</span>
                                    <ChevronRight className={`w-4 h-4 text-slate-400 transition-transform ${
                                      selectedModifierOption?.id === option.id ? 'rotate-90' : ''
                                    }`} />
                                  </button>
                                  {selectedModifierOption?.id === option.id && (
                                    <div className="px-4 pb-4 pt-2 border-t border-border-muted/50">
                                      <div className="flex items-center justify-between mb-2">
                                        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                                          {t('recipeMapper.ingredients')}
                                        </span>
                                        <button
                                          onClick={openCreateModifierIngredient}
                                          className="flex items-center gap-1 text-xs font-semibold text-[#ac2d00] hover:text-[#8a2400] transition-colors"
                                        >
                                          <Plus className="w-3.5 h-3.5" />
                                          {t('recipeMapper.addIngredient')}
                                        </button>
                                      </div>
                                      {modifierIngredients.length === 0 ? (
                                        <p className="text-xs text-slate-400 text-center py-4">
                                          {t('recipeMapper.noModifierIngredients')}
                                        </p>
                                      ) : (
                                        <table className="w-full text-xs">
                                          <thead>
                                            <tr className="border-b border-border-muted text-left text-slate-500">
                                              <th className="pb-1.5 font-semibold">{t('recipeMapper.inventoryItem')}</th>
                                              <th className="pb-1.5 font-semibold">{t('recipeMapper.quantity')}</th>
                                              <th className="pb-1.5 font-semibold w-20">{t('common.actions')}</th>
                                            </tr>
                                          </thead>
                                          <tbody>
                                            {modifierIngredients.map((ing) => (
                                              <tr key={ing.id} className="border-b border-border-muted/30">
                                                <td className="py-2 text-slate-700">{ing.inventoryItemName}</td>
                                                <td className="py-2 text-slate-700">
                                                  {(() => {
                                                    const { value, unit } = getDisplayUnit(ing.quantityRequired, ing.inventoryItemUnit);
                                                    return `${formatNumber(value)} ${unit}`;
                                                  })()}
                                                </td>
                                                <td className="py-2">
                                                  <div className="flex gap-0.5">
                                                    <button
                                                      onClick={() => openEditModifierIngredient(ing)}
                                                      className="p-1 text-slate-400 hover:text-slate-600 transition-colors"
                                                    >
                                                      <Pencil className="w-3.5 h-3.5" />
                                                    </button>
                                                    <button
                                                      onClick={() => {
                                                        setDrawerTab('modifier-ingredient');
                                                        setDeleteTargetId(ing.id);
                                                      }}
                                                      className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                                                    >
                                                      <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                  </div>
                                                </td>
                                              </tr>
                                            ))}
                                          </tbody>
                                        </table>
                                      )}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Drawer */}
      {showDrawer && (
        <>
          <div className="fixed inset-0 bg-black/50 backdrop-blur-md z-[110]" onClick={closeDrawer} />
          <div className="fixed right-0 top-0 h-full w-full max-w-lg bg-white dark:bg-slate-900 shadow-2xl z-[120] flex flex-col">
            <div className="p-8 pb-6 border-b border-gray-200 dark:border-slate-700 flex justify-between items-center bg-white dark:bg-slate-900">
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                  {editTargetId ? t('recipeMapper.editIngredient') : t('recipeMapper.addIngredient')}
                </h3>
              </div>
              <button onClick={closeDrawer} className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-slate-300">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-8 space-y-8">
              <div>
                <label className="block text-sm font-bold text-gray-900 dark:text-white mb-1">
                  {t('recipeMapper.inventoryItem')}
                </label>
                <select
                  value={form.inventoryItemId}
                  onChange={(e) => {
                    const id = e.target.value;
                    const inv = inventoryMap.get(id);
                    setForm((prev) => ({
                      ...prev,
                      inventoryItemId: id,
                      inputUnit: inv ? (inv.unit as InventoryUnit) : 'KG',
                    }));
                  }}
                  className={`w-full bg-white border border-gray-300 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ac2d00]/20 focus:border-[#ac2d00] px-3 py-2.5 text-sm ${
                    formErrors.inventoryItemId ? 'border-red-400' : ''
                  }`}
                >
                  <option value="">{t('recipeMapper.selectInventoryItem')}</option>
                  {allInventory.map((inv) => (
                    <option key={inv.id} value={inv.id}>
                      {inv.name} ({inv.unit})
                    </option>
                  ))}
                </select>
                {formErrors.inventoryItemId && (
                  <p className="mt-1 text-xs text-rose-500">{formErrors.inventoryItemId}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-900 dark:text-white mb-1">
                  {t('recipeMapper.quantity')}
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.quantityRequired}
                    onChange={(e) => setForm((prev) => ({ ...prev, quantityRequired: e.target.value }))}
                    className={`flex-1 bg-white border border-gray-300 text-gray-900 placeholder-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ac2d00]/20 focus:border-[#ac2d00] px-3 py-2.5 text-sm ${
                      formErrors.quantityRequired ? 'border-red-400' : ''
                    }`}
                  />
                  {displayUnits && displayUnits.length > 1 ? (
                    <select
                      value={form.inputUnit}
                      onChange={(e) => {
                        const newUnit = e.target.value as InventoryUnit;
                        setForm((prev) => {
                          const oldQty = Number(prev.quantityRequired);
                          if (!isNaN(oldQty) && oldQty > 0) {
                            const converted = convertUnit(oldQty, prev.inputUnit, newUnit);
                            return {
                              ...prev,
                              inputUnit: newUnit,
                              quantityRequired: String(Math.round(converted * 100) / 100),
                            };
                          }
                          return { ...prev, inputUnit: newUnit };
                        });
                      }}
                      className="w-24 bg-white border border-gray-300 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ac2d00]/20 focus:border-[#ac2d00] px-3 py-2.5 text-sm"
                    >
                      {displayUnits.map((u) => (
                        <option key={u} value={u}>
                          {t(`inventory.unit.${u}`)}
                        </option>
                      ))}
                    </select>
                  ) : displayUnits && displayUnits.length === 1 ? (
                    <div className="flex items-center px-3 py-2.5 text-sm text-gray-500 bg-gray-50 border border-gray-200 rounded-lg w-24">
                      {t(`inventory.unit.${displayUnits[0]}`)}
                    </div>
                  ) : (
                    <div className="flex items-center px-3 py-2.5 text-sm text-gray-300 bg-gray-50 border border-gray-200 rounded-lg w-24">
                      -
                    </div>
                  )}
                </div>
                {formErrors.quantityRequired && (
                  <p className="mt-1 text-xs text-rose-500">{formErrors.quantityRequired}</p>
                )}
              </div>
            </div>
            <div className="p-8 pt-6 bg-gray-50 dark:bg-slate-900 border-t border-gray-200 dark:border-slate-700 flex gap-4 justify-end">
              <button
                onClick={closeDrawer}
                className="px-6 py-3 text-sm font-bold text-gray-700 dark:text-white bg-gray-100 dark:bg-slate-800 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors"
              >
                {t('common.cancel')}
              </button>
              <button
                disabled={saving}
                onClick={() => void handleSave()}
                className="px-6 py-3 text-sm font-bold text-white bg-[#ac2d00] rounded-lg hover:bg-[#8a2400] transition-colors disabled:opacity-50"
              >
                {saving ? t('common.saving') : editTargetId ? t('common.update') : t('common.create')}
              </button>
            </div>
          </div>
        </>
      )}

      {/* Delete Confirm */}
      {deleteTargetId && (
        <>
          <div className="fixed inset-0 bg-black/50 backdrop-blur-md z-[110]" onClick={() => setDeleteTargetId(null)} />
          <div className="fixed inset-0 flex items-center justify-center z-[120]">
            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl p-8 max-w-sm w-full mx-4">
              <h3 className="text-lg font-bold text-gray-900 mb-2">{t('common.confirmDelete')}</h3>
              <p className="text-sm text-gray-500 mb-6">{t('recipeMapper.deleteConfirm')}</p>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setDeleteTargetId(null)}
                  className="px-4 py-2 text-sm font-semibold text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  {t('common.cancel')}
                </button>
                <button
                  disabled={deleting}
                  onClick={() => void handleDelete()}
                  className="px-4 py-2 text-sm font-semibold text-white bg-rose-600 rounded-lg hover:bg-rose-700 transition-colors disabled:opacity-50"
                >
                  {deleting ? t('common.deleting') : t('common.delete')}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
