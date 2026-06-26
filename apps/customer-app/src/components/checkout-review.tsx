'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { ChevronLeft } from 'lucide-react';
import { AppHeader } from '@/components/app-header';
import { TableSessionSync } from '@/components/table-session-sync';
import { getCartLines, getCartTotal, getDraftItems, useCartStore } from '@/store/cart.store';
import { useLanguageStore } from '@/store/language.store';
import { getApiErrorMessage, getApiErrorStatus } from '@/lib/api-error';
import { getOrCreateGuestSessionId } from '@/lib/guest-session';
import { formatMoney } from '@/lib/money';
import { routes } from '@/lib/routes';
import { localize, t } from '@/lib/i18n';
import { createOrder, updateCustomerOrder } from '@/services/order.service';
import { useAppStore } from '@/store/app.store';
import { useGuestOrdersStore } from '@/store/guest-orders.store';
import type { CreateOrderInput, OrderContextDTO, OrderResponse } from '@/types/order';
import { useMenuItems } from '@/hooks/use-menu-items';

type CheckoutReviewProps = {
  initialContext: OrderContextDTO | null;
};

export function CheckoutReview({ initialContext }: CheckoutReviewProps) {
  const router = useRouter();
  const language = useLanguageStore((state) => state.language);
  const storedContext = useAppStore((state) => state.context);
  const draft = useCartStore((state) => state.draft);
  const editingOrderId = useCartStore((state) => state.editingOrderId);
  const editingOrderVersion = useCartStore((state) => state.editingOrderVersion);
  const clearCart = useCartStore((state) => state.clear);
  const copy = t(language);
  const context = initialContext ?? storedContext;
  const draftItems = getDraftItems(draft, context);
  const { items: menuItems } = useMenuItems(context);
  const lines = getCartLines(draftItems, menuItems);
  const total = getCartTotal(lines);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  function buildOrderInput(): CreateOrderInput | null {
    if (!context || draftItems.length === 0) {
      return null;
    }

    return {
      restaurantId: context.restaurantId,
      tableId: context.tableId,
      guestSessionId: getOrCreateGuestSessionId(context),
      items: draftItems.map((item) => ({
        menuItemId: item.menuItemId,
        quantity: item.quantity,
        cartLineId: item.cartLineId,
        modifierOptionIds: item.modifierOptionIds,
        ...(item.notes ? { notes: item.notes } : {}),
      })),
    };
  }

  async function onSubmit() {
    const input = buildOrderInput();
    if (!context || !input) {
      setSubmitError(copy.emptyCart);
      return;
    }

    setSubmitting(true);
    setSubmitError(null);

    try {
      let order: OrderResponse;
      if (editingOrderId) {
        if (editingOrderVersion === null) {
          setSubmitError(copy.orderUpdatedByStaff);
          return;
        }

        order = await updateCustomerOrder(
          editingOrderId,
          { items: input.items, version: editingOrderVersion },
          context,
          getOrCreateGuestSessionId(context),
        );
      } else {
        order = await createOrder(input);
      }
      useGuestOrdersStore.getState().upsertOrder(order);
      clearCart();
      router.push(routes.orderConfirmation(order.id, context));
    } catch (error) {
      const status = getApiErrorStatus(error);
      const apiMessage = getApiErrorMessage(error, '');

      if (status === 403) {
        setSubmitError(copy.invalidTableSession);
        return;
      }

      if (status === 409 && editingOrderId) {
        if (apiMessage.includes('preparation has already started')) {
          clearCart();
          router.push(routes.orderConfirmation(editingOrderId, context));
          return;
        }

        setSubmitError(copy.orderUpdatedByStaff);
        return;
      }

      setSubmitError(
        getApiErrorMessage(error, editingOrderId ? copy.updateOrderFailed : copy.submitOrderFailed),
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#f9f9f9] pb-8">
      <TableSessionSync context={context} />
      <AppHeader />
      <main className="mx-auto max-w-2xl px-5 py-6">
        <Link
          href={routes.cart(context)}
          className="mb-6 inline-flex items-center gap-2 font-semibold text-[#5b4039]"
        >
          <ChevronLeft className="h-5 w-5 rtl:rotate-180" aria-hidden="true" />
          {copy.cart}
        </Link>

        <h1 className="mb-6 text-4xl font-black text-[#1a1c1c]">{copy.checkout}</h1>

        {!context ? (
          <div className="rounded-lg border border-dashed border-[#e4beb4] bg-white p-8 text-center text-[#6f6f6f]">
            Table context is required.
          </div>
        ) : lines.length === 0 ? (
          <div className="rounded-lg border border-dashed border-[#e4beb4] bg-white p-8 text-center text-[#6f6f6f]">
            {copy.emptyCart}
          </div>
        ) : (
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
        )}
      </main>
    </div>
  );
}
