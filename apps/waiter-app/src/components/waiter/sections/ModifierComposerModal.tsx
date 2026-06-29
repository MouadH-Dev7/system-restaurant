'use client';

import { memo } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import type { MenuItemDTO, ModifierGroupDTO } from '@repo/shared-types';
import type { WaiterLanguage } from '@/store/waiter.store';
import { formatMoney } from '@/lib/format';
import {
  localizeMenuItemName,
  localizeModifierGroupName,
  localizeModifierOptionName,
  replaceTemplate,
  waiterT,
} from '@/lib/i18n';

export type ComposerState = {
  item: MenuItemDTO;
  selectedOptionIds: string[];
  notes: string;
};

type ModifierComposerModalProps = {
  composer: ComposerState | null;
  language: WaiterLanguage;
  isRtl: boolean;
  onToggleOption: (group: ModifierGroupDTO, optionId: string) => void;
  onConfirm: () => void;
  onClose: () => void;
  onNotesChange: (notes: string) => void;
};

function ModifierComposerModalComponent(props: ModifierComposerModalProps) {
  const {
    composer,
    language,
    isRtl,
    onToggleOption,
    onConfirm,
    onClose,
    onNotesChange,
  } = props;

  const t = waiterT(language);

  if (!composer) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/35 p-3 backdrop-blur-sm sm:items-center sm:p-4">
      <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-[28px] bg-white p-4 shadow-[0_28px_80px_rgba(37,18,10,0.30)] sm:rounded-[32px] sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[#b55229]">{t.customizeItem}</p>
            <h2 className="mt-2 text-2xl font-black text-slate-950">
              {localizeMenuItemName(composer.item, language)}
            </h2>
            <p className="mt-2 text-sm text-slate-500">{t.chooseModifiers}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full bg-[#f6eee7] p-3 text-slate-600"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-6 space-y-5">
          {(composer.item.modifierGroups ?? []).map((group) => (
            <div key={group.id} className="rounded-[24px] border border-[#ead7c8] bg-[#fffaf6] p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-lg font-bold text-slate-950">
                    {localizeModifierGroupName(group, language)}
                  </h3>
                  <p className="mt-1 text-sm text-slate-500">
                    {group.required
                      ? `${t.statusOccupied} • ${replaceTemplate(t.selectAtLeast, {
                          count: Math.max(group.minSelections, 1),
                          group: localizeModifierGroupName(group, language),
                        })}`
                      : `${t.available} • ${replaceTemplate(t.selectAtMost, {
                          count: group.maxSelections,
                          group: localizeModifierGroupName(group, language),
                        })}`}
                  </p>
                </div>
              </div>

              <div className="mt-4 grid gap-3 md:grid-cols-2">
                {group.options.map((option) => {
                  const selected = composer.selectedOptionIds.includes(option.id);

                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => onToggleOption(group, option.id)}
                      className={`rounded-[18px] border px-4 py-3 transition ${
                        selected
                          ? 'border-[#c76d45] bg-[#fff0e8] shadow-sm'
                          : 'border-[#e8d5c6] bg-white hover:border-[#d7a285]'
                      } ${isRtl ? 'text-right' : 'text-left'}`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="font-semibold text-slate-900">
                            {localizeModifierOptionName(option, language)}
                          </p>
                          <p className="mt-1 text-sm text-slate-500">
                            {option.priceDelta > 0
                              ? `+${formatMoney(option.priceDelta, language)}`
                              : t.included}
                          </p>
                        </div>
                        {selected ? (
                          <span className="rounded-full bg-[#8d2d0e] px-3 py-1 text-xs font-bold text-white">
                            {t.selected}
                          </span>
                        ) : null}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <label className="mt-5 block">
          <span className="text-sm font-semibold text-slate-700">{t.kitchenNote}</span>
          <textarea
            value={composer.notes}
            onChange={(event) => onNotesChange(event.target.value)}
            rows={3}
            placeholder={t.kitchenNotePlaceholder}
            className="mt-2 w-full rounded-[20px] border border-[#e8d5c6] bg-[#fffdfa] px-4 py-3 text-sm outline-none focus:border-[#cf835f]"
          />
        </label>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="h-12 rounded-[18px] border border-[#e8d5c6] px-6 font-semibold text-slate-700"
          >
            {t.cancel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-[18px] bg-[#8d2d0e] px-6 font-bold text-white"
          >
            <Plus className="h-4 w-4" />
            {t.addToTicket}
          </button>
        </div>
      </div>
    </div>
  );
}

export const ModifierComposerModal = memo(ModifierComposerModalComponent);
