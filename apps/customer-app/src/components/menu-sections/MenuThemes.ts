import type { ModifierGroupDTO, ModifierOptionDTO } from '@repo/shared-types';
import { localizeName, t } from '@/lib/i18n';
import type { Language, Menu, MenuItem } from '@/types/menu';

export type ThemeConfig = {
  page: string;
  ink: string;
  panel: string;
  panelSoft: string;
  border: string;
  muted: string;
  accent: string;
  accentText: string;
  chip: string;
  shadow: string;
  heroFallback: string;
};

export type ThemeKey = 'american' | 'french' | 'local' | 'default';

export const themeMap: Record<ThemeKey, ThemeConfig> = {
  american: {
    page: 'bg-[radial-gradient(circle_at_top,_#6f1d1b,_#1b0f12_55%)]',
    ink: 'text-white',
    panel: 'bg-white/10 backdrop-blur-xl',
    panelSoft: 'bg-black/30 backdrop-blur-xl',
    border: 'border-white/15',
    muted: 'text-white/75',
    accent: 'bg-[#ffcc48]',
    accentText: 'text-[#2a1606]',
    chip: 'bg-[#ffcc48]/20 text-[#ffe8a3]',
    shadow: 'shadow-[0_24px_80px_rgba(0,0,0,0.28)]',
    heroFallback:
      'https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=1400&q=85',
  },
  french: {
    page: 'bg-[radial-gradient(circle_at_top,_#f7e8c7,_#e3c389_38%,_#5a3d24_100%)]',
    ink: 'text-[#2b2118]',
    panel: 'bg-[#fff8ee]/88 backdrop-blur-xl',
    panelSoft: 'bg-[#fff6e8]/76 backdrop-blur-xl',
    border: 'border-[#9b7c4f]/24',
    muted: 'text-[#705c47]',
    accent: 'bg-[#af7b2f]',
    accentText: 'text-[#fff9ef]',
    chip: 'bg-[#f0dfbf] text-[#6b4d22]',
    shadow: 'shadow-[0_24px_70px_rgba(74,47,15,0.18)]',
    heroFallback:
      'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=1400&q=85',
  },
  local: {
    page: 'bg-[radial-gradient(circle_at_top,_#c78644,_#5a3220_42%,_#183024_100%)]',
    ink: 'text-[#fff7ea]',
    panel: 'bg-[#173528]/82 backdrop-blur-xl',
    panelSoft: 'bg-[#0f241c]/72 backdrop-blur-xl',
    border: 'border-[#e4b16d]/24',
    muted: 'text-[#ffe6be]/76',
    accent: 'bg-[#df9d56]',
    accentText: 'text-[#213126]',
    chip: 'bg-[#2f5e49] text-[#ffebc8]',
    shadow: 'shadow-[0_24px_80px_rgba(12,32,24,0.34)]',
    heroFallback:
      'https://images.unsplash.com/photo-1541518763669-27fef04b14ea?auto=format&fit=crop&w=1400&q=85',
  },
  default: {
    page: 'bg-[radial-gradient(circle_at_top,_#f2e6d6,_#d5b690_45%,_#514030_100%)]',
    ink: 'text-[#2d241d]',
    panel: 'bg-white/84 backdrop-blur-xl',
    panelSoft: 'bg-white/72 backdrop-blur-xl',
    border: 'border-[#b69976]/22',
    muted: 'text-[#6a5a49]',
    accent: 'bg-[#8d6034]',
    accentText: 'text-[#fff8ef]',
    chip: 'bg-[#efe0cb] text-[#63472d]',
    shadow: 'shadow-[0_24px_70px_rgba(60,41,22,0.16)]',
    heroFallback:
      'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1400&q=85',
  },
};

export function resolveTheme(menu: Menu | null): ThemeConfig {
  const key = `${menu?.themeKey ?? ''} ${menu?.name ?? ''} ${menu?.nameEn ?? ''}`.toLowerCase();

  if (key.includes('amer') || key.includes('burger')) {
    return themeMap.american;
  }
  if (key.includes('fr') || key.includes('bistro')) {
    return themeMap.french;
  }
  if (key.includes('local') || key.includes('trad') || key.includes('moroccan')) {
    return themeMap.local;
  }

  return themeMap.default;
}

export function defaultSelectionForItem(item: MenuItem) {
  return (item.modifierGroups ?? []).flatMap((group) =>
    group.options.filter((option) => option.isDefault).map((option) => option.id),
  );
}

export function selectedOptionsByGroup(group: ModifierGroupDTO, selectedIds: string[]) {
  const selected = new Set(selectedIds);
  return group.options.filter((option) => selected.has(option.id));
}

export function findSelectedOptions(item: MenuItem, selectedOptionIds: string[]) {
  const selected = new Set(selectedOptionIds);
  return (item.modifierGroups ?? []).flatMap((group) =>
    group.options.filter((option) => selected.has(option.id)),
  );
}

export function validateCustomization(item: MenuItem, selectedOptionIds: string[], language: Language) {
  const copy = t(language);

  for (const group of item.modifierGroups ?? []) {
    const selected = selectedOptionsByGroup(group, selectedOptionIds);

    if (group.required && selected.length === 0) {
      return `${copy.chooseAtLeast} 1 - ${localizeName(group, language)}`;
    }

    if (selected.length < group.minSelections) {
      return `${copy.chooseAtLeast} ${group.minSelections} - ${localizeName(group, language)}`;
    }

    if (selected.length > group.maxSelections) {
      return `${copy.chooseUpTo} ${group.maxSelections} - ${localizeName(group, language)}`;
    }
  }

  return null;
}

export function itemUnitPrice(item: MenuItem, selectedOptionIds: string[]) {
  const options = findSelectedOptions(item, selectedOptionIds);
  return item.price + options.reduce((sum, option) => sum + option.priceDelta, 0);
}
