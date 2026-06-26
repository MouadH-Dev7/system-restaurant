'use client';

import { Plus } from 'lucide-react';
import type { MenuItem } from '@/types/menu';
import type { OrderContextDTO } from '@/types/order';
import { formatMoney } from '@/lib/money';
import { localize, t } from '@/lib/i18n';
import { useCartStore } from '@/store/cart.store';
import { useLanguageStore } from '@/store/language.store';

type MenuItemCardProps = {
  item: MenuItem;
  context: OrderContextDTO;
};

export function MenuItemCard({ item, context }: MenuItemCardProps) {
  const language = useLanguageStore((state) => state.language);
  const addItem = useCartStore((state) => state.addItem);
  const copy = t(language);

  return (
    <article className="group relative overflow-hidden rounded-lg border border-[#e4beb4]/40 bg-white shadow-sm transition hover:shadow-md">
      <div className="aspect-[4/3] overflow-hidden bg-[#eeeeee]">
        {item.image ? (
          <img
            src={item.image}
            alt={localize(item.name)}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          />
        ) : null}
      </div>
      <div className="p-5 pb-20">
        <div className="mb-2 flex items-start justify-between gap-4">
          <h2 className="text-2xl font-black text-[#1a1c1c]">{localize(item.name)}</h2>
          <span className="text-xl font-black text-[#ff5722]">{formatMoney(item.price)}</span>
        </div>
        <p className="line-clamp-2 text-sm leading-6 text-[#5b4039]">
          {localize(item.description)}
        </p>
      </div>
      <button
        type="button"
        disabled={!item.available}
        onClick={() => addItem(item, context)}
        className="absolute bottom-4 right-4 flex h-12 min-w-12 items-center justify-center rounded-lg bg-[#ff5722] px-4 font-bold text-white shadow-lg transition hover:brightness-110 active:scale-95 disabled:bg-[#9e9e9e] rtl:left-4 rtl:right-auto"
        aria-label={`${copy.add} ${localize(item.name)}`}
      >
        {item.available ? <Plus className="h-6 w-6" aria-hidden="true" /> : copy.unavailable}
      </button>
    </article>
  );
}
