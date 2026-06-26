'use client';

import { Minus, Plus, Trash2 } from 'lucide-react';
import type { CartLine } from '@/types/order';
import { formatMoney } from '@/lib/money';
import { localizeName } from '@/lib/i18n';
import { useCartStore } from '@/store/cart.store';
import { useLanguageStore } from '@/store/language.store';

type CartItemRowProps = {
  line: CartLine;
};

export function CartItemRow({ line }: CartItemRowProps) {
  const language = useLanguageStore((state) => state.language);
  const incrementItem = useCartStore((state) => state.incrementItem);
  const decrementItem = useCartStore((state) => state.decrementItem);
  const removeItem = useCartStore((state) => state.removeItem);

  return (
    <div className="flex gap-4 rounded-lg border border-[#e4beb4]/40 bg-white p-4">
      {line.menuItem.image ? (
        <img
          src={line.menuItem.image}
          alt={localizeName(line.menuItem, language)}
          className="h-20 w-20 rounded-lg object-cover"
        />
      ) : (
        <div className="h-20 w-20 rounded-lg bg-[#eeeeee]" />
      )}
      <div className="min-w-0 flex-1">
        <div className="flex justify-between gap-3">
          <h2 className="font-bold text-[#1a1c1c]">{localizeName(line.menuItem, language)}</h2>
          <span className="font-black text-[#ff5722]">{formatMoney(line.lineTotal)}</span>
        </div>
        {line.selectedModifiers.length > 0 ? (
          <p className="mt-1 text-xs text-[#6f6f6f]">
            {line.selectedModifiers
              .map((modifier) => localizeName(modifier, language))
              .join(' | ')}
          </p>
        ) : null}
        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => decrementItem(line.cartLineId ?? line.menuItemId)}
              className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#eeeeee]"
            >
              <Minus className="h-4 w-4" aria-hidden="true" />
            </button>
            <span className="w-8 text-center font-bold">{line.quantity}</span>
            <button
              type="button"
              onClick={() => incrementItem(line.cartLineId ?? line.menuItemId)}
              className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#ff5722] text-white"
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
          <button
            type="button"
            onClick={() => removeItem(line.cartLineId ?? line.menuItemId)}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-[#ba1a1a]"
          >
            <Trash2 className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
}
