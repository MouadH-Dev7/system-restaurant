'use client';

import type { Dispatch, ReactNode, SetStateAction } from 'react';
import { Minus, Plus, X, Check, Utensils } from 'lucide-react';
import type { ModifierGroupDTO, ModifierOptionDTO } from '@repo/shared-types';
import { localizeDescription, localizeName, t } from '@/lib/i18n';
import { formatMoney } from '@/lib/money';
import type { Language, MenuItem } from '@/types/menu';
import {
  findSelectedOptions,
  itemUnitPrice,
  selectedOptionsByGroup,
  validateCustomization,
} from './MenuThemes';
import type { ThemeConfig } from './MenuThemes';

export type CustomizerState = {
  item: MenuItem;
  quantity: number;
  notes: string;
  selectedOptionIds: string[];
};

export function QuantityControl({
  value,
  onChange,
  theme,
}: {
  value: number;
  onChange: (delta: number) => void;
  theme: ThemeConfig;
}) {
  return (
    <div className={`flex items-center rounded-full border p-1 ${theme.panelSoft} ${theme.border}`}>
      <button
        type="button"
        onClick={() => onChange(-1)}
        className="grid h-9 w-9 place-items-center rounded-full"
      >
        <Minus size={15} />
      </button>
      <span className="w-8 text-center text-sm font-bold">{value}</span>
      <button
        type="button"
        onClick={() => onChange(1)}
        className="grid h-9 w-9 place-items-center rounded-full"
      >
        <Plus size={15} />
      </button>
    </div>
  );
}

export function IconButton({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="grid h-11 w-11 place-items-center rounded-full border border-white/20 bg-white/10"
    >
      <X size={18} />
    </button>
  );
}

export function ModalShell({
  children,
  theme,
  onClose,
}: {
  children: ReactNode;
  theme: ThemeConfig;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-end bg-black/45 p-3 backdrop-blur-sm sm:place-items-center">
      <div
        className={`max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-[32px] border p-5 ${theme.panel} ${theme.border} ${theme.ink} ${theme.shadow}`}
      >
        <div className="mb-4 flex justify-end">
          <IconButton onClick={onClose} label="close" />
        </div>
        {children}
      </div>
    </div>
  );
}

export function toggleGroupOption(
  group: ModifierGroupDTO,
  option: ModifierOptionDTO,
  setState: Dispatch<SetStateAction<CustomizerState | null>>,
) {
  setState((current) => {
    if (!current) {
      return current;
    }

    const selected = new Set(current.selectedOptionIds);
    const groupSelected = selectedOptionsByGroup(group, [...selected]);
    const isActive = selected.has(option.id);

    if (isActive) {
      selected.delete(option.id);
    } else {
      if (group.maxSelections === 1) {
        for (const selectedOption of groupSelected) {
          selected.delete(selectedOption.id);
        }
      } else if (groupSelected.length >= group.maxSelections) {
        return current;
      }

      selected.add(option.id);
    }

    return {
      ...current,
      selectedOptionIds: [...selected],
    };
  });
}

export function CustomizationModal({
  state,
  setState,
  error,
  language,
  theme,
  onClose,
  onAdd,
}: {
  state: CustomizerState;
  setState: Dispatch<SetStateAction<CustomizerState | null>>;
  error: string | null;
  language: Language;
  theme: ThemeConfig;
  onClose: () => void;
  onAdd: () => void;
}) {
  const copy = t(language);
  const selectedOptions = findSelectedOptions(state.item, state.selectedOptionIds);
  const total = itemUnitPrice(state.item, state.selectedOptionIds) * state.quantity;

  return (
    <ModalShell theme={theme} onClose={onClose}>
      <div className="space-y-5">
        <div className="flex gap-4">
          {state.item.image ? (
            <img
              src={state.item.image}
              alt={localizeName(state.item, language)}
              className="h-24 w-24 rounded-[20px] object-cover"
            />
          ) : (
            <div className="h-24 w-24 rounded-[20px] bg-white/20" />
          )}
          <div className="min-w-0">
            <p className={`text-xs font-bold uppercase tracking-[0.18em] ${theme.muted}`}>
              {copy.customize}
            </p>
            <h3 className="mt-1 text-3xl font-semibold">{localizeName(state.item, language)}</h3>
            <p className="mt-2 font-bold">{formatMoney(total)}</p>
          </div>
        </div>

        {(state.item.modifierGroups ?? []).map((group) => {
          const selected = selectedOptionsByGroup(group, state.selectedOptionIds);
          return (
            <div key={group.id} className={`rounded-[24px] border p-4 ${theme.panelSoft} ${theme.border}`}>
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <h4 className="font-semibold">{localizeName(group, language)}</h4>
                  <p className={`text-xs ${theme.muted}`}>
                    {group.required ? copy.required : copy.optional} - {copy.chooseUpTo} {group.maxSelections}
                  </p>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${theme.chip}`}>
                  {selected.length}/{group.maxSelections}
                </span>
              </div>

              <div className="space-y-2">
                {group.options.map((option) => {
                  const active = state.selectedOptionIds.includes(option.id);
                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => toggleGroupOption(group, option, setState)}
                      className={`flex w-full items-center justify-between rounded-[20px] border px-4 py-3 text-left ${
                        active
                          ? `${theme.accent} ${theme.accentText}`
                          : `${theme.panel} ${theme.border}`
                      }`}
                    >
                      <span>
                        <span className="block font-semibold">{localizeName(option, language)}</span>
                        {localizeDescription(option, language) ? (
                          <span className="block text-xs opacity-80">
                            {localizeDescription(option, language)}
                          </span>
                        ) : null}
                      </span>
                      <span className="font-semibold">
                        {option.priceDelta > 0
                          ? `+${formatMoney(option.priceDelta)}`
                          : copy.modifierIncluded}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}

        {selectedOptions.length ? (
          <div className={`rounded-[24px] border p-4 ${theme.panelSoft} ${theme.border}`}>
            <p className="font-semibold">{copy.selectOptions}</p>
            <p className={`mt-2 text-sm ${theme.muted}`}>
              {selectedOptions.map((option) => localizeName(option, language)).join(' | ')}
            </p>
          </div>
        ) : null}

        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold">{copy.total}</p>
            <p className={`text-xs ${theme.muted}`}>{copy.kitchenNote}</p>
          </div>
          <QuantityControl
            value={state.quantity}
            onChange={(delta) =>
              setState((current) =>
                current
                  ? {
                      ...current,
                      quantity: Math.max(1, current.quantity + delta),
                    }
                  : current,
              )
            }
            theme={theme}
          />
        </div>

        <textarea
          value={state.notes}
          onChange={(event) =>
            setState((current) => (current ? { ...current, notes: event.target.value } : current))
          }
          placeholder={copy.notePlaceholder}
          className="min-h-28 w-full rounded-[24px] border border-white/20 bg-white/80 p-4 text-sm text-slate-900 outline-none"
        />

        {error ? <p className="text-sm text-red-600">{error}</p> : null}

        <button
          type="button"
          onClick={onAdd}
          className={`w-full rounded-full px-5 py-4 font-bold ${theme.accent} ${theme.accentText}`}
        >
          {copy.addToCart}
        </button>
      </div>
    </ModalShell>
  );
}
