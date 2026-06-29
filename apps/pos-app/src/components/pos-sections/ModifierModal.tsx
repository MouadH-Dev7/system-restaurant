'use client';

import { Check, Minus, Plus, X } from 'lucide-react';
import type { MenuItemDTO, ModifierGroupDTO, ModifierOptionDTO } from '@repo/shared-types';
import { formatMoney } from '@/lib/format';
import {
  localizeMenuItemName,
  localizeModifierGroupName,
  localizeModifierOptionName,
  replaceTemplate,
} from '@/lib/i18n';

type CustomizerView = {
  item: MenuItemDTO;
  cartLineId: string | null;
  quantity: number;
  notes: string;
  selectedOptionIds: string[];
};

type ModifierModalProps = {
  customizing: CustomizerView | null;
  language: 'en' | 'fr' | 'ar';
  t: Record<string, string>;
  onSave: () => void;
  onClose: () => void;
  onToggleOption: (group: ModifierGroupDTO, option: ModifierOptionDTO) => void;
  onUpdateQuantity: (delta: number) => void;
  onUpdateNotes: (notes: string) => void;
};

function selectedOptionsByGroup(group: ModifierGroupDTO, selectedIds: string[]) {
  const selected = new Set(selectedIds);
  return group.options.filter((option) => selected.has(option.id));
}

function findSelectedOptions(item: MenuItemDTO, selectedOptionIds: string[]) {
  const selected = new Set(selectedOptionIds);
  return (item.modifierGroups ?? []).flatMap((group) =>
    group.options.filter((option) => selected.has(option.id)),
  );
}

export function ModifierModal({
  customizing,
  language,
  t,
  onSave,
  onClose,
  onToggleOption,
  onUpdateQuantity,
  onUpdateNotes,
}: ModifierModalProps) {
  if (!customizing) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/35 p-4 backdrop-blur-sm">
      <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-[30px] bg-white p-6 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">
              {t.customize}
            </p>
            <h3 className="mt-1 text-2xl font-bold">
              {localizeMenuItemName(customizing.item, language)}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-slate-200 p-2 text-slate-500"
          >
            <X size={18} />
          </button>
        </div>

        <div className="space-y-4">
          {(customizing.item.modifierGroups ?? []).map((group) => {
            const selected = selectedOptionsByGroup(group, customizing.selectedOptionIds);
            return (
              <div key={group.id} className="rounded-2xl border border-slate-200 p-4">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div>
                    <h4 className="font-bold">{localizeModifierGroupName(group, language)}</h4>
                    <p className="mt-1 text-xs text-slate-500">
                      {group.required ? t.required : t.optional} -{' '}
                       {replaceTemplate(t.upToCount ?? '', { count: group.maxSelections ?? 0 })}
                    </p>
                  </div>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
                    {selected.length}/{group.maxSelections}
                  </span>
                </div>

                <div className="space-y-2">
                  {group.options.map((option) => {
                    const active = customizing.selectedOptionIds.includes(option.id);
                    return (
                      <button
                        key={option.id}
                        type="button"
                        onClick={() => onToggleOption(group, option)}
                        className={[
                          'flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left transition',
                          active
                            ? 'border-[#cf6d43] bg-[#fff0e8] text-[#8d3c19]'
                            : 'border-slate-200 bg-white text-slate-700',
                        ].join(' ')}
                      >
                        <span>
                          <span className="block font-semibold">
                            {localizeModifierOptionName(option, language)}
                          </span>
                          {option.description ? (
                            <span className="mt-1 block text-xs opacity-80">
                              {option.description}
                            </span>
                          ) : null}
                        </span>
                        <span className="flex items-center gap-2 font-semibold">
                          {option.priceDelta > 0
                            ? `+${formatMoney(option.priceDelta)}`
                            : t.included}
                          {active ? <Check size={16} /> : null}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}

          <div className="rounded-2xl border border-slate-200 p-4">
            <p className="mb-3 font-bold">{t.kitchenNote}</p>
            <textarea
              value={customizing.notes}
              onChange={(event) => onUpdateNotes(event.target.value)}
              placeholder={t.kitchenNotePlaceholder}
              className="min-h-28 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none"
            />
          </div>

          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold">{t.lineTotal}</p>
              <p className="text-xl font-bold text-[#a73308]">
                {formatMoney(
                  (customizing.item.price +
                    findSelectedOptions(customizing.item, customizing.selectedOptionIds).reduce(
                      (sum, option) => sum + option.priceDelta,
                      0,
                    )) * customizing.quantity,
                )}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="rounded-lg bg-slate-100 p-2"
                onClick={() => onUpdateQuantity(-1)}
              >
                <Minus size={14} />
              </button>
              <span className="w-8 text-center font-bold">{customizing.quantity}</span>
              <button
                type="button"
                className="rounded-lg bg-[#a73308] p-2 text-white"
                onClick={() => onUpdateQuantity(1)}
              >
                <Plus size={14} />
              </button>
            </div>
          </div>

          <button
            type="button"
            onClick={onSave}
            className="w-full rounded-2xl bg-[#18222f] px-5 py-4 text-sm font-bold text-white"
          >
            {customizing.cartLineId ? t.saveLine : t.addToTicket}
          </button>
        </div>
      </div>
    </div>
  );
}
