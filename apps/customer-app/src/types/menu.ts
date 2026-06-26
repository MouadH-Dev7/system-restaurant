import type { MenuDTO, MenuItemDTO } from '@repo/shared-types';

export type Language = 'ar' | 'fr' | 'en';

export type LocalizedEntity = {
  name?: string | null;
  nameEn?: string | null;
  nameFr?: string | null;
  nameAr?: string | null;
  optionName?: string | null;
  optionNameEn?: string | null;
  optionNameFr?: string | null;
  optionNameAr?: string | null;
  description?: string | null;
  descriptionEn?: string | null;
  descriptionFr?: string | null;
  descriptionAr?: string | null;
};

export type Menu = MenuDTO;
export type MenuItem = MenuItemDTO;
