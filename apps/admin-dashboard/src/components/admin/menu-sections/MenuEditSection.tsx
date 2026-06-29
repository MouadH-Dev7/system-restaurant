'use client';

import { Save, Trash2 } from 'lucide-react';
import type { MenuDTO } from '@repo/shared-types';
import { useI18n } from '@/hooks/use-i18n';
import type { MenuDraft, TranslationPanelLanguage } from '../menu-types';
import { themePresets } from '../menu-helpers';
import {
  TextField,
  TextAreaField,
  SimpleImagePreview,
  ThemePresetCard,
} from '../menu-primitives';

type MenuEditSectionProps = {
  draft: MenuDraft;
  onDraftChange: (draft: MenuDraft | ((prev: MenuDraft) => MenuDraft)) => void;
  activeLang: TranslationPanelLanguage;
  saving: boolean;
  isFocusedMenuRoute: boolean;
  selectedMenu: MenuDTO | null;
  onSave: () => void;
  onArchive: () => void;
};

function getNameValue(draft: MenuDraft, lang: TranslationPanelLanguage) {
  if (lang === 'ar') return draft.nameAr;
  if (lang === 'en') return draft.nameEn;
  return draft.nameFr;
}

function getDescValue(draft: MenuDraft, lang: TranslationPanelLanguage) {
  if (lang === 'ar') return draft.descriptionAr;
  if (lang === 'en') return draft.descriptionEn;
  return draft.descriptionFr;
}

export function MenuEditSection({
  draft,
  onDraftChange,
  activeLang,
  saving,
  isFocusedMenuRoute,
  selectedMenu,
  onSave,
  onArchive,
}: MenuEditSectionProps) {
  const { t } = useI18n();
  const langDisplay: Record<string, string> = { ar: 'العربية', en: 'English', fr: 'Français' };

  if (!selectedMenu) {
    return (
      <div className="mt-4 rounded-[28px] border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-slate-500">
        {t('menu.createFirstMenu')}
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
            <h3>{t('menu.menuDetails')}</h3>
            <p>{t('menu.menuDetailsSubtitle')}</p>
          </div>
        </div>
      </div>
      <div className="menu-create-divider" />
      <div className="menu-create-body">
        <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
            {t('menu.localizedNames')}
          </p>
          <div className="mt-3">
            <TextField
              label={`${t('menu.menuName')} (${langDisplay[activeLang]})`}
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

        <div className="menu-create-section">
          <p className="menu-create-section-label">{t('menu.themeKey')}</p>
          <div className="menu-create-theme-grid">
            {themePresets.map((theme) => (
              <ThemePresetCard
                key={theme.key}
                active={draft.themeKey === theme.key}
                title={theme.title}
                description={theme.description}
                accentClass={theme.accentClass}
                onClick={() =>
                  onDraftChange((current) => ({ ...current, themeKey: theme.key }))
                }
              />
            ))}
          </div>
        </div>

        <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
            {t('menu.localizedDescriptions')}
          </p>
          <div className="mt-3">
            <TextAreaField
              label={`${t('menu.menuDescription')} (${langDisplay[activeLang]})`}
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

        <div className="menu-create-footer">
          <button
            type="button"
            className="menu-create-submit-btn"
            disabled={saving}
            onClick={onSave}
          >
            <Save size={18} />
            <span>{t('menu.saveMenu')}</span>
          </button>
          <button
            type="button"
            className="ghost-btn text-rose-600 mt-3"
            disabled={saving}
            onClick={onArchive}
          >
            <Trash2 size={16} />
            <span>{t('menu.deleteMenu')}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
