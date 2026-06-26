'use client';

import Link from 'next/link';
import { ShoppingCart } from 'lucide-react';
import { getCartLines, getCartTotal, getDraftItems, useCartStore } from '@/store/cart.store';
import { formatMoney } from '@/lib/money';
import { routes } from '@/lib/routes';
import { t } from '@/lib/i18n';
import { useLanguageStore } from '@/store/language.store';
import type { OrderContextDTO } from '@/types/order';
import { useMenuItems } from '@/hooks/use-menu-items';

type BottomCartBarProps = {
  context: OrderContextDTO | null;
};

export function BottomCartBar({ context }: BottomCartBarProps) {
  const language = useLanguageStore((state) => state.language);
  const draft = useCartStore((state) => state.draft);
  const draftItems = getDraftItems(draft, context);
  const { items: menuItems } = useMenuItems(context);
  const lines = getCartLines(draftItems, menuItems);
  const count = draftItems.reduce((sum, line) => sum + line.quantity, 0);
  const total = getCartTotal(lines);

  if (count === 0 || !context) {
    return null;
  }

  return (
    <Link
      href={routes.cart(context)}
      className="fixed bottom-0 left-0 z-50 flex h-[72px] w-full items-center rounded-t-lg bg-[#ff5722] px-5 text-white shadow-[0_-4px_14px_rgba(0,0,0,0.16)] transition active:scale-[0.99]"
    >
      <span className="flex w-full items-center justify-between">
        <span className="flex items-center gap-3">
          <span className="rounded-lg bg-white/20 p-2">
            <ShoppingCart className="h-6 w-6" aria-hidden="true" />
          </span>
          <span className="text-xl font-black">{t(language).viewCart}</span>
        </span>
        <span className="text-right rtl:text-left">
          <span className="block text-xs opacity-85">{count} items</span>
          <span className="block text-xl font-black">{formatMoney(total)}</span>
        </span>
      </span>
    </Link>
  );
}
