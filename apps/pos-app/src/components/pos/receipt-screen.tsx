'use client';

import { useState } from 'react';
import { Printer } from 'lucide-react';
import { computeOrderTotal } from '@/hooks/use-pos-selectors';
import { formatMoney, formatReceiptDate, formatReceiptTime } from '@/lib/format';
import {
  formatCountLabel,
  formatGuestLabel,
  formatTableLabel,
  posT,
} from '@/lib/i18n';
import { isWalkInOrder, mapOrderItemsToLines } from '@/lib/mappers/order.mapper';
import { usePosUiStore } from '@/store/pos-ui.store';
import { getOrderById, usePosDataStore } from '@/store/pos-data.store';

export function ReceiptScreen() {
  const selectedOrderId = usePosUiStore((state) => state.selectedOrderId);
  const lastReceiptOrder = usePosUiStore((state) => state.lastReceiptOrder);
  const lastReceiptBundle = usePosUiStore((state) => state.lastReceiptBundle);
  const receiptLanguage = usePosUiStore((state) => state.receiptLanguage);
  const setReceiptLanguage = usePosUiStore((state) => state.setReceiptLanguage);
  const setActiveScreen = usePosUiStore((state) => state.setActiveScreen);
  const orders = usePosDataStore((state) => state.orders);
  const settings = usePosDataStore((state) => state.settings);
  const order = getOrderById(orders, selectedOrderId) ?? lastReceiptOrder;
  const [printing, setPrinting] = useState(false);
  const [printError, setPrintError] = useState<string | null>(null);
  const t = posT(receiptLanguage);
  const primaryOrder = order ?? lastReceiptBundle?.orders[0] ?? null;

  const displayBundle =
    lastReceiptBundle ??
    (order
      ? {
          mode: 'single' as const,
          orderIds: [order.id],
          tableLabel: formatTableLabel(
            order.table?.number,
            receiptLanguage,
            isWalkInOrder(order),
          ),
          guestLabel: formatGuestLabel(
            order.guestSessionId,
            order.displayOrderId ?? order.dailyOrderNumber,
            receiptLanguage,
            isWalkInOrder(order),
          ),
          itemCount: (order.items ?? []).length,
          total: order.grandTotal ?? 0,
          orders: [order],
        }
      : null);

  if (!displayBundle) {
    return (
      <div className="rounded-[28px] border border-dashed border-slate-200 bg-white/80 p-10 text-center text-slate-500">
        {t.completePaymentToPreview}
      </div>
    );
  }

  const totals = computeOrderTotal(displayBundle.total);
  const currency = settings?.currency ?? 'DZD';
  const locale = receiptLanguage === 'ar' ? 'ar-DZ' : receiptLanguage === 'fr' ? 'fr-FR' : 'en-US';
  const restaurantName = settings?.restaurantName?.trim() || t.restaurant;
  const restaurantAddress = settings?.businessAddress?.trim() || '';
  const receiptTax = displayBundle.orders.reduce((sum, entry) => sum + (entry.taxTotal ?? 0), 0);
  const receiptSubtotal = displayBundle.orders.reduce((sum, entry) => sum + (entry.subtotal ?? 0), 0);
  const receiptDiscounts = displayBundle.orders.reduce((sum, entry) => sum + (entry.discountTotal ?? 0), 0);
  const receiptPaid = displayBundle.summary?.paidAmount ?? displayBundle.total;
  const receiptDate = displayBundle.createdAt ?? displayBundle.orders[0]!.createdAt;

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div className="flex gap-3 print:hidden">
        <button
          type="button"
          disabled={printing}
          onClick={() => {
            setPrinting(true);
            setPrintError(null);
            try {
              const popup = window.open('', '_blank', 'width=900,height=900');
              if (!popup) {
                throw new Error('Popup blocked');
              }

              const receiptNode = document.getElementById('pos-receipt');
              if (!receiptNode) {
                throw new Error('Receipt preview not found');
              }

              const styles = Array.from(document.styleSheets)
                .map((styleSheet) => {
                  try {
                    return Array.from(styleSheet.cssRules).map((rule) => rule.cssText).join('');
                  } catch {
                    return '';
                  }
                })
                .join('\n');

              popup.document.write(`
                <html dir="${receiptLanguage === 'ar' ? 'rtl' : 'ltr'}">
                  <head>
                    <title>${t.printReceipt}</title>
                    <style>
                      ${styles}
                      @page { size: auto; margin: 0mm; }
                      body { margin: 0; padding: 16px; background: white; font-family: monospace; }
                      #pos-receipt { max-width: 420px; margin: 0 auto; box-shadow: none !important; }
                      @media print {
                        body { padding: 0; margin: 0; }
                        .no-print { display: none !important; }
                      }
                    </style>
                  </head>
                  <body dir="${receiptLanguage === 'ar' ? 'rtl' : 'ltr'}">
                    ${receiptNode.outerHTML}
                  </body>
                </html>
              `);
              popup.document.close();
              popup.focus();

              setTimeout(() => {
                popup.print();
                popup.close();
                setPrinting(false);
              }, 150);
            } catch (error) {
              setPrintError(error instanceof Error ? error.message : 'Receipt printing failed.');
              setPrinting(false);
            }
          }}
          className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-[#a73308] px-5 py-4 font-bold text-white"
        >
          <Printer size={18} />
          {printing ? t.processing : t.printReceipt}
        </button>
        <button
          type="button"
          onClick={() => setActiveScreen('orders')}
          className="rounded-2xl border border-slate-200 bg-white px-5 py-4 font-semibold text-slate-700"
        >
          {t.backToBoard}
        </button>
      </div>

      <div className="rounded-[24px] border border-white/70 bg-white/80 p-4 print:hidden">
        <p className="text-sm font-semibold text-slate-900">{t.receiptLanguage}</p>
        <p className="mt-1 text-xs text-slate-500">{t.chooseReceiptLanguage}</p>
        <div className="mt-3 flex gap-2">
          {[
            { id: 'ar', label: t.arabicOnly },
            { id: 'fr', label: t.frenchOnly },
            { id: 'en', label: t.englishOnly },
          ].map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => setReceiptLanguage(option.id as 'ar' | 'fr' | 'en')}
              className={[
                'rounded-xl border px-4 py-2 text-sm font-semibold',
                receiptLanguage === option.id
                  ? 'border-[#cf6d43] bg-[#fff0e8] text-[#8d3c19]'
                  : 'border-slate-200 bg-white text-slate-600',
              ].join(' ')}
            >
              {option.label}
            </button>
          ))}
        </div>
        <p className="mt-3 text-xs text-slate-500">{t.noAutoPrint}</p>
      </div>

      {printError ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800 print:hidden">
          {printError}
        </div>
      ) : null}

      <article
        id="pos-receipt"
        className="rounded-[28px] bg-white p-8 font-mono text-xs text-slate-800 shadow-lg print:rounded-none print:shadow-none"
      >
        <div className="border-b border-dashed border-slate-300 pb-6 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-slate-900 text-white">
            POS
          </div>
          <h3 className="mt-4 text-lg font-black uppercase tracking-[0.28em]">{restaurantName}</h3>
          {restaurantAddress ? (
            <p className="mt-2 font-sans text-[10px] text-slate-500">{restaurantAddress}</p>
          ) : null}
        </div>

          <div className="space-y-1 border-b border-dashed border-slate-300 py-4 font-sans text-[10px] font-bold uppercase text-slate-500">
          <div className="flex justify-between">
            <span>
              {displayBundle.mode === 'table'
                ? `${t.tableBundle} (${displayBundle.orderIds.length})`
                : `${t.order} #${displayBundle.orders[0]?.displayOrderId ?? displayBundle.orders[0]?.dailyOrderNumber ?? ''}`}
            </span>
          </div>
          <div className="flex justify-between">
            <span>
              {primaryOrder
                ? formatTableLabel(primaryOrder.table?.number, receiptLanguage, isWalkInOrder(primaryOrder))
                : displayBundle.tableLabel}
            </span>
            <span>{formatCountLabel(displayBundle.itemCount, t.item, t.items, receiptLanguage)}</span>
          </div>
          <div className="flex justify-between">
            <span>{formatReceiptDate(displayBundle.orders[0]!.createdAt)}</span>
            <span>{formatReceiptTime(displayBundle.orders[0]!.createdAt)}</span>
          </div>
          {displayBundle.mode === 'table' ? (
            <>
              <div className="flex justify-between">
                <span>{t.cashier}</span>
                <span>{displayBundle.cashierName ?? '-'}</span>
              </div>
              <div className="flex justify-between">
                <span>{t.billDate}</span>
                <span>
                  {formatReceiptDate(receiptDate)} {formatReceiptTime(receiptDate)}
                </span>
              </div>
            </>
          ) : null}
        </div>

        <div className="space-y-4 py-6">
          {displayBundle.orders.map((bundleOrder) => {
            const lines = mapOrderItemsToLines(bundleOrder, receiptLanguage);
            return (
              <div key={bundleOrder.id} className="space-y-3">
                {displayBundle.orders.length > 1 ? (
                  <div className="border-b border-dashed border-slate-200 pb-2 text-[10px] font-bold uppercase text-slate-500">
                    {t.ticket} #{bundleOrder.displayOrderId ?? bundleOrder.dailyOrderNumber}
                  </div>
                ) : null}
                {lines.map((line) => (
                  <div key={line.id} className="space-y-1">
                    <div className="flex justify-between gap-3">
                      <span className="font-bold uppercase">
                        {line.quantity}x {line.name}
                      </span>
                      <span className="font-bold">{formatMoney(line.price, locale, currency)}</span>
                    </div>
                    {line.modifiers?.length ? (
                      <div className="space-y-0.5 pl-3 text-[10px] text-slate-500">
                        {line.modifiers.map((modifier) => (
                          <div key={`${line.id}-${modifier}`}>+ {modifier}</div>
                        ))}
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            );
          })}
        </div>

        <div className="border-t-2 border-slate-900 pt-3">
          <div className="mb-2 flex justify-between text-sm font-bold uppercase text-slate-600">
            <span>Subtotal</span>
            <span>{formatMoney(receiptSubtotal, locale, currency)}</span>
          </div>
          <div className="mb-2 flex justify-between text-sm font-bold uppercase text-slate-600">
            <span>Discounts</span>
            <span>{formatMoney(receiptDiscounts, locale, currency)}</span>
          </div>
          <div className="mb-2 flex justify-between text-sm font-bold uppercase text-slate-600">
            <span>Tax</span>
            <span>{formatMoney(receiptTax, locale, currency)}</span>
          </div>
          <div className="flex justify-between text-lg font-black uppercase">
            <span>{t.total}</span>
            <span>{formatMoney(totals.total, locale, currency)}</span>
          </div>
          <div className="mt-2 flex justify-between text-sm font-bold uppercase text-slate-600">
            <span>{t.paid}</span>
            <span>{formatMoney(receiptPaid, locale, currency)}</span>
          </div>
        </div>

        <p className="mt-6 text-center font-sans text-[10px] text-slate-500">
          {settings?.receiptFooterMessage?.trim() || t.thankYou}
        </p>
      </article>
    </div>
  );
}
