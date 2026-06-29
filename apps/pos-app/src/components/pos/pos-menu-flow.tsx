'use client';

import type { Dispatch, SetStateAction } from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import type {
  CartItemDTO,
  MenuDTO,
  MenuItemDTO,
  ModifierGroupDTO,
  ModifierOptionDTO,
} from '@repo/shared-types';
import { useAuthStore } from '@/auth/store';
import { localizeMenuName, localizeModifierGroupName, posT, replaceTemplate } from '@/lib/i18n';
import { randomId } from '@/lib/random-id';
import { listMenuItems, listMenus } from '@/services/menu.service';
import { usePosUiStore } from '@/store/pos-ui.store';
import { ProductGrid, DraftCartPanel, ModifierModal } from '@/components/pos-sections';

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
      .catch((err) => console.error('[PosMenuFlow] Failed to load menu items:', err));
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

  const handleToggleOption = useCallback((group: ModifierGroupDTO, option: ModifierOptionDTO) => {
    toggleGroupOption(group, option, setCustomizing);
  }, []);

  const handleCloseCustomizer = useCallback(() => {
    setCustomizing(null);
  }, []);

  const handleUpdateNotes = useCallback((notes: string) => {
    setCustomizing((current) => (current ? { ...current, notes } : current));
  }, []);

  const handleUpdateQuantity = useCallback((delta: number) => {
    setCustomizing((current) =>
      current ? { ...current, quantity: Math.max(1, current.quantity + delta) } : current,
    );
  }, []);

  const handleBackToMenus = useCallback(() => {
    setStep('menus');
  }, []);

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
          <ProductGrid
            loading={loading}
            menuItems={menuItems}
            selectedMenu={selectedMenu}
            language={language}
            variant={variant}
            t={t}
            onOpenItem={openItem}
            onBack={handleBackToMenus}
          />
          <DraftCartPanel
            lines={cartLines}
            cartTotal={cartTotal}
            cartCount={cartCount}
            submitting={submitting}
            submitLabel={submitLabel}
            language={language}
            t={t}
            onEditLine={editLine}
            onRemoveLine={removeLine}
            onUpdateQuantity={updateLineQuantity}
            onSubmit={() => void handleSubmit()}
          />
        </section>
      )}

      {customizing ? (
        <ModifierModal
          customizing={customizing}
          language={language}
          t={t}
          onSave={saveCustomization}
          onClose={handleCloseCustomizer}
          onToggleOption={handleToggleOption}
          onUpdateQuantity={handleUpdateQuantity}
          onUpdateNotes={handleUpdateNotes}
        />
      ) : null}
    </div>
  );
}
