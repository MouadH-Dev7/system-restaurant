'use client';

import { memo } from 'react';
import { ArrowLeft } from 'lucide-react';
import type { MenuDTO, MenuItemDTO } from '@repo/shared-types';
import { formatMoney } from '@/lib/format';
import { localizeMenuItemName, localizeMenuName } from '@/lib/i18n';

function localizeItemDescription(item: MenuItemDTO, language: 'en' | 'fr' | 'ar') {
  if (language === 'ar') {
    return item.descriptionAr ?? item.description ?? '';
  }

  if (language === 'fr') {
    return item.descriptionFr ?? item.descriptionEn ?? item.description ?? '';
  }

  return item.descriptionEn ?? item.description ?? '';
}

function localizeItemBadge(item: MenuItemDTO, language: 'en' | 'fr' | 'ar') {
  if (language === 'ar') {
    return item.badgeAr ?? item.badge ?? null;
  }

  if (language === 'fr') {
    return item.badgeFr ?? item.badgeEn ?? item.badge ?? null;
  }

  return item.badgeEn ?? item.badge ?? null;
}

type ProductGridProps = {
  loading: boolean;
  menuItems: MenuItemDTO[];
  selectedMenu: MenuDTO | null;
  language: 'en' | 'fr' | 'ar';
  variant: 'default' | 'waiter';
  t: Record<string, string>;
  onOpenItem: (item: MenuItemDTO) => void;
  onBack: () => void;
};

export const ProductGrid = memo(function ProductGrid({
  loading,
  menuItems,
  selectedMenu,
  language,
  variant,
  t,
  onOpenItem,
  onBack,
}: ProductGridProps) {
  return (
    <div>
      <button
        type="button"
        onClick={onBack}
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
                  onClick={() => onOpenItem(item)}
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
  );
});
