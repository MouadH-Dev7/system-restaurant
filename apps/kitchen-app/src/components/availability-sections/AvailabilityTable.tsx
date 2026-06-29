'use client';

import type { MenuDTO, MenuItemDTO, ModifierOptionDTO } from '@repo/shared-types';
import {
  kitchenT,
  localizeMenuItemName,
  localizeMenuName,
  localizeModifierGroupName,
  localizeModifierOptionName,
} from '@/lib/i18n';
import type { KitchenLanguage } from '@/store/app.store';

type AvailabilityTableProps = {
  t: ReturnType<typeof kitchenT>;
  language: KitchenLanguage;
  visibleMenuItems: MenuItemDTO[];
  menus: MenuDTO[];
  togglingItemId: string | null;
  togglingOptionId: string | null;
  loading: boolean;
  error: string | null;
  onToggleItem: (item: MenuItemDTO) => void;
  onToggleOption: (itemId: string, option: ModifierOptionDTO) => void;
};

export function AvailabilityTable({
  t,
  language,
  visibleMenuItems,
  menus,
  togglingItemId,
  togglingOptionId,
  loading,
  error,
  onToggleItem,
  onToggleOption,
}: AvailabilityTableProps) {
  if (error) {
    return (
      <div className="rounded-xl border border-error/50 bg-error/10 px-4 py-3 text-sm font-semibold text-error">
        {error}
      </div>
    );
  }

  if (loading) {
    return (
      <div className="rounded-xl border border-outline-variant bg-surface px-4 py-4 text-sm text-on-surface-variant">
        {t.loadingMenuItems}
      </div>
    );
  }

  return (
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
                  onClick={() => onToggleItem(item)}
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
                                onClick={() => onToggleOption(item.id, option)}
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
  );
}
