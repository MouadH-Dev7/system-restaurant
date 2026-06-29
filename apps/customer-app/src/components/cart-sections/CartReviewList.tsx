'use client';

import Link from 'next/link';
import { CartItemRow } from '@/components/cart-item-row';
import { formatMoney } from '@/lib/money';
import { routes } from '@/lib/routes';
import type { CartLine, OrderContextDTO } from '@/types/order';
import type { t } from '@/lib/i18n';

export function CartReviewList({
  lines,
  total,
  context,
  copy,
}: {
  lines: CartLine[];
  total: number;
  context: OrderContextDTO | null;
  copy: ReturnType<typeof t>;
}) {
  return (
    <div className="space-y-5">
      {lines.map((line) => (
        <CartItemRow key={line.cartLineId ?? line.menuItemId} line={line} />
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
  );
}
