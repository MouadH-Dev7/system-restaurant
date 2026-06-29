'use client';

import { memo } from 'react';
import { Minus, Plus, X } from 'lucide-react';
import type { MenuItemDTO, ModifierOptionDTO } from '@repo/shared-types';
import { formatMoney } from '@/lib/format';
import {
  localizeMenuItemName,
  localizeModifierOptionName,
} from '@/lib/i18n';

type CartLineView = {
  cartLineId: string;
  quantity: number;
  notes?: string;
  item: MenuItemDTO;
  selectedOptions: ModifierOptionDTO[];
  unitPrice: number;
  lineTotal: number;
};

type DraftCartPanelProps = {
  lines: CartLineView[];
  cartTotal: number;
  cartCount: number;
  submitting: boolean;
  submitLabel: string;
  language: 'en' | 'fr' | 'ar';
  t: Record<string, string>;
  onEditLine: (lineId: string) => void;
  onRemoveLine: (lineId: string) => void;
  onUpdateQuantity: (lineId: string, delta: number) => void;
  onSubmit: () => void;
};

export const DraftCartPanel = memo(function DraftCartPanel({
  lines,
  cartTotal,
  cartCount,
  submitting,
  submitLabel,
  language,
  t,
  onEditLine,
  onRemoveLine,
  onUpdateQuantity,
  onSubmit,
}: DraftCartPanelProps) {
  return (
    <aside className="rounded-[28px] border border-white/70 bg-white/80 p-6">
      <h3 className="text-lg font-bold">{t.currentTicket}</h3>
      <div className="mt-4 space-y-3">
        {lines.length === 0 ? (
          <p className="text-sm text-slate-500">{t.addItemsFromMenu}</p>
        ) : (
          lines.map((line) => (
            <div
              key={line.cartLineId}
              className="rounded-2xl border border-slate-200 bg-slate-50 p-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <button
                    type="button"
                    onClick={() => onEditLine(line.cartLineId)}
                    className="text-left font-bold text-slate-900 hover:text-[#a73308]"
                  >
                    {line.quantity}x {localizeMenuItemName(line.item, language)}
                  </button>
                  {!!line.selectedOptions.length ? (
                    <p className="mt-1 text-xs text-slate-500">
                      {line.selectedOptions
                        .map((option) => localizeModifierOptionName(option, language))
                        .join(' | ')}
                    </p>
                  ) : null}
                  {line.notes ? (
                    <p className="mt-1 text-xs text-slate-500">{line.notes}</p>
                  ) : null}
                </div>
                <button
                  type="button"
                  onClick={() => onRemoveLine(line.cartLineId)}
                  className="rounded-lg bg-white p-2 text-slate-500"
                >
                  <X size={14} />
                </button>
              </div>

              <div className="mt-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className="rounded-lg bg-white p-2"
                    onClick={() => onUpdateQuantity(line.cartLineId, -1)}
                  >
                    <Minus size={14} />
                  </button>
                  <span className="w-6 text-center font-bold">{line.quantity}</span>
                  <button
                    type="button"
                    className="rounded-lg bg-[#a73308] p-2 text-white"
                    onClick={() => onUpdateQuantity(line.cartLineId, 1)}
                  >
                    <Plus size={14} />
                  </button>
                </div>
                <span className="font-bold">{formatMoney(line.lineTotal)}</span>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="mt-4 flex justify-between border-t border-dashed border-slate-200 pt-4 text-lg font-bold">
        <span>{t.total}</span>
        <span className="text-[#a73308]">{formatMoney(cartTotal)}</span>
      </div>

      <button
        type="button"
        disabled={submitting || lines.length === 0}
        onClick={onSubmit}
        className="mt-6 h-14 w-full rounded-2xl bg-[#18222f] text-lg font-bold text-white disabled:opacity-50"
      >
        {submitting ? t.submitting : submitLabel}
      </button>
    </aside>
  );
});
