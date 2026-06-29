'use client';

import { formatMoney } from '@/lib/money';
import { localize } from '@/lib/i18n';
import type { CartLine } from '@/types/order';
import type { t } from '@/lib/i18n';

export function CheckoutSummary({
  lines,
  total,
  submitting,
  submitError,
  editingOrderId,
  copy,
  onSubmit,
}: {
  lines: CartLine[];
  total: number;
  submitting: boolean;
  submitError: string | null;
  editingOrderId: string | null;
  copy: ReturnType<typeof t>;
  onSubmit: () => void;
}) {
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        void onSubmit();
      }}
      className="space-y-5"
    >
      <section className="space-y-3 rounded-lg bg-white p-5">
        {lines.map((line) => (
          <div key={line.menuItemId} className="flex justify-between gap-4 text-sm">
            <span className="text-[#5b4039]">
              {line.quantity}x {localize(line.menuItem.name)}
            </span>
            <span className="font-bold">
              {formatMoney(line.menuItem.price * line.quantity)}
            </span>
          </div>
        ))}
        <div className="flex justify-between border-t border-[#eeeeee] pt-3 text-xl font-black">
          <span>Total</span>
          <span className="text-[#ff5722]">{formatMoney(total)}</span>
        </div>
      </section>

      {submitError ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {submitError}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={submitting}
        className="flex h-14 w-full items-center justify-center rounded-lg bg-[#ff5722] text-xl font-black text-white shadow-lg transition hover:brightness-110 active:scale-[0.98] disabled:bg-[#9e9e9e]"
      >
        {submitting
          ? (editingOrderId ? copy.updatingOrder : copy.submittingOrder)
          : (editingOrderId ? copy.updateOrder : copy.submitOrder)}
      </button>
    </form>
  );
}
