import type {
  MenuDTO,
  MenuItemDTO,
  ModifierGroupDTO,
  ModifierOptionDTO,
} from '@repo/shared-types';

export type LocalizedDraft = {
  name: string;
  nameAr: string;
  nameEn: string;
  nameFr: string;
  description: string;
  descriptionAr: string;
  descriptionEn: string;
  descriptionFr: string;
};

export type MenuDraft = {
  nameAr: string;
  nameEn: string;
  nameFr: string;
  descriptionAr: string;
  descriptionEn: string;
  descriptionFr: string;
  image: string;
  themeKey: string;
};

export type ItemDraft = LocalizedDraft & {
  menuId: string;
  price: string;
  image: string;
};

export type GroupDraft = {
  name: string;
  nameAr: string;
  nameEn: string;
  nameFr: string;
  required: boolean;
  minSelections: string;
  maxSelections: string;
};

export type OptionDraft = {
  name: string;
  nameAr: string;
  nameEn: string;
  nameFr: string;
  priceDelta: string;
};

export type MenuWorkflowMode = 'add' | 'edit';
export type MenuWorkspaceSection = 'menus' | 'items' | 'modifiers' | 'themes' | 'recipe';
export type MenuEditorTab = 'general' | 'translations' | 'images';
export type TranslationPanelLanguage = 'ar' | 'en' | 'fr';
export type ModifierMenuFilter = string;

export type MenuScreenProps = {
  initialWorkflowMode?: MenuWorkflowMode;
  initialSection?: MenuWorkspaceSection;
  lockWorkflowMode?: boolean;
  lockSection?: boolean;
  title?: string;
  subtitle?: string;
};

export type LocalizationTarget =
  | Pick<MenuDTO, 'name' | 'nameAr' | 'nameEn' | 'nameFr'>
  | Pick<MenuItemDTO, 'name' | 'nameAr' | 'nameEn' | 'nameFr'>
  | Pick<ModifierGroupDTO, 'name' | 'nameAr' | 'nameEn' | 'nameFr'>
  | Pick<ModifierOptionDTO, 'name' | 'nameAr' | 'nameEn' | 'nameFr'>;

export type DraftWithLanguages = {
  nameAr: string;
  nameEn: string;
  nameFr: string;
};

export type LanguageKey = 'en' | 'fr' | 'ar';
