'use client';

import type { Dispatch, SetStateAction } from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Check, Minus, Plus, X } from 'lucide-react';
import type {
  CartItemDTO,
  MenuDTO,
  MenuItemDTO,
  ModifierGroupDTO,
  ModifierOptionDTO,
} from '@repo/shared-types';
import { useAuthStore } from '@/auth/store';
import { formatMoney } from '@/lib/format';
import {
  localizeMenuItemName,
  localizeMenuName,
  localizeModifierGroupName,
  localizeModifierOptionName,
  posT,
  replaceTemplate,
} from '@/lib/i18n';
import { randomId } from '@/lib/random-id';
import { listMenuItems, listMenus } from '@/services/menu.service';
import { usePosUiStore } from '@/store/pos-ui.store';

type PosMenuFlowProps = {
  title: string;
  subtitle: string;
  submitLabel: string;
  onSubmit: (items: CartItemDTO[]) => Promise<void> | void;
  onCancel: () => void;
  initialItems?: CartItemDTO[];
  variant?: 'default' | 'waiter';
};

type Step = 'menus' | 'items';

type DraftLine = CartItemDTO & {
  cartLineId: string;
};

type CustomizerState = {
  item: MenuItemDTO;
  cartLineId: string | null;
  quantity: number;
  notes: string;
  selectedOptionIds: string[];
};

function normalizeIds(ids?: string[]) {
  return [...new Set((ids ?? []).filter(Boolean))].sort();
}

function buildLineKey(item: Pick<CartItemDTO, 'menuItemId' | 'notes' | 'modifierOptionIds'>) {
  return JSON.stringify({
    menuItemId: item.menuItemId,
    notes: item.notes?.trim() ?? '',
    modifierOptionIds: normalizeIds(item.modifierOptionIds),
  });
}

function defaultSelectionForItem(item: MenuItemDTO) {
  return (item.modifierGroups ?? []).flatMap((group) =>
    group.options.filter((option) => option.isDefault).map((option) => option.id),
  );
}

function selectedOptionsByGroup(group: ModifierGroupDTO, selectedIds: string[]) {
  const selected = new Set(selectedIds);
  return group.options.filter((option) => selected.has(option.id));
}

function findSelectedOptions(item: MenuItemDTO, selectedOptionIds: string[]) {
  const selected = new Set(selectedOptionIds);
  return (item.modifierGroups ?? []).flatMap((group) =>
    group.options.filter((option) => selected.has(option.id)),
  );
}

function localizeItemDescription(item: MenuItemDTO, language: ReturnType<typeof usePosUiStore.getState>['language']) {
  if (language === 'ar') {
    return item.descriptionAr ?? item.description ?? '';
  }

  if (language === 'fr') {
    return item.descriptionFr ?? item.descriptionEn ?? item.description ?? '';
  }

  return item.descriptionEn ?? item.description ?? '';
}

function localizeItemBadge(item: MenuItemDTO, language: ReturnType<typeof usePosUiStore.getState>['language']) {
  if (language === 'ar') {
    return item.badgeAr ?? item.badge ?? null;
  }

  if (language === 'fr') {
    return item.badgeFr ?? item.badgeEn ?? item.badge ?? null;
  }

  return item.badgeEn ?? item.badge ?? null;
}

function toggleGroupOption(
  group: ModifierGroupDTO,
  option: ModifierOptionDTO,
  setState: Dispatch<SetStateAction<CustomizerState | null>>,
) {
  setState((current) => {
    if (!current) {
      return current;
    }

    const selected = new Set(current.selectedOptionIds);
    const groupSelected = selectedOptionsByGroup(group, [...selected]);
    const isActive = selected.has(option.id);

    if (isActive) {
      selected.delete(option.id);
    } else {
      if (group.maxSelections === 1) {
        for (const selectedOption of groupSelected) {
          selected.delete(selectedOption.id);
        }
      } else if (groupSelected.length >= group.maxSelections) {
        return current;
      }

      selected.add(option.id);
    }

    return {
      ...current,
      selectedOptionIds: [...selected],
    };
  });
}

export function PosMenuFlow({
  title,
  subtitle,
  submitLabel,
  onSubmit,
  onCancel,
  initialItems = [],
  variant = 'default',
}: PosMenuFlowProps) {
  const restaurantId = useAuthStore((state) => state.session?.user.restaurantId);
  const language = usePosUiStore((state) => state.language);
  const t = posT(language);
  const [step, setStep] = useState<Step>('menus');
  const [menus, setMenus] = useState<MenuDTO[]>([]);
  const [selectedMenu, setSelectedMenu] = useState<MenuDTO | null>(null);
  const [menuItems, setMenuItems] = useState<MenuItemDTO[]>([]);
  const [allItems, setAllItems] = useState<MenuItemDTO[]>([]);
  const [lines, setLines] = useState<DraftLine[]>(() =>
    initialItems.map((item) => ({
      ...item,
      cartLineId: item.cartLineId ?? randomId(),
      modifierOptionIds: normalizeIds(item.modifierOptionIds),
    })),
  );
  const [customizing, setCustomizing] = useState<CustomizerState | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validateCustomization = useCallback(
    (item: MenuItemDTO, selectedOptionIds: string[]) => {
      for (const group of item.modifierGroups ?? []) {
        const selected = selectedOptionsByGroup(group, selectedOptionIds);
        const groupName = localizeModifierGroupName(group, language);

        if (group.required && selected.length === 0) {
          return replaceTemplate(t.chooseAtLeastOne, { group: groupName });
        }

        if (selected.length < group.minSelections) {
          return replaceTemplate(t.chooseAtLeastMany, {
            count: group.minSelections,
            group: groupName,
          });
        }

        if (selected.length > group.maxSelections) {
          return replaceTemplate(t.chooseUpTo, {
            count: group.maxSelections,
            group: groupName,
          });
        }
      }

      return null;
    },
    [language, t],
  );

  useEffect(() => {
    if (!restaurantId) {
      return;
    }

    void listMenuItems(restaurantId)
      .then(setAllItems)
      .catch(() => undefined);
  }, [restaurantId]);

  useEffect(() => {
    let active = true;

    async function loadMenus() {
      if (!restaurantId) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const nextMenus = await listMenus(restaurantId);
        if (active) {
          setMenus(nextMenus);
          setError(null);
        }
      } catch {
        if (active) {
          setError(t.couldNotLoadMenus);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadMenus();
    return () => {
      active = false;
    };
  }, [restaurantId, t.couldNotLoadMenus]);

  const selectMenu = useCallback(
    async (menu: MenuDTO) => {
      setSelectedMenu(menu);
      setStep('items');
      setLoading(true);
      setError(null);

      try {
        if (!restaurantId) {
          throw new Error('Missing restaurant session');
        }

        const items = await listMenuItems(restaurantId, menu.id);
        setMenuItems(items);
      } catch {
        setError(t.couldNotLoadMenuItems);
        setMenuItems([]);
      } finally {
        setLoading(false);
      }
    },
    [restaurantId, t.couldNotLoadMenuItems],
  );

  const itemById = useMemo(
    () => Object.fromEntries(allItems.map((item) => [item.id, item])),
    [allItems],
  );

  const cartLines = useMemo(() => {
    return lines.flatMap((line) => {
      const item = itemById[line.menuItemId];
      if (!item) {
        return [];
      }

      const selectedOptions = findSelectedOptions(item, line.modifierOptionIds ?? []);
      const unitPrice = item.price + selectedOptions.reduce((sum, option) => sum + option.priceDelta, 0);
      return [
        {
          ...line,
          item,
          selectedOptions,
          unitPrice,
          lineTotal: unitPrice * line.quantity,
        },
      ];
    });
  }, [itemById, lines]);

  const cartTotal = cartLines.reduce((sum, line) => sum + line.lineTotal, 0);
  const cartCount = cartLines.reduce((sum, line) => sum + line.quantity, 0);

  function openItem(item: MenuItemDTO) {
    if (!item.modifierGroups?.length) {
      const nextLine: DraftLine = {
        cartLineId: randomId(),
        menuItemId: item.id,
        quantity: 1,
        modifierOptionIds: [],
      };
      const signature = buildLineKey(nextLine);
      setLines((current) => {
        const existing = current.find((line) => buildLineKey(line) === signature);
        if (!existing) {
          return [...current, nextLine];
        }
        return current.map((line) =>
          line.cartLineId === existing.cartLineId ? { ...line, quantity: line.quantity + 1 } : line,
        );
      });
      return;
    }

    setCustomizing({
      item,
      cartLineId: null,
      quantity: 1,
      notes: '',
      selectedOptionIds: defaultSelectionForItem(item),
    });
    setError(null);
  }

  function editLine(lineId: string) {
    const line = lines.find((entry) => entry.cartLineId === lineId);
    if (!line) {
      return;
    }

    const item = itemById[line.menuItemId];
    if (!item) {
      return;
    }

    setCustomizing({
      item,
      cartLineId: line.cartLineId,
      quantity: line.quantity,
      notes: line.notes ?? '',
      selectedOptionIds: normalizeIds(line.modifierOptionIds),
    });
    setError(null);
  }

  function saveCustomization() {
    if (!customizing) {
      return;
    }

    const validation = validateCustomization(customizing.item, customizing.selectedOptionIds);
    if (validation) {
      setError(validation);
      return;
    }

    const nextLine: DraftLine = {
      cartLineId: customizing.cartLineId ?? randomId(),
      menuItemId: customizing.item.id,
      quantity: customizing.quantity,
      ...(customizing.notes.trim() ? { notes: customizing.notes.trim() } : {}),
      modifierOptionIds: normalizeIds(customizing.selectedOptionIds),
    };

    setLines((current) => {
      if (customizing.cartLineId) {
        return current.map((line) =>
          line.cartLineId === customizing.cartLineId ? nextLine : line,
        );
      }

      const signature = buildLineKey(nextLine);
      const existing = current.find((line) => buildLineKey(line) === signature);
      if (!existing) {
        return [...current, nextLine];
      }

      return current.map((line) =>
        line.cartLineId === existing.cartLineId
          ? { ...line, quantity: line.quantity + nextLine.quantity }
          : line,
      );
    });

    setCustomizing(null);
    setError(null);
  }

  function updateLineQuantity(lineId: string, delta: number) {
    setLines((current) =>
      current
        .map((line) =>
          line.cartLineId === lineId ? { ...line, quantity: line.quantity + delta } : line,
        )
        .filter((line) => line.quantity > 0),
    );
  }

  function removeLine(lineId: string) {
    setLines((current) => current.filter((line) => line.cartLineId !== lineId));
  }

  async function handleSubmit() {
    if (!lines.length) {
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      await onSubmit(
        lines.map((line) => ({
          cartLineId: line.cartLineId,
          menuItemId: line.menuItemId,
          quantity: line.quantity,
          ...(line.notes ? { notes: line.notes } : {}),
          ...(line.modifierOptionIds?.length ? { modifierOptionIds: line.modifierOptionIds } : {}),
        })),
      );
    } catch {
      setError(t.couldNotSubmitOrder);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between rounded-[28px] border border-white/70 bg-white/80 p-5">
        <div>
          <button
            type="button"
            onClick={onCancel}
            className="mb-3 inline-flex items-center gap-2 text-sm font-semibold text-[#a73308]"
          >
            <ArrowLeft size={16} />
            {t.back}
          </button>
          <h2 className="text-2xl font-bold">{title}</h2>
          <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
        </div>
        {cartCount > 0 ? (
          <span className="rounded-full bg-[#a73308] px-4 py-2 text-sm font-bold text-white">
            {cartCount} {t.items}
          </span>
        ) : null}
      </div>

      {error ? (
        <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
      ) : null}

      {step === 'menus' ? (
        <section>
          <h3 className="mb-4 text-lg font-bold">{t.chooseMenu}</h3>
          {loading ? (
            <p className="text-slate-500">{t.loading}</p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {menus.map((menu) => (
                <button
                  key={menu.id}
                  type="button"
                  onClick={() => void selectMenu(menu)}
                  className={[
                    'rounded-[24px] border p-6 text-left shadow-sm transition hover:shadow-md',
                    variant === 'waiter'
                      ? 'border-[#ead7c8] bg-[linear-gradient(135deg,#fff7f1,#ffffff)] hover:border-[#cf6d43]'
                      : 'border-slate-200 bg-white hover:border-[#cf6d43]',
                  ].join(' ')}
                >
                  <h4 className="text-xl font-bold text-slate-900">
                    {localizeMenuName(menu, language)}
                  </h4>
                  {menu.description ? (
                    <p className="mt-2 text-sm text-slate-500">{menu.description}</p>
                  ) : null}
                </button>
              ))}
            </div>
          )}
        </section>
      ) : (
        <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <div>
            <button
              type="button"
              onClick={() => setStep('menus')}
              className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-[#a73308]"
            >
              <ArrowLeft size={16} />
              {selectedMenu ? localizeMenuName(selectedMenu, language) : t.menus}
            </button>

            <div className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-3">
              {loading ? (
                <p className="text-slate-500">{t.loading}</p>
              ) : (
                menuItems.map((item) => (
                  <article
                    key={item.id}
                    className={[
                      'group overflow-hidden rounded-[30px] border',
                      variant === 'waiter'
                        ? 'border-[#ead7c8] bg-white shadow-[0_18px_45px_rgba(116,58,28,0.08)] transition hover:-translate-y-1 hover:border-[#cf835f]'
                        : 'border-slate-200 bg-white transition hover:border-[#cf6d43] hover:shadow-md',
                    ].join(' ')}
                  >
                    <div className="relative h-56 bg-[linear-gradient(135deg,#41251b,#8d2d0e)] sm:h-64">
                      {item.image ? (
                        <img
                          src={item.image}
                          alt={localizeMenuItemName(item, language)}
                          className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
                        />
                      ) : (
                        <div className="flex h-full items-end p-5">
                          <div className="rounded-full bg-white/15 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-white backdrop-blur">
                            {t.menus}
                          </div>
                        </div>
                      )}
                      <div className="absolute right-4 top-4 rounded-full bg-black/55 px-4 py-1.5 text-sm font-black text-white backdrop-blur">
                        {formatMoney(item.price)}
                      </div>
                      {item.featured || localizeItemBadge(item, language) ? (
                        <div className="absolute left-4 top-4 rounded-full bg-[#fff7d6] px-3 py-1.5 text-xs font-bold text-[#7a5600] shadow-sm">
                          {localizeItemBadge(item, language) ?? t.customize}
                        </div>
                      ) : null}
                      <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/45 to-transparent" />
                    </div>

                    <div className="flex items-start justify-between gap-4 p-5 sm:p-6">
                      <div className="min-w-0">
                        <h4 className="text-xl font-bold text-slate-950 sm:text-2xl">
                          {localizeMenuItemName(item, language)}
                        </h4>
                        {localizeItemDescription(item, language) ? (
                          <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-500 sm:text-[15px]">
                            {localizeItemDescription(item, language)}
                          </p>
                        ) : null}
                        <div className="mt-4 flex flex-wrap gap-2">
                          {!!item.modifierGroups?.length ? (
                            <span className="rounded-full bg-[#f3f5f8] px-3 py-1.5 text-xs font-semibold text-slate-600">
                              {t.customize}
                            </span>
                          ) : null}
                          {localizeItemBadge(item, language) ? (
                            <span className="rounded-full bg-[#fff0e8] px-3 py-1.5 text-xs font-semibold text-[#8d3c19]">
                              {localizeItemBadge(item, language)}
                            </span>
                          ) : null}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => openItem(item)}
                        className="shrink-0 rounded-2xl bg-[#a73308] px-4 py-3 text-sm font-bold text-white shadow-[0_12px_24px_rgba(167,51,8,0.22)] transition hover:bg-[#8f2b07] sm:min-w-[92px]"
                      >
                        {item.modifierGroups?.length ? t.customize : t.add}
                      </button>
                    </div>
                  </article>
                ))
              )}
            </div>
          </div>

          <aside className="rounded-[28px] border border-white/70 bg-white/80 p-6">
            <h3 className="text-lg font-bold">{t.currentTicket}</h3>
            <div className="mt-4 space-y-3">
              {cartLines.length === 0 ? (
                <p className="text-sm text-slate-500">{t.addItemsFromMenu}</p>
              ) : (
                cartLines.map((line) => (
                  <div
                    key={line.cartLineId}
                    className="rounded-2xl border border-slate-200 bg-slate-50 p-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <button
                          type="button"
                          onClick={() => editLine(line.cartLineId)}
                          className="text-left font-bold text-slate-900 hover:text-[#a73308]"
                        >
                          {line.quantity}x {localizeMenuItemName(line.item, language)}
                        </button>
                        {!!line.selectedOptions.length ? (
                          <p className="mt-1 text-xs text-slate-500">
                            {line.selectedOptions
                              .map((option) => localizeModifierOptionName(option, language))
                              .join(' | ')}
                          </p>
                        ) : null}
                        {line.notes ? (
                          <p className="mt-1 text-xs text-slate-500">{line.notes}</p>
                        ) : null}
                      </div>
                      <button
                        type="button"
                        onClick={() => removeLine(line.cartLineId)}
                        className="rounded-lg bg-white p-2 text-slate-500"
                      >
                        <X size={14} />
                      </button>
                    </div>

                    <div className="mt-3 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          className="rounded-lg bg-white p-2"
                          onClick={() => updateLineQuantity(line.cartLineId, -1)}
                        >
                          <Minus size={14} />
                        </button>
                        <span className="w-6 text-center font-bold">{line.quantity}</span>
                        <button
                          type="button"
                          className="rounded-lg bg-[#a73308] p-2 text-white"
                          onClick={() => updateLineQuantity(line.cartLineId, 1)}
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                      <span className="font-bold">{formatMoney(line.lineTotal)}</span>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="mt-4 flex justify-between border-t border-dashed border-slate-200 pt-4 text-lg font-bold">
              <span>{t.total}</span>
              <span className="text-[#a73308]">{formatMoney(cartTotal)}</span>
            </div>

            <button
              type="button"
              disabled={submitting || cartLines.length === 0}
              onClick={() => void handleSubmit()}
              className="mt-6 h-14 w-full rounded-2xl bg-[#18222f] text-lg font-bold text-white disabled:opacity-50"
            >
              {submitting ? t.submitting : submitLabel}
            </button>
          </aside>
        </section>
      )}

      {customizing ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/35 p-4 backdrop-blur-sm">
          <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-[30px] bg-white p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">
                  {t.customize}
                </p>
                <h3 className="mt-1 text-2xl font-bold">
                  {localizeMenuItemName(customizing.item, language)}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setCustomizing(null)}
                className="rounded-full border border-slate-200 p-2 text-slate-500"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              {(customizing.item.modifierGroups ?? []).map((group) => {
                const selected = selectedOptionsByGroup(group, customizing.selectedOptionIds);
                return (
                  <div key={group.id} className="rounded-2xl border border-slate-200 p-4">
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <div>
                        <h4 className="font-bold">{localizeModifierGroupName(group, language)}</h4>
                        <p className="mt-1 text-xs text-slate-500">
                          {group.required ? t.required : t.optional} -{' '}
                          {replaceTemplate(t.upToCount, { count: group.maxSelections })}
                        </p>
                      </div>
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
                        {selected.length}/{group.maxSelections}
                      </span>
                    </div>

                    <div className="space-y-2">
                      {group.options.map((option) => {
                        const active = customizing.selectedOptionIds.includes(option.id);
                        return (
                          <button
                            key={option.id}
                            type="button"
                            onClick={() => toggleGroupOption(group, option, setCustomizing)}
                            className={[
                              'flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left transition',
                              active
                                ? 'border-[#cf6d43] bg-[#fff0e8] text-[#8d3c19]'
                                : 'border-slate-200 bg-white text-slate-700',
                            ].join(' ')}
                          >
                            <span>
                              <span className="block font-semibold">
                                {localizeModifierOptionName(option, language)}
                              </span>
                              {option.description ? (
                                <span className="mt-1 block text-xs opacity-80">
                                  {option.description}
                                </span>
                              ) : null}
                            </span>
                            <span className="flex items-center gap-2 font-semibold">
                              {option.priceDelta > 0
                                ? `+${formatMoney(option.priceDelta)}`
                                : t.included}
                              {active ? <Check size={16} /> : null}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}

              <div className="rounded-2xl border border-slate-200 p-4">
                <p className="mb-3 font-bold">{t.kitchenNote}</p>
                <textarea
                  value={customizing.notes}
                  onChange={(event) =>
                    setCustomizing((current) =>
                      current ? { ...current, notes: event.target.value } : current,
                    )
                  }
                  placeholder={t.kitchenNotePlaceholder}
                  className="min-h-28 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none"
                />
              </div>

              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold">{t.lineTotal}</p>
                  <p className="text-xl font-bold text-[#a73308]">
                    {formatMoney(
                      (customizing.item.price +
                        findSelectedOptions(customizing.item, customizing.selectedOptionIds).reduce(
                          (sum, option) => sum + option.priceDelta,
                          0,
                        )) * customizing.quantity,
                    )}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className="rounded-lg bg-slate-100 p-2"
                    onClick={() =>
                      setCustomizing((current) =>
                        current
                          ? { ...current, quantity: Math.max(1, current.quantity - 1) }
                          : current,
                      )
                    }
                  >
                    <Minus size={14} />
                  </button>
                  <span className="w-8 text-center font-bold">{customizing.quantity}</span>
                  <button
                    type="button"
                    className="rounded-lg bg-[#a73308] p-2 text-white"
                    onClick={() =>
                      setCustomizing((current) =>
                        current ? { ...current, quantity: current.quantity + 1 } : current,
                      )
                    }
                  >
                    <Plus size={14} />
                  </button>
                </div>
              </div>

              <button
                type="button"
                onClick={saveCustomization}
                className="w-full rounded-2xl bg-[#18222f] px-5 py-4 text-sm font-bold text-white"
              >
                {customizing.cartLineId ? t.saveLine : t.addToTicket}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
