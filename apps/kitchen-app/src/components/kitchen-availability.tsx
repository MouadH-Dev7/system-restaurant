'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { MenuDTO, MenuItemDTO, ModifierOptionDTO } from '@repo/shared-types';
import { useAuthStore } from '@/auth/store';
import { KitchenShell } from '@/components/kitchen-shell';
import { useKitchenSocket } from '@/hooks/use-kitchen-socket';
import { AvailabilityHeader, AvailabilityTable } from '@/components/availability-sections';
import { kitchenT } from '@/lib/i18n';
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
        <AvailabilityHeader
          t={t}
          menus={menus}
          selectedMenuId={selectedMenuId}
          showUnavailableAddonsOnly={showUnavailableAddonsOnly}
          language={language}
          onMenuChange={(menuId) => setSelectedMenuId(menuId)}
          onToggleUnavailableAddons={(checked) => setShowUnavailableAddonsOnly(checked)}
        />

        <AvailabilityTable
          t={t}
          language={language}
          visibleMenuItems={visibleMenuItems}
          menus={menus}
          togglingItemId={togglingItemId}
          togglingOptionId={togglingOptionId}
          loading={loading}
          error={error}
          onToggleItem={(item) => void toggleMenuItem(item)}
          onToggleOption={(itemId, option) => void toggleModifierOption(itemId, option)}
        />
      </div>
    </KitchenShell>
  );
}
