'use client';

import { memo } from 'react';
import { localizeDescription, localizeName, t } from '@/lib/i18n';
import { formatMoney } from '@/lib/money';
import type { Language, MenuItem } from '@/types/menu';
import type { ThemeConfig } from './MenuThemes';

type FoodCardProps = {
  item: MenuItem;
  language: Language;
  theme: ThemeConfig;
  onAdd: () => void;
};

export const FoodCard = memo(function FoodCard({
  item,
  language,
  theme,
  onAdd,
}: FoodCardProps) {
  const badge = localizeName(
    {
      name: item.badge,
      nameEn: item.badgeEn,
      nameFr: item.badgeFr,
      nameAr: item.badgeAr,
    },
    language,
  );

  return (
    <article className={`overflow-hidden rounded-[28px] border ${theme.panel} ${theme.border} ${theme.shadow}`}>
      <div className="relative aspect-[4/3] overflow-hidden">
        {item.image ? (
          <img
            src={item.image}
            alt={localizeName(item, language)}
            className="h-full w-full object-cover transition duration-500 hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center px-6 text-center text-2xl font-semibold">
            {localizeName(item, language)}
          </div>
        )}
        <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent,rgba(0,0,0,0.58))]" />
        <div className="absolute bottom-3 left-3 flex gap-2">
          {badge ? <span className={`rounded-full px-3 py-1 text-xs font-semibold ${theme.chip}`}>{badge}</span> : null}
          {item.modifierGroups?.length ? (
            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${theme.chip}`}>
              {t(language).customize}
            </span>
          ) : null}
        </div>
      </div>
      <div className="space-y-4 p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-xl font-semibold">{localizeName(item, language)}</h3>
            <p className={`mt-2 text-sm leading-6 ${theme.muted}`}>
              {localizeDescription(item, language)}
            </p>
          </div>
          <p className="shrink-0 font-bold">{formatMoney(item.price)}</p>
        </div>

        <button
          type="button"
          onClick={onAdd}
          disabled={!item.available}
          className={`w-full rounded-full px-4 py-3 text-sm font-bold ${theme.accent} ${theme.accentText} disabled:opacity-60`}
        >
          {item.available ? t(language).add : t(language).unavailable}
        </button>
      </div>
    </article>
  );
});
