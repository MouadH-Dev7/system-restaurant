'use client';

import { Plus } from 'lucide-react';
import type { MenuDTO } from '@repo/shared-types';
import { useI18n } from '@/hooks/use-i18n';
import type { MenuDraft, TranslationPanelLanguage, LanguageKey } from '../menu-types';
import { themePresets, localizeEntityName } from '../menu-helpers';
import {
  TextField,
  TextAreaField,
  SimpleImagePreview,
  TranslationFields,
  ThemePresetCard,
  SelectionCard,
  EmptyStateCard,
} from '../menu-primitives';

type MenuAddSectionProps = {
  draft: MenuDraft;
  onDraftChange: (draft: MenuDraft | ((prev: MenuDraft) => MenuDraft)) => void;
  activeLang: TranslationPanelLanguage;
  saving: boolean;
  isFocusedMenuRoute: boolean;
  onSave: () => void;
  menus?: MenuDTO[];
  itemCountByMenu?: Map<string, number>;
  selectedMenuId?: string | null;
  onSelectedMenuIdChange?: (id: string | null) => void;
  language?: LanguageKey;
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

export function MenuAddSection({
  draft,
  onDraftChange,
  activeLang,
  saving,
  isFocusedMenuRoute,
  onSave,
  menus,
  itemCountByMenu,
  selectedMenuId,
  onSelectedMenuIdChange,
  language,
}: MenuAddSectionProps) {
  const { t } = useI18n();
  const langDisplay: Record<string, string> = { ar: 'العربية', en: 'English', fr: 'Français' };

  if (!isFocusedMenuRoute) {
    return (
      <div className="panel menu-create-panel">
        <div className="panel-header">
          <div>
            <h3>{t('menu.createMenu')}</h3>
            <p>{t('menu.createMenuSubtitle')}</p>
          </div>
        </div>

        <div className="mt-5 grid gap-4">
          <TranslationFields title={t('menu.localizedNames')}>
            <TextField
              label={t('menu.menuNameAr')}
              value={draft.nameAr}
              onChange={(value) =>
                onDraftChange((current) => ({ ...current, nameAr: value }))
              }
              className="px-5 py-4 text-base"
            />
            <TextField
              label={t('menu.menuNameEn')}
              value={draft.nameEn}
              onChange={(value) =>
                onDraftChange((current) => ({ ...current, nameEn: value }))
              }
              className="px-5 py-4 text-base"
            />
            <TextField
              label={t('menu.menuNameFr')}
              value={draft.nameFr}
              onChange={(value) =>
                onDraftChange((current) => ({ ...current, nameFr: value }))
              }
              className="px-5 py-4 text-base"
            />
          </TranslationFields>

          <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              {t('menu.themeKey')}
            </p>
            <div className="mt-3 grid gap-3 md:grid-cols-3">
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

          <TranslationFields title={t('menu.localizedDescriptions')}>
            <TextAreaField
              label={t('menu.menuDescriptionAr')}
              value={draft.descriptionAr}
              onChange={(value) =>
                onDraftChange((current) => ({ ...current, descriptionAr: value }))
              }
              rows={4}
              className="px-5 py-4 text-base"
            />
            <TextAreaField
              label={t('menu.menuDescriptionEn')}
              value={draft.descriptionEn}
              onChange={(value) =>
                onDraftChange((current) => ({ ...current, descriptionEn: value }))
              }
              rows={4}
              className="px-5 py-4 text-base"
            />
            <TextAreaField
              label={t('menu.menuDescriptionFr')}
              value={draft.descriptionFr}
              onChange={(value) =>
                onDraftChange((current) => ({ ...current, descriptionFr: value }))
              }
              rows={4}
              className="px-5 py-4 text-base"
            />
          </TranslationFields>
        </div>

        <button
          type="button"
          className="primary-btn mt-4 menu-route-focus-inline-actions"
          disabled={saving}
          onClick={onSave}
        >
          <Plus size={16} />
          <span>{t('menu.createMenu')}</span>
        </button>
      </div>
    );
  }

  return (
    <div className="flex gap-6">
      {menus && itemCountByMenu && onSelectedMenuIdChange && language ? (
        <div className="panel menu-editor-panel w-72 shrink-0">
          <div className="panel-header">
            <div>
              <h3>{t('menu.menuCatalog')}</h3>
              <p>{t('menu.menuCatalogSubtitle')}</p>
            </div>
          </div>
          <div className="menu-selection-list mt-5 space-y-3">
            {menus.length ? (
              menus.map((menu) => (
                <SelectionCard
                  key={menu.id}
                  active={menu.id === selectedMenuId}
                  title={localizeEntityName(menu, language)}
                  subtitle={`${itemCountByMenu.get(menu.id) ?? 0} ${t('menu.itemsCount')}`}
                  caption={menu.themeKey || t('menu.noThemeKey')}
                  imageSrc={menu.image}
                  onClick={() => onSelectedMenuIdChange(menu.id)}
                  focused={isFocusedMenuRoute}
                />
              ))
            ) : (
              <EmptyStateCard message={t('menu.noMenus')} />
            )}
          </div>
        </div>
      ) : null}
      <div className="panel menu-editor-panel menu-create-centered flex-1">
        <div className="panel-header menu-create-header">
          <div className="menu-create-header-icon">
            <div className="menu-create-icon-circle">
              <Plus size={22} />
            </div>
            <div>
              <h3>{t('menu.createMenu')}</h3>
              <p>{t('menu.createMenuSubtitle')}</p>
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
              <Plus size={18} />
              <span>{t('menu.createMenu')}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
