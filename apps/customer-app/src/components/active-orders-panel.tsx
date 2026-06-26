'use client';

import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { formatOrderClock } from '@/lib/format-time';
import { getStatusLabel } from '@/lib/order-status';
import { routes } from '@/lib/routes';
import { t } from '@/lib/i18n';
import { formatMoney } from '@/lib/money';
import { useGuestOrdersStore } from '@/store/guest-orders.store';
import { useLanguageStore } from '@/store/language.store';
import type { OrderContextDTO } from '@/types/order';

type ActiveOrdersPanelProps = {
  context: OrderContextDTO;
};

export function ActiveOrdersPanel({ context }: ActiveOrdersPanelProps) {
  const language = useLanguageStore((state) => state.language);
  const copy = t(language);
  const orders = useGuestOrdersStore((state) => state.orders);
  const loading = useGuestOrdersStore((state) => state.loading);

  if (loading || orders.length === 0) {
    return null;
  }

  return (
    <section className="mb-8 rounded-2xl border border-[#ffccbc] bg-[#fff8f6] p-5 shadow-sm">
      <div className="mb-4">
        <h2 className="text-lg font-black text-[#1a1c1c]">{copy.myOrders}</h2>
        <p className="mt-1 text-sm text-[#5b4039]">{copy.myOrdersHint}</p>
      </div>
      <ul className="space-y-3">
        {orders.map((order) => (
          <li key={order.id}>
            <Link
              href={routes.orderConfirmation(order.id, context)}
              className="flex items-center justify-between gap-4 rounded-xl border border-[#e4beb4] bg-white px-4 py-3 transition hover:border-[#ff5722]"
            >
              <div>
                <p className="font-bold text-[#1a1c1c]">
                  {copy.orderLabel} #{order.dailyOrderNumber}
                </p>
                <p className="mt-1 text-sm text-[#6f6f6f]">
                  {copy.orderAt} {formatOrderClock(order.createdAt, language)} ·{' '}
                  {getStatusLabel(order.status, language)}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-black text-[#ff5722]">{formatMoney(order.grandTotal)}</span>
                <ChevronRight
                  className="h-5 w-5 text-[#9e9e9e] rtl:rotate-180"
                  aria-hidden="true"
                />
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
