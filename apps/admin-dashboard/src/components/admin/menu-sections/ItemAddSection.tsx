'use client';

import { Plus } from 'lucide-react';
import type { MenuDTO } from '@repo/shared-types';
import { useI18n } from '@/hooks/use-i18n';
import type { ItemDraft, TranslationPanelLanguage } from '../menu-types';
import { localizeEntityName } from '../menu-helpers';
import {
  TextField,
  TextAreaField,
  SimpleImagePreview,
} from '../menu-primitives';

type ItemAddSectionProps = {
  draft: ItemDraft;
  onDraftChange: (draft: ItemDraft | ((prev: ItemDraft) => ItemDraft)) => void;
  menus: MenuDTO[];
  selectedMenuId: string | null;
  onSelectedMenuIdChange: (id: string | null) => void;
  activeLang: TranslationPanelLanguage;
  saving: boolean;
  onSave: () => void;
};

function getNameValue(draft: ItemDraft, lang: TranslationPanelLanguage) {
  if (lang === 'ar') return draft.nameAr;
  if (lang === 'en') return draft.nameEn;
  return draft.nameFr;
}

function getDescValue(draft: ItemDraft, lang: TranslationPanelLanguage) {
  if (lang === 'ar') return draft.descriptionAr;
  if (lang === 'en') return draft.descriptionEn;
  return draft.descriptionFr;
}

export function ItemAddSection({
  draft,
  onDraftChange,
  menus,
  selectedMenuId,
  onSelectedMenuIdChange,
  activeLang,
  saving,
  onSave,
}: ItemAddSectionProps) {
  const { t, language } = useI18n();
  const langDisplay: Record<string, string> = { ar: 'العربية', en: 'English', fr: 'Français' };

  return (
    <div className="panel menu-create-panel">
      <div className="panel-header">
        <div>
          <h3>{t('menu.createItem')}</h3>
          <p>{t('menu.createItemSubtitle')}</p>
        </div>
      </div>

      <div className="mt-5 grid gap-4">
        <label className="space-y-2">
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
            {t('menu.selectMenu')}
          </span>
          <select
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#cf6d43] focus:ring-2 focus:ring-[#cf6d43]/10"
            value={draft.menuId}
            onChange={(event) => {
              onDraftChange((current) => ({ ...current, menuId: event.target.value }));
              onSelectedMenuIdChange(event.target.value || null);
            }}
          >
            <option value="">{t('menu.selectMenu')}</option>
            {menus.map((menu) => (
              <option key={menu.id} value={menu.id}>
                {localizeEntityName(menu, language)}
              </option>
            ))}
          </select>
        </label>

        <TextField
          label={t('menu.price')}
          value={draft.price}
          onChange={(value) =>
            onDraftChange((current) => ({ ...current, price: value }))
          }
          type="number"
        />

        <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
            {t('menu.localizedNames')}
          </p>
          <div className="mt-3">
            <TextField
              label={`${t('menu.itemName')} (${langDisplay[activeLang]})`}
              value={getNameValue(draft, activeLang)}
              onChange={(value) => {
                if (activeLang === 'ar') onDraftChange((prev) => ({ ...prev, nameAr: value }));
                else if (activeLang === 'en') onDraftChange((prev) => ({ ...prev, nameEn: value }));
                else onDraftChange((prev) => ({ ...prev, nameFr: value }));
              }}
              className="px-5 py-4 text-base w-full"
            />
          </div>
        </div>

        <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
            {t('menu.localizedDescriptions')}
          </p>
          <div className="mt-3">
            <TextAreaField
              label={`${t('menu.description')} (${langDisplay[activeLang]})`}
              value={getDescValue(draft, activeLang)}
              onChange={(value) => {
                if (activeLang === 'ar') onDraftChange((prev) => ({ ...prev, descriptionAr: value }));
                else if (activeLang === 'en') onDraftChange((prev) => ({ ...prev, descriptionEn: value }));
                else onDraftChange((prev) => ({ ...prev, descriptionFr: value }));
              }}
              rows={4}
              className="px-5 py-4 text-base w-full"
            />
          </div>
        </div>

        <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
            {t('menu.coverImage')}
          </p>
          <div className="mt-3 flex flex-col gap-4 sm:flex-row">
            <div className="flex-1">
              <TextField
                label={t('menu.coverImage')}
                value={draft.image}
                onChange={(value) =>
                  onDraftChange((current) => ({ ...current, image: value }))
                }
                placeholder="https://example.com/image.jpg"
                className="px-5 py-4 text-base w-full"
              />
            </div>
            <div className="w-full sm:w-48 shrink-0">
              <SimpleImagePreview src={draft.image} emptyLabel={t('menu.noImage')} />
            </div>
          </div>
        </div>
      </div>

      <button
        type="button"
        className="primary-btn mt-4"
        disabled={saving}
        onClick={onSave}
      >
        <Plus size={16} />
        <span>{t('menu.createItem')}</span>
      </button>
    </div>
  );
}
