'use client';

import type { MenuDTO } from '@repo/shared-types';
import { localizeMenuName } from '@/lib/i18n';
import type { KitchenLanguage } from '@/store/app.store';

type AvailabilityHeaderProps = {
  t: Record<string, string>;
  menus: MenuDTO[];
  selectedMenuId: string;
  showUnavailableAddonsOnly: boolean;
  language: KitchenLanguage;
  onMenuChange: (menuId: string) => void;
  onToggleUnavailableAddons: (checked: boolean) => void;
};

export function AvailabilityHeader({
  t,
  menus,
  selectedMenuId,
  showUnavailableAddonsOnly,
  language,
  onMenuChange,
  onToggleUnavailableAddons,
}: AvailabilityHeaderProps) {
  return (
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
          onChange={(event) => onMenuChange(event.target.value)}
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
            onChange={(event) => onToggleUnavailableAddons(event.target.checked)}
          />
          <span>{t.unavailableAddonsOnly}</span>
        </label>
      </div>
    </div>
  );
}
