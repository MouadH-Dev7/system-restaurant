'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { MenuDTO, MenuItemDTO, ModifierOptionDTO } from '@repo/shared-types';
import { useAuthStore } from '@/auth/store';
import { KitchenShell } from '@/components/kitchen-shell';
import { useKitchenSocket } from '@/hooks/use-kitchen-socket';
import {
  kitchenT,
  localizeMenuItemName,
  localizeMenuName,
  localizeModifierGroupName,
  localizeModifierOptionName,
} from '@/lib/i18n';
import {
  listMenuItems,
  listMenus,
  updateKitchenMenuItemAvailability,
  updateKitchenModifierOptionAvailability,
} from '@/services/menu.service';
import { useAppStore } from '@/store/app.store';

export function KitchenAvailability() {
  const restaurantId = useAuthStore((state) => state.session?.user.restaurantId);
  const language = useAppStore((state) => state.language);
  const t = kitchenT(language);

  const [mounted, setMounted] = useState(false);
  const [now, setNow] = useState<Date | null>(null);
  const [menus, setMenus] = useState<MenuDTO[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItemDTO[]>([]);
  const [selectedMenuId, setSelectedMenuId] = useState<string>('all');
  const [showUnavailableAddonsOnly, setShowUnavailableAddonsOnly] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [togglingItemId, setTogglingItemId] = useState<string | null>(null);
  const [togglingOptionId, setTogglingOptionId] = useState<string | null>(null);
  const handleSocketOrderEvent = useCallback(() => undefined, []);

  const { status, lastSyncAt } = useKitchenSocket({
    restaurantId,
    onOrderEvent: handleSocketOrderEvent,
  });

  useEffect(() => {
    setMounted(true);
    setNow(new Date());
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    let active = true;

    async function loadAvailability() {
      if (!restaurantId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const [nextMenus, nextItems] = await Promise.all([
          listMenus(restaurantId),
          listMenuItems(restaurantId),
        ]);

        if (!active) {
          return;
        }

        setMenus(nextMenus);
        setMenuItems(nextItems);
      } catch {
        if (active) {
          setError(t.availabilityLoadError);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadAvailability();
    return () => {
      active = false;
    };
  }, [restaurantId, t.availabilityLoadError]);

  const visibleMenuItems = useMemo(() => {
    const filteredByMenu =
      selectedMenuId === 'all'
        ? menuItems
        : menuItems.filter((item) => item.menuId === selectedMenuId);

    if (!showUnavailableAddonsOnly) {
      return filteredByMenu;
    }

    return filteredByMenu
      .map((item) => ({
        ...item,
        modifierGroups: item.modifierGroups
          ?.map((group) => ({
            ...group,
            options: group.options.filter((option) => !option.available),
          }))
          .filter((group) => group.options.length > 0),
      }))
      .filter((item) => Boolean(item.modifierGroups?.length));
  }, [menuItems, selectedMenuId, showUnavailableAddonsOnly]);

  async function toggleMenuItem(item: MenuItemDTO) {
    try {
      setTogglingItemId(item.id);
      const updated = await updateKitchenMenuItemAvailability(item.id, !item.available);
      setMenuItems((current) =>
        current.map((entry) => (entry.id === updated.id ? updated : entry)),
      );
    } finally {
      setTogglingItemId(null);
    }
  }

  async function toggleModifierOption(itemId: string, option: ModifierOptionDTO) {
    try {
      setTogglingOptionId(option.id);
      const updated = await updateKitchenModifierOptionAvailability(option.id, !option.available);
      setMenuItems((current) =>
        current.map((item) => {
          if (item.id !== itemId || !item.modifierGroups) {
            return item;
          }

          return {
            ...item,
            modifierGroups: item.modifierGroups.map((group) => ({
              ...group,
              options: group.options.map((entry) => (entry.id === updated.id ? updated : entry)),
            })),
          };
        }),
      );
    } finally {
      setTogglingOptionId(null);
    }
  }

  return (
    <KitchenShell mounted={mounted} now={now} status={status} lastSyncAt={lastSyncAt}>
      <div className="rounded-2xl border border-outline-variant/60 bg-surface-container-high p-4 shadow-xl">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-black uppercase tracking-[0.24em] text-primary-container">
              {t.availabilityTitle}
            </h2>
            <p className="mt-1 text-sm text-on-surface-variant">{t.availabilitySubtitle}</p>
          </div>
          <div className="flex items-center gap-2">
            <select
              className="rounded-xl border border-outline-variant bg-surface px-3 py-2 text-sm text-on-surface outline-none"
              value={selectedMenuId}
              onChange={(event) => setSelectedMenuId(event.target.value)}
            >
              <option value="all">{t.allMenus}</option>
              {menus.map((menu) => (
                <option key={menu.id} value={menu.id}>
                  {localizeMenuName(menu, language)}
                </option>
              ))}
            </select>
            <label className="flex items-center gap-2 rounded-xl border border-outline-variant bg-surface px-3 py-2 text-sm text-on-surface">
              <input
                type="checkbox"
                className="h-4 w-4 accent-primary-container"
                checked={showUnavailableAddonsOnly}
                onChange={(event) => setShowUnavailableAddonsOnly(event.target.checked)}
              />
              <span>{t.unavailableAddonsOnly}</span>
            </label>
          </div>
        </div>

        {error ? (
          <div className="rounded-xl border border-error/50 bg-error/10 px-4 py-3 text-sm font-semibold text-error">
            {error}
          </div>
        ) : loading ? (
          <div className="rounded-xl border border-outline-variant bg-surface px-4 py-4 text-sm text-on-surface-variant">
            {t.loadingMenuItems}
          </div>
        ) : (
          <div className="space-y-4">
            {visibleMenuItems.map((item) => {
              const busyItem = togglingItemId === item.id;
              const menu = menus.find((entry) => entry.id === item.menuId);
              const hasModifiers = Boolean(item.modifierGroups?.length);

              return (
                <div
                  key={item.id}
                  className={`rounded-2xl border p-4 transition ${
                    item.available
                      ? 'border-emerald-500/30 bg-emerald-500/10'
                      : 'border-rose-500/30 bg-rose-500/10'
                  }`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <h3 className="text-lg font-bold text-on-surface">
                        {localizeMenuItemName(item, language)}
                      </h3>
                      <p className="mt-1 text-sm text-on-surface-variant">
                        {menu ? localizeMenuName(menu, language) : t.menuLabel}
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <span
                        className={`rounded-full px-2.5 py-1 text-[11px] font-black uppercase ${
                          item.available ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'
                        }`}
                      >
                        {item.available ? t.available : t.finished}
                      </span>
                      <button
                        type="button"
                        disabled={busyItem}
                        onClick={() => void toggleMenuItem(item)}
                        className={`rounded-xl px-3 py-2 text-sm font-black transition active-btn ${
                          item.available
                            ? 'bg-rose-500 text-white hover:brightness-110'
                            : 'bg-emerald-500 text-white hover:brightness-110'
                        } disabled:opacity-60`}
                      >
                        {busyItem ? t.updating : item.available ? t.markFinished : t.returnToMenu}
                      </button>
                    </div>
                  </div>

                  <div className="mt-5 rounded-2xl border border-outline-variant/50 bg-surface/60 p-4">
                    <div className="mb-3">
                      <h4 className="text-sm font-black uppercase tracking-[0.2em] text-secondary-container">
                        {t.modifierOptionsTitle}
                      </h4>
                      <p className="mt-1 text-sm text-on-surface-variant">
                        {t.modifierOptionsSubtitle}
                      </p>
                    </div>

                    {hasModifiers ? (
                      <div className="space-y-3">
                        {item.modifierGroups?.map((group) => (
                          <div
                            key={group.id}
                            className="rounded-xl border border-outline-variant/40 bg-background/40 p-3"
                          >
                            <div className="mb-3 flex items-center justify-between gap-3">
                              <div>
                                <h5 className="text-sm font-bold text-on-surface">
                                  {localizeModifierGroupName(group, language)}
                                </h5>
                                <p className="text-xs text-on-surface-variant">
                                  {group.required ? t.required : t.optional}
                                </p>
                              </div>
                            </div>

                            <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
                              {group.options.map((option) => {
                                const busyOption = togglingOptionId === option.id;
                                return (
                                  <div
                                    key={option.id}
                                    className={`rounded-xl border p-3 ${
                                      option.available
                                        ? 'border-emerald-500/30 bg-emerald-500/10'
                                        : 'border-rose-500/30 bg-rose-500/10'
                                    }`}
                                  >
                                    <div className="flex items-start justify-between gap-2">
                                      <div>
                                        <p className="text-sm font-bold text-on-surface">
                                          {localizeModifierOptionName(option, language)}
                                        </p>
                                        <p className="mt-1 text-xs text-on-surface-variant">
                                          {option.available ? t.available : t.finished}
                                        </p>
                                      </div>
                                    </div>

                                    <button
                                      type="button"
                                      disabled={busyOption}
                                      onClick={() => void toggleModifierOption(item.id, option)}
                                      className={`mt-3 w-full rounded-lg px-3 py-2 text-xs font-black transition active-btn ${
                                        option.available
                                          ? 'bg-rose-500 text-white hover:brightness-110'
                                          : 'bg-emerald-500 text-white hover:brightness-110'
                                      } disabled:opacity-60`}
                                    >
                                      {busyOption
                                        ? t.updating
                                        : option.available
                                          ? t.hideOption
                                          : t.returnOption}
                                    </button>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="rounded-xl border border-outline-variant bg-surface px-4 py-4 text-sm text-on-surface-variant">
                        {t.noModifierOptions}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </KitchenShell>
  );
}
