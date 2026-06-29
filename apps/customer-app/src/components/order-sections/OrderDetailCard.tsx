'use client';

import type { OrderResponse } from '@repo/shared-types';
import { localizeName } from '@/lib/i18n';
import { formatMoney } from '@/lib/money';
import type { Language } from '@/types/menu';
import type { t } from '@/lib/i18n';

export function formatModifierLabel(
  modifier: NonNullable<OrderResponse['items'][number]['modifiers']>[number],
  language: Language,
) {
  const group = localizeName(
    {
      name: modifier.groupName,
      nameEn: modifier.groupNameEn,
      nameFr: modifier.groupNameFr,
      nameAr: modifier.groupNameAr,
    },
    language,
  );
  const option = localizeName(
    {
      optionName: modifier.optionName,
      optionNameEn: modifier.optionNameEn,
      optionNameFr: modifier.optionNameFr,
      optionNameAr: modifier.optionNameAr,
    },
    language,
  );

  return group ? `${group}: ${option}` : option;
}

export function OrderDetailCard({
  order,
  failed,
  language,
  copy,
}: {
  order: OrderResponse | null;
  failed: boolean;
  language: Language;
  copy: ReturnType<typeof t>;
}) {
  return (
    <section className="mt-8 rounded-[28px] border border-[#e1cdb5] bg-white p-6 shadow-[0_20px_60px_rgba(70,47,26,0.08)]">
      <h2 className="mb-4 text-xl font-black text-[#1f1b17]">{copy.orderDetails}</h2>

      {order ? (
        <div className="space-y-3">
          {order.items.map((line) => (
            <div
              key={line.id ?? line.menuItemId}
              className="flex justify-between gap-4 rounded-[20px] border border-[#f0e6da] bg-[#fffdfa] p-4 text-sm"
            >
              <div className="text-[#5b4c40]">
                <p className="font-semibold">
                  {line.quantity} x{' '}
                  {line.menuItem ? localizeName(line.menuItem, language) : line.menuItemId}
                </p>
                {line.modifiers?.length ? (
                  <p className="mt-1 text-xs text-[#8b7b6d]">
                    {line.modifiers.map((modifier) => formatModifierLabel(modifier, language)).join(' | ')}
                  </p>
                ) : null}
                {line.notes ? <p className="mt-1 text-xs text-[#8b7b6d]">{line.notes}</p> : null}
              </div>
              <span className="font-bold text-[#2d241d]">{formatMoney(line.price * line.quantity)}</span>
            </div>
          ))}

          <div className="space-y-2 border-t border-[#efe4d7] pt-4 text-sm font-bold text-[#1f1b17]">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>{formatMoney(order.subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span>Discounts</span>
              <span>{formatMoney(order.discountTotal)}</span>
            </div>
            <div className="flex justify-between">
              <span>Tax</span>
              <span>{formatMoney(order.taxTotal)}</span>
            </div>
            <div className="flex justify-between text-lg">
              <span>{copy.total}</span>
              <span className="text-[#b26f2f]">{formatMoney(order.grandTotal)}</span>
            </div>
            <div className="flex justify-between text-xs text-[#7d6d5f]">
              <span>Paid</span>
              <span>{formatMoney(order.paidAmount)}</span>
            </div>
            <div className="flex justify-between text-xs text-[#7d6d5f]">
              <span>Remaining</span>
              <span>{formatMoney(order.remainingAmount)}</span>
            </div>
          </div>
        </div>
      ) : (
        <p className="text-sm text-[#7d6d5f]">
          {failed ? copy.orderLoadFailed : copy.connecting}
        </p>
      )}
    </section>
  );
}
