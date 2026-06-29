import type { MenuDTO, MenuItemDTO, ModifierGroupDTO, ModifierOptionDTO } from '@repo/shared-types';
import type { LanguageKey, LocalizationTarget, MenuDraft, ItemDraft, GroupDraft, OptionDraft } from './menu-types';

export const themePresets = [
  {
    key: 'american',
    title: 'American Grill',
    description: 'Bold hero, burger-focused, strong contrast.',
    accentClass: 'from-amber-100 via-orange-100 to-rose-100',
  },
  {
    key: 'french',
    title: 'French Bistro',
    description: 'Elegant typography, softer palette, premium dining feel.',
    accentClass: 'from-stone-100 via-amber-50 to-yellow-100',
  },
  {
    key: 'local',
    title: 'Local Dining',
    description: 'Warm presentation tuned for local plates and family tables.',
    accentClass: 'from-emerald-100 via-lime-50 to-orange-100',
  },
];

export const emptyMenuDraft: MenuDraft = {
  nameAr: '',
  nameEn: '',
  nameFr: '',
  descriptionAr: '',
  descriptionEn: '',
  descriptionFr: '',
  image: '',
  themeKey: themePresets[0]?.key ?? '',
};

export const emptyItemDraft: ItemDraft = {
  menuId: '',
  name: '',
  nameAr: '',
  nameEn: '',
  nameFr: '',
  description: '',
  descriptionAr: '',
  descriptionEn: '',
  descriptionFr: '',
  price: '',
  image: '',
};

export const emptyGroupDraft: GroupDraft = {
  name: '',
  nameAr: '',
  nameEn: '',
  nameFr: '',
  required: false,
  minSelections: '0',
  maxSelections: '1',
};

export const emptyOptionDraft: OptionDraft = {
  name: '',
  nameAr: '',
  nameEn: '',
  nameFr: '',
  priceDelta: '0',
};

export function toNumber(value: string, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function optionalText(value: string) {
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

export function resolvePrimaryName(draft: Pick<MenuDraft, 'nameAr' | 'nameEn' | 'nameFr'>) {
  return (
    draft.nameAr.trim() ||
    draft.nameEn.trim() ||
    draft.nameFr.trim()
  );
}

export function resolvePrimaryDescription(
  draft: Pick<MenuDraft, 'descriptionAr' | 'descriptionEn' | 'descriptionFr'>,
) {
  return (
    draft.descriptionAr.trim() ||
    draft.descriptionEn.trim() ||
    draft.descriptionFr.trim()
  );
}

export function localizeEntityName(
  entity: LocalizationTarget,
  language: LanguageKey,
) {
  const preferred =
    language === 'ar'
      ? entity.nameAr
      : language === 'fr'
        ? entity.nameFr
        : entity.nameEn;

  return (
    preferred?.trim() ||
    entity.nameEn?.trim() ||
    entity.nameAr?.trim() ||
    entity.nameFr?.trim() ||
    entity.name
  );
}

export function toMenuDraft(menu: MenuDTO | null): MenuDraft {
  if (!menu) {
    return emptyMenuDraft;
  }

  return {
    nameAr: menu.nameAr ?? '',
    nameEn: menu.nameEn ?? '',
    nameFr: menu.nameFr ?? '',
    descriptionAr: menu.descriptionAr ?? '',
    descriptionEn: menu.descriptionEn ?? '',
    descriptionFr: menu.descriptionFr ?? '',
    image: menu.image ?? '',
    themeKey: menu.themeKey ?? '',
  };
}

export function toItemDraft(item: MenuItemDTO | null, fallbackMenuId = ''): ItemDraft {
  if (!item) {
    return { ...emptyItemDraft, menuId: fallbackMenuId };
  }

  return {
    menuId: item.menuId,
    name: item.name,
    nameAr: item.nameAr ?? '',
    nameEn: item.nameEn ?? '',
    nameFr: item.nameFr ?? '',
    description: item.description ?? '',
    descriptionAr: item.descriptionAr ?? '',
    descriptionEn: item.descriptionEn ?? '',
    descriptionFr: item.descriptionFr ?? '',
    price: String(item.price),
    image: item.image ?? '',
  };
}

export function toGroupDraft(group: ModifierGroupDTO): GroupDraft {
  return {
    name: group.name,
    nameAr: group.nameAr ?? '',
    nameEn: group.nameEn ?? '',
    nameFr: group.nameFr ?? '',
    required: group.required,
    minSelections: String(group.minSelections),
    maxSelections: String(group.maxSelections),
  };
}

export function toOptionDraft(option: ModifierOptionDTO): OptionDraft {
  return {
    name: option.name,
    nameAr: option.nameAr ?? '',
    nameEn: option.nameEn ?? '',
    nameFr: option.nameFr ?? '',
    priceDelta: String(option.priceDelta),
  };
}
