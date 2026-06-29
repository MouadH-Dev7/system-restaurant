'use client';

import { Save, Trash2 } from 'lucide-react';
import type { MenuDTO, MenuItemDTO } from '@repo/shared-types';
import { useI18n } from '@/hooks/use-i18n';
import type { ItemDraft, TranslationPanelLanguage } from '../menu-types';
import { localizeEntityName } from '../menu-helpers';
import {
  TextField,
  TextAreaField,
  SimpleImagePreview,
  SelectionCard,
  EmptyStateCard,
} from '../menu-primitives';

type ItemEditSectionProps = {
  draft: ItemDraft;
  onDraftChange: (draft: ItemDraft | ((prev: ItemDraft) => ItemDraft)) => void;
  menus: MenuDTO[];
  selectedMenuId: string | null;
  onSelectedMenuIdChange: (id: string | null) => void;
  activeLang: TranslationPanelLanguage;
  saving: boolean;
  selectedItem: MenuItemDTO | null;
  onSave: () => void;
  onArchive: () => void;
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

export function ItemEditSection({
  draft,
  onDraftChange,
  menus,
  selectedMenuId,
  onSelectedMenuIdChange,
  activeLang,
  saving,
  selectedItem,
  onSave,
  onArchive,
}: ItemEditSectionProps) {
  const { t, language } = useI18n();
  const langDisplay: Record<string, string> = { ar: 'العربية', en: 'English', fr: 'Français' };

  if (!selectedItem) {
    return (
      <div className="mt-4 rounded-[28px] border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-slate-500">
        {t('menu.selectItemPrompt')}
      </div>
    );
  }

  return (
    <div className="panel menu-editor-panel menu-create-centered">
      <div className="panel-header menu-create-header">
        <div className="menu-create-header-icon">
          <div className="menu-create-icon-circle">
            <Save size={22} />
          </div>
          <div>
            <h3>{t('menu.itemDetails')}</h3>
            <p>{t('menu.itemDetailsSubtitle')}</p>
          </div>
        </div>
      </div>
      <div className="menu-create-divider" />
      <div className="menu-create-body">
        <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
            {t('menu.selectMenu')}
          </p>
          <div className="mt-3 max-h-48 space-y-2 overflow-y-auto rounded-2xl border border-slate-200 bg-white p-2">
            {menus.length ? (
              menus.map((menu) => (
                <SelectionCard
                  key={menu.id}
                  active={menu.id === draft.menuId}
                  title={localizeEntityName(menu, language)}
                  subtitle={t('menu.itemsCount')}
                  imageSrc={menu.image}
                  onClick={() => {
                    onDraftChange((current) => ({ ...current, menuId: menu.id }));
                    onSelectedMenuIdChange(menu.id);
                  }}
                  focused={false}
                />
              ))
            ) : (
              <EmptyStateCard message={t('menu.noMenus')} />
            )}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <TextField
            label={t('menu.price')}
            value={draft.price}
            onChange={(value) =>
              onDraftChange((current) => ({ ...current, price: value }))
            }
            type="number"
            className="px-5 py-4 text-base w-full"
          />
        </div>

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

        <div className="flex w-full items-center justify-end gap-3 border-t border-slate-100 pt-6">
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-5 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-100 disabled:opacity-50"
            disabled={saving}
            onClick={onArchive}
          >
            <Trash2 size={16} />
            <span>{t('menu.deleteItem')}</span>
          </button>
          <button
            type="button"
            className="menu-create-submit-btn"
            disabled={saving}
            onClick={onSave}
          >
            <Save size={18} />
            <span>{t('menu.saveItem')}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
