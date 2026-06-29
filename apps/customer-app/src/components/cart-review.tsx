'use client';

import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { AppHeader } from '@/components/app-header';
import { TableSessionSync } from '@/components/table-session-sync';
import { CartReviewList } from '@/components/cart-sections';
import { getCartLines, getCartTotal, getDraftItems, useCartStore } from '@/store/cart.store';
import { useLanguageStore } from '@/store/language.store';
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
          <CartReviewList lines={lines} total={total} context={context} copy={copy} />
        )}
      </main>
    </div>
  );
}
