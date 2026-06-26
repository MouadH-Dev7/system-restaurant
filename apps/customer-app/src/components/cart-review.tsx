'use client';

import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { AppHeader } from '@/components/app-header';
import { TableSessionSync } from '@/components/table-session-sync';
import { CartItemRow } from '@/components/cart-item-row';
import { getCartLines, getCartTotal, getDraftItems, useCartStore } from '@/store/cart.store';
import { useLanguageStore } from '@/store/language.store';
import { formatMoney } from '@/lib/money';
import { routes } from '@/lib/routes';
import { t } from '@/lib/i18n';
import { useAppStore } from '@/store/app.store';
import type { OrderContextDTO } from '@/types/order';
import { useMenuItems } from '@/hooks/use-menu-items';

type CartReviewProps = {
  initialContext: OrderContextDTO | null;
};

export function CartReview({ initialContext }: CartReviewProps) {
  const language = useLanguageStore((state) => state.language);
  const storedContext = useAppStore((state) => state.context);
  const draft = useCartStore((state) => state.draft);
  const copy = t(language);
  const context = initialContext ?? storedContext;
  const draftItems = getDraftItems(draft, context);
  const { items: menuItems } = useMenuItems(context);
  const lines = getCartLines(draftItems, menuItems);
  const total = getCartTotal(lines);

  return (
    <div className="min-h-screen bg-[#f9f9f9] pb-8">
      <TableSessionSync context={context} />
      <AppHeader />
      <main className="mx-auto max-w-2xl px-5 py-6">
        <Link
          href={routes.menus(context)}
          className="mb-6 inline-flex items-center gap-2 font-semibold text-[#5b4039]"
        >
          <ChevronLeft className="h-5 w-5 rtl:rotate-180" aria-hidden="true" />
          {copy.addMore}
        </Link>

        <h1 className="mb-6 text-4xl font-black text-[#1a1c1c]">{copy.cart}</h1>

        {!context ? (
          <div className="rounded-lg border border-dashed border-[#e4beb4] bg-white p-8 text-center text-[#6f6f6f]">
            Table context is required.
          </div>
        ) : lines.length === 0 ? (
          <div className="rounded-lg border border-dashed border-[#e4beb4] bg-white p-8 text-center text-[#6f6f6f]">
            {copy.emptyCart}
          </div>
        ) : (
          <div className="space-y-5">
            {lines.map((line) => (
              <CartItemRow key={line.menuItemId} line={line} />
            ))}

            <div className="rounded-lg bg-white p-5">
              <div className="flex items-center justify-between text-xl font-black">
                <span>Total</span>
                <span className="text-[#ff5722]">{formatMoney(total)}</span>
              </div>
            </div>

            <Link
              href={routes.checkout(context)}
              className="flex h-14 w-full items-center justify-center rounded-lg bg-[#ff5722] text-xl font-black text-white shadow-lg transition hover:brightness-110 active:scale-[0.98]"
            >
              {copy.checkout}
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
