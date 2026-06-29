'use client';

import { memo } from 'react';
import { ShoppingBag } from 'lucide-react';
import { localizeName, t } from '@/lib/i18n';
import { formatMoney } from '@/lib/money';
import type { Language } from '@/types/menu';
import { getCartLines, useCartStore } from '@/store/cart.store';
import type { ThemeConfig } from '@/components/menu-sections/MenuThemes';
import { QuantityControl, IconButton } from '@/components/menu-sections/item-customizer';

type CartDrawerProps = {
  lines: ReturnType<typeof getCartLines>;
  total: number;
  language: Language;
  theme: ThemeConfig;
  onClose: () => void;
  onConfirm: () => void;
};

export const CartDrawer = memo(function CartDrawer({
  lines,
  total,
  language,
  theme,
  onClose,
  onConfirm,
}: CartDrawerProps) {
  const copy = t(language);
  const incrementItem = useCartStore((state) => state.incrementItem);
  const decrementItem = useCartStore((state) => state.decrementItem);

  return (
    <div className="fixed inset-0 z-50 bg-black/45 backdrop-blur-sm">
      <aside
        className={`ml-auto flex h-full w-full max-w-md flex-col border-l p-5 ${theme.panel} ${theme.border} ${theme.ink}`}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className={`text-xs font-bold uppercase tracking-[0.2em] ${theme.muted}`}>{copy.cart}</p>
            <h2 className="text-3xl font-semibold">{copy.currentOrder}</h2>
          </div>
          <IconButton onClick={onClose} label={copy.continueBrowsing} />
        </div>

        <div className="mt-6 flex-1 space-y-3 overflow-y-auto pr-1">
          {!lines.length ? (
            <div className={`rounded-[24px] border p-8 text-center ${theme.panelSoft} ${theme.border}`}>
              <ShoppingBag className="mx-auto mb-3" />
              <p className="font-semibold">{copy.emptyCart}</p>
            </div>
          ) : (
            lines.map((line) => (
              <div
                key={line.cartLineId ?? line.menuItemId}
                className={`rounded-[24px] border p-3 ${theme.panelSoft} ${theme.border}`}
              >
                <div className="flex gap-3">
                  {line.menuItem.image ? (
                    <img
                      src={line.menuItem.image}
                      alt={localizeName(line.menuItem, language)}
                      className="h-20 w-20 rounded-[20px] object-cover"
                    />
                  ) : (
                    <div className="h-20 w-20 rounded-[20px] bg-white/20" />
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-semibold">{localizeName(line.menuItem, language)}</p>
                      <p className="font-bold">{formatMoney(line.lineTotal)}</p>
                    </div>
                    {line.selectedModifiers.length ? (
                      <p className={`mt-1 text-xs ${theme.muted}`}>
                        {line.selectedModifiers.map((modifier) => localizeName(modifier, language)).join(' | ')}
                      </p>
                    ) : null}
                    {line.notes ? <p className={`mt-1 text-xs ${theme.muted}`}>{line.notes}</p> : null}

                    <div className="mt-3">
                      <QuantityControl
                        value={line.quantity}
                        onChange={(delta) =>
                          delta < 0
                            ? decrementItem(line.cartLineId ?? line.menuItemId)
                            : incrementItem(line.cartLineId ?? line.menuItemId)
                        }
                        theme={theme}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="border-t border-white/15 pt-4">
          <div className="mb-4 flex items-center justify-between text-lg font-bold">
            <span>{copy.total}</span>
            <span>{formatMoney(total)}</span>
          </div>
          <button
            type="button"
            onClick={onConfirm}
            disabled={!lines.length}
            className={`w-full rounded-full px-5 py-4 font-bold ${theme.accent} ${theme.accentText} disabled:opacity-50`}
          >
            {copy.confirmOrder}
          </button>
        </div>
      </aside>
    </div>
  );
});
