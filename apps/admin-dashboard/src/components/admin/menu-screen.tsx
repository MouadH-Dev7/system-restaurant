'use client';

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { AlertCircle, ArrowLeft, Plus, RefreshCw, Save, Trash2 } from 'lucide-react';
import type {
  MenuDTO,
  MenuItemDTO,
  ModifierGroupDTO,
  ModifierOptionDTO,
} from '@repo/shared-types';
import { getApiErrorMessage } from '@/lib/api-error';
import { useI18n } from '@/hooks/use-i18n';
import { useAppStore } from '@/store/app.store';
import {
  archiveMenu,
  archiveMenuItem,
  archiveModifierOption,
  createMenu,
  createMenuItem,
  createModifierGroup,
  createModifierOption,
  deleteModifierGroup,
  listMenuItems,
  listMenus,
  updateMenu,
  updateMenuItem,
  updateModifierGroup,
  updateModifierOption,
} from '@/services/menu.service';

type LocalizedDraft = {
  name: string;
  nameAr: string;
  nameEn: string;
  nameFr: string;
  description: string;
  descriptionAr: string;
  descriptionEn: string;
  descriptionFr: string;
};

type MenuDraft = {
  nameAr: string;
  nameEn: string;
  nameFr: string;
  descriptionAr: string;
  descriptionEn: string;
  descriptionFr: string;
  image: string;
  themeKey: string;
};

type ItemDraft = LocalizedDraft & {
  menuId: string;
  price: string;
  image: string;
};

type GroupDraft = {
  name: string;
  nameAr: string;
  nameEn: string;
  nameFr: string;
  required: boolean;
  minSelections: string;
  maxSelections: string;
};

type OptionDraft = {
  name: string;
  nameAr: string;
  nameEn: string;
  nameFr: string;
  priceDelta: string;
};

type MenuWorkflowMode = 'add' | 'edit';
type MenuWorkspaceSection = 'menus' | 'items' | 'modifiers' | 'themes';
type MenuEditorTab = 'general' | 'translations' | 'images';
type TranslationPanelLanguage = 'ar' | 'en' | 'fr';
type ModifierMenuFilter = string;

type MenuScreenProps = {
  initialWorkflowMode?: MenuWorkflowMode;
  initialSection?: MenuWorkspaceSection;
  lockWorkflowMode?: boolean;
  lockSection?: boolean;
  title?: string;
  subtitle?: string;
};

const themePresets = [
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

const emptyMenuDraft: MenuDraft = {
  nameAr: '',
  nameEn: '',
  nameFr: '',
  descriptionAr: '',
  descriptionEn: '',
  descriptionFr: '',
  image: '',
  themeKey: themePresets[0]?.key ?? '',
};

const emptyItemDraft: ItemDraft = {
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

const emptyGroupDraft: GroupDraft = {
  name: '',
  nameAr: '',
  nameEn: '',
  nameFr: '',
  required: false,
  minSelections: '0',
  maxSelections: '1',
};

const emptyOptionDraft: OptionDraft = {
  name: '',
  nameAr: '',
  nameEn: '',
  nameFr: '',
  priceDelta: '0',
};

function toNumber(value: string, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function optionalText(value: string) {
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function resolvePrimaryMenuName(draft: Pick<MenuDraft, 'nameAr' | 'nameEn' | 'nameFr'>) {
  return (
    draft.nameAr.trim() ||
    draft.nameEn.trim() ||
    draft.nameFr.trim()
  );
}

function resolvePrimaryMenuDescription(
  draft: Pick<MenuDraft, 'descriptionAr' | 'descriptionEn' | 'descriptionFr'>,
) {
  return (
    draft.descriptionAr.trim() ||
    draft.descriptionEn.trim() ||
    draft.descriptionFr.trim()
  );
}

function localizeEntityName(
  entity:
    | Pick<MenuDTO, 'name' | 'nameAr' | 'nameEn' | 'nameFr'>
    | Pick<MenuItemDTO, 'name' | 'nameAr' | 'nameEn' | 'nameFr'>
    | Pick<ModifierGroupDTO, 'name' | 'nameAr' | 'nameEn' | 'nameFr'>
    | Pick<ModifierOptionDTO, 'name' | 'nameAr' | 'nameEn' | 'nameFr'>,
  language: 'en' | 'fr' | 'ar',
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

function toMenuDraft(menu: MenuDTO | null): MenuDraft {
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

function toItemDraft(item: MenuItemDTO | null, fallbackMenuId = ''): ItemDraft {
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

function toGroupDraft(group: ModifierGroupDTO): GroupDraft {
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

function toOptionDraft(option: ModifierOptionDTO): OptionDraft {
  return {
    name: option.name,
    nameAr: option.nameAr ?? '',
    nameEn: option.nameEn ?? '',
    nameFr: option.nameFr ?? '',
    priceDelta: String(option.priceDelta),
  };
}

function TextField({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
  className = '',
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: 'text' | 'number';
  className?: string;
}) {
  return (
    <label className="block space-y-1">
      <span className="block text-sm font-medium text-slate-500 mb-1">
        {label}
      </span>
      <input
        type={type}
        className={`w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-[var(--admin-primary)] focus:ring-2 focus:ring-[var(--admin-primary)]/10 ${className}`}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

function TextAreaField({
  label,
  value,
  onChange,
  placeholder,
  rows = 4,
  className = '',
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  className?: string;
}) {
  return (
    <label className="block space-y-1">
      <span className="block text-sm font-medium text-slate-500 mb-1">
        {label}
      </span>
      <textarea
        rows={rows}
        className={`w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-[var(--admin-primary)] focus:ring-2 focus:ring-[var(--admin-primary)]/10 ${className}`}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

function ImagePreview({
  label,
  src,
  emptyLabel,
}: {
  label: string;
  src: string | null | undefined;
  emptyLabel: string;
}) {
  const normalized = src?.trim();

  return (
    <div className="rounded-[28px] border border-slate-200 bg-slate-50 p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{label}</p>
      {normalized ? (
        <div className="mt-3 overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <img src={normalized} alt={label} className="h-44 w-full object-cover" />
        </div>
      ) : (
        <div className="mt-3 flex h-44 items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white text-sm text-slate-400">
          {emptyLabel}
        </div>
      )}
    </div>
  );
}

function SimpleImagePreview({ src, emptyLabel }: { src: string; emptyLabel: string }) {
  const normalized = src.trim();

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-3">
      {normalized ? (
        <div className="overflow-hidden rounded-xl border border-slate-100 bg-slate-50">
          <img src={normalized} alt="Menu preview" className="h-44 w-full object-cover" />
        </div>
      ) : (
        <div className="flex h-44 items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 text-sm text-slate-400">
          {emptyLabel}
        </div>
      )}
    </div>
  );
}


function TranslationFields({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{title}</p>
      <div className="mt-3 grid gap-3 grid-cols-1">{children}</div>
    </div>
  );
}

function TranslationLanguageSwitcher({
  activeLanguage,
  onChange,
  focused = false,
}: {
  activeLanguage: TranslationPanelLanguage;
  onChange: (language: TranslationPanelLanguage) => void;
  focused?: boolean;
}) {
  return (
    <div
      className={`flex gap-1 shadow-sm w-full sm:w-auto ${
        focused
          ? 'bg-transparent p-0 border-0'
          : 'bg-white rounded-xl p-1 border border-slate-200'
      }`}
    >
      {(
        [
          { key: 'ar', label: 'العربية' },
          { key: 'en', label: 'English' },
          { key: 'fr', label: 'Français' },
        ] as const
      ).map((entry) => (
        <button
          key={entry.key}
          type="button"
          className={`flex-1 sm:flex-initial text-center py-2 px-4 rounded-lg text-xs font-semibold transition-all ${
            activeLanguage === entry.key
              ? 'bg-[var(--admin-primary)] text-white shadow-sm'
              : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
          }`}
          onClick={() => onChange(entry.key)}
        >
          {entry.label}
        </button>
      ))}
    </div>
  );
}

function TranslationPane({
  activeLanguage,
  children,
}: {
  activeLanguage: TranslationPanelLanguage;
  children: Partial<Record<TranslationPanelLanguage, ReactNode>>;
}) {
  return <>{children[activeLanguage] ?? null}</>;
}

function TabButton({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className={`rounded-full px-4 py-2 text-xs font-semibold transition ${
        active
          ? 'bg-[#cf6d43] text-white shadow-sm'
          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
      }`}
      onClick={onClick}
    >
      {label}
    </button>
  );
}

function EmptyStateCard({ message }: { message: string }) {
  return (
    <div className="menu-empty-card rounded-[28px] border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-500">
      {message}
    </div>
  );
}

function SelectionCard({
  active,
  title,
  subtitle,
  caption,
  imageSrc,
  onClick,
  focused = false,
}: {
  active: boolean;
  title: string;
  subtitle: string;
  caption?: string;
  imageSrc?: string | null;
  onClick: () => void;
  focused?: boolean;
}) {
  return (
    <button
      type="button"
      className={`menu-selection-card w-full rounded-[28px] border p-4 text-start transition ${
        active
          ? focused
            ? 'border-[var(--admin-primary)] bg-[color-mix(in_srgb,var(--admin-primary-faint)_35%,white)] shadow-sm'
            : 'border-[#cf6d43] bg-[#fff5ef] shadow-sm'
          : 'border-slate-200 bg-white hover:border-slate-300'
      }`}
      onClick={onClick}
    >
      <div className="flex items-start gap-3">
        <div className="h-16 w-16 overflow-hidden rounded-2xl border border-slate-200 bg-slate-100">
          {imageSrc ? <img src={imageSrc} alt={title} className="h-full w-full object-cover" /> : null}
        </div>
        <div className="min-w-0 flex-1">
          <h4 className="truncate font-semibold text-slate-900">{title}</h4>
          <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
          {caption ? <p className="mt-2 truncate text-xs text-slate-400">{caption}</p> : null}
        </div>
      </div>
    </button>
  );
}

function ThemePresetCard({
  active,
  title,
  description,
  accentClass,
  onClick,
}: {
  active: boolean;
  title: string;
  description: string;
  accentClass: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className={`group rounded-[28px] border p-4 text-left transition ${
        active
          ? 'border-[#cf6d43] bg-[#fff5ef] shadow-md shadow-[#cf6d43]/10'
          : 'border-slate-200 bg-white hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-sm'
      }`}
      onClick={onClick}
    >
      <div className={`rounded-[22px] bg-gradient-to-br ${accentClass} p-5`}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-lg font-semibold text-slate-900">{title}</p>
            <p className="mt-2 text-sm leading-6 text-slate-700">{description}</p>
          </div>
          <div
            className={`mt-1 h-3 w-3 rounded-full border border-white/70 ${
              active ? 'bg-[#cf6d43]' : 'bg-white/80'
            }`}
          />
        </div>
        <div className="mt-5 grid grid-cols-3 gap-2">
          <div className="h-3 rounded-full bg-white/80" />
          <div className="h-3 rounded-full bg-white/60" />
          <div className="h-3 rounded-full bg-white/40" />
        </div>
        <div className="mt-3 h-20 rounded-[18px] border border-white/70 bg-white/55 backdrop-blur-sm" />
      </div>
    </button>
  );
}

export function MenuScreen({
  initialWorkflowMode,
  initialSection,
  lockWorkflowMode = false,
  lockSection = false,
  title,
  subtitle,
}: MenuScreenProps = {}) {
  const { t, dir, language, formatCurrency } = useI18n();
  const restaurantId = useAppStore((state) => state.restaurantId);
  const [menus, setMenus] = useState<MenuDTO[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItemDTO[]>([]);
  const [selectedMenuId, setSelectedMenuId] = useState<string | null>(null);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [newMenuDraft, setNewMenuDraft] = useState<MenuDraft>(emptyMenuDraft);
  const [menuEditor, setMenuEditor] = useState<MenuDraft>(emptyMenuDraft);
  const [newItemDraft, setNewItemDraft] = useState<ItemDraft>(emptyItemDraft);
  const [itemEditor, setItemEditor] = useState<ItemDraft>(emptyItemDraft);
  const [groupDraft, setGroupDraft] = useState<GroupDraft>(emptyGroupDraft);
  const [groupEdits, setGroupEdits] = useState<Record<string, GroupDraft>>({});
  const [optionDrafts, setOptionDrafts] = useState<Record<string, OptionDraft>>({});
  const [optionEdits, setOptionEdits] = useState<Record<string, OptionDraft>>({});
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [workflowMode, setWorkflowMode] = useState<MenuWorkflowMode>(initialWorkflowMode ?? 'add');
  const [activeSection, setActiveSection] = useState<MenuWorkspaceSection>(initialSection ?? 'menus');
  const [menuEditorTab, setMenuEditorTab] = useState<MenuEditorTab>('general');
  const [translationPanelLanguage, setTranslationPanelLanguage] =
    useState<TranslationPanelLanguage>('ar');
  const [modifierMenuFilter, setModifierMenuFilter] = useState<ModifierMenuFilter>('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadMenuData() {
    const activeRestaurantId = restaurantId;

    if (!activeRestaurantId) {
      setMenus([]);
      setMenuItems([]);
      setSelectedMenuId(null);
      setSelectedItemId(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const [nextMenus, nextItems] = await Promise.all([
        listMenus(activeRestaurantId),
        listMenuItems(activeRestaurantId),
      ]);

      setMenus(nextMenus);
      setMenuItems(nextItems);
      setSelectedMenuId((current) =>
        current && nextMenus.some((menu) => menu.id === current) ? current : (nextMenus[0]?.id ?? null),
      );
      setSelectedItemId((current) =>
        current && nextItems.some((item) => item.id === current) ? current : (nextItems[0]?.id ?? null),
      );
      setNewItemDraft((current) => ({
        ...current,
        menuId:
          current.menuId && nextMenus.some((menu) => menu.id === current.menuId)
            ? current.menuId
            : (nextMenus[0]?.id ?? ''),
      }));
    } catch (nextError) {
      setError(getApiErrorMessage(nextError, t('menu.title')));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadMenuData();
  }, [restaurantId]);

  useEffect(() => {
    if (initialWorkflowMode) {
      setWorkflowMode(initialWorkflowMode);
    }
  }, [initialWorkflowMode]);

  useEffect(() => {
    if (initialSection) {
      setActiveSection(initialSection);
    }
  }, [initialSection]);

  const selectedMenu = useMemo(
    () => menus.find((menu) => menu.id === selectedMenuId) ?? null,
    [menus, selectedMenuId],
  );

  const itemsForSelectedMenu = useMemo(() => {
    if (!selectedMenuId) {
      return [];
    }

    return menuItems.filter((item) => item.menuId === selectedMenuId);
  }, [menuItems, selectedMenuId]);

  const selectedItem = useMemo(() => {
    const scopedItems = selectedMenuId ? itemsForSelectedMenu : menuItems;
    return scopedItems.find((item) => item.id === selectedItemId) ?? null;
  }, [itemsForSelectedMenu, menuItems, selectedItemId, selectedMenuId]);

  const itemCountByMenu = useMemo(() => {
    const counts = new Map<string, number>();
    for (const item of menuItems) {
      counts.set(item.menuId, (counts.get(item.menuId) ?? 0) + 1);
    }
    return counts;
  }, [menuItems]);

  const modifierMenus = useMemo(() => menus, [menus]);

  const modifierSelectedMenuItems = useMemo(() => {
    if (!modifierMenuFilter) {
      return [];
    }

    return menuItems.filter((item) => item.menuId === modifierMenuFilter);
  }, [menuItems, modifierMenuFilter]);

  const isAddMenuSection = workflowMode === 'add' && activeSection === 'menus';
  const isEditMenuSection = workflowMode === 'edit' && activeSection === 'menus';
  const isAddItemSection = workflowMode === 'add' && activeSection === 'items';
  const isEditItemSection = workflowMode === 'edit' && activeSection === 'items';
  const isModifierSection = activeSection === 'modifiers';
  const isThemeSection = workflowMode === 'edit' && activeSection === 'themes';
  const isFocusedMenuRoute = lockWorkflowMode && lockSection;
  const pageTitle = title ? t(title) : t('menu.workspaceTitle');
  const pageSubtitle = subtitle ? t(subtitle) : t('menu.workspaceSubtitle');
  useEffect(() => {
    if (!selectedMenuId) {
      setSelectedItemId(null);
      return;
    }

    setSelectedItemId((current) =>
      current && itemsForSelectedMenu.some((item) => item.id === current)
        ? current
        : (itemsForSelectedMenu[0]?.id ?? null),
    );
  }, [itemsForSelectedMenu, selectedMenuId]);

  useEffect(() => {
    setMenuEditor(toMenuDraft(selectedMenu));
  }, [selectedMenu]);

  useEffect(() => {
    setItemEditor(toItemDraft(selectedItem, selectedMenuId ?? ''));
  }, [selectedItem, selectedMenuId]);

  useEffect(() => {
    setMenuEditorTab('general');
  }, [selectedMenuId]);

  useEffect(() => {
    if (!modifierMenuFilter || menus.some((menu) => menu.id === modifierMenuFilter)) {
      return;
    }

    setModifierMenuFilter('');
  }, [menus, modifierMenuFilter]);

  useEffect(() => {
    if (!modifierMenuFilter) {
      return;
    }

    if (!modifierSelectedMenuItems.some((item) => item.id === selectedItemId)) {
      setSelectedItemId(modifierSelectedMenuItems[0]?.id ?? null);
    }
  }, [modifierMenuFilter, modifierSelectedMenuItems, selectedItemId]);

  useEffect(() => {
    setNewItemDraft((current) => ({
      ...current,
      menuId: current.menuId || selectedMenuId || '',
    }));
  }, [selectedMenuId]);

  useEffect(() => {
    setSelectedGroupId(null);
  }, [selectedItemId]);

  useEffect(() => {
    setSelectedItemId(null);
    setSelectedGroupId(null);
  }, [selectedMenuId]);

  useEffect(() => {
    if (workflowMode === 'add' && activeSection === 'themes') {
      setActiveSection('menus');
    }
  }, [activeSection, workflowMode]);

  useEffect(() => {
    if (activeSection === 'menus') {
      setMenuEditorTab('general');
    }
    if (activeSection === 'themes') {
      setMenuEditorTab('images');
    }
  }, [activeSection]);

  function getGroupEdit(group: ModifierGroupDTO) {
    return groupEdits[group.id] ?? toGroupDraft(group);
  }

  function getOptionEdit(option: ModifierOptionDTO) {
    return optionEdits[option.id] ?? toOptionDraft(option);
  }

  function getOptionDraft(groupId: string) {
    return optionDrafts[groupId] ?? emptyOptionDraft;
  }

  async function runAction<T>(action: () => Promise<T>) {
    try {
      setSaving(true);
      setError(null);
      const result = await action();
      await loadMenuData();
      return result;
    } catch (nextError) {
      setError(getApiErrorMessage(nextError, t('menu.title')));
      return null;
    } finally {
      setSaving(false);
    }
  }

  async function handleCreateMenu() {
    if (!restaurantId || !requireLanguages(newMenuDraft)) {
      return;
    }

    const created = await runAction(() =>
      createMenu({
        restaurantId,
        name: newMenuDraft.nameAr.trim(),
        nameAr: optionalText(newMenuDraft.nameAr),
        nameEn: optionalText(newMenuDraft.nameEn),
        nameFr: optionalText(newMenuDraft.nameFr),
        description: optionalText(resolvePrimaryMenuDescription(newMenuDraft)),
        descriptionAr: optionalText(newMenuDraft.descriptionAr),
        descriptionEn: optionalText(newMenuDraft.descriptionEn),
        descriptionFr: optionalText(newMenuDraft.descriptionFr),
        image: optionalText(newMenuDraft.image),
        themeKey: optionalText(newMenuDraft.themeKey) ?? themePresets[0]?.key ?? null,
      }),
    );

    if (created) {
      setSelectedMenuId(created.id);
      setNewMenuDraft(emptyMenuDraft);
    }
  }

  async function handleSaveMenu() {
    if (!selectedMenu || !requireLanguages(menuEditor)) {
      return;
    }

    await runAction(() =>
      updateMenu(selectedMenu.id, {
        name: menuEditor.nameAr.trim(),
        nameAr: optionalText(menuEditor.nameAr),
        nameEn: optionalText(menuEditor.nameEn),
        nameFr: optionalText(menuEditor.nameFr),
        description: optionalText(resolvePrimaryMenuDescription(menuEditor)),
        descriptionAr: optionalText(menuEditor.descriptionAr),
        descriptionEn: optionalText(menuEditor.descriptionEn),
        descriptionFr: optionalText(menuEditor.descriptionFr),
        themeKey: optionalText(menuEditor.themeKey),
      }),
    );
  }

  async function handleArchiveMenu() {
    if (!restaurantId || !selectedMenu) {
      return;
    }

    await runAction(() => archiveMenu(selectedMenu.id, restaurantId));
  }

  async function handleCreateItem() {
    if (!restaurantId || !newItemDraft.menuId || !requireLanguages(newItemDraft)) {
      return;
    }

    const price = toNumber(newItemDraft.price, Number.NaN);
    if (!Number.isFinite(price) || price < 0) {
      setError(t('menu.invalidPrice'));
      return;
    }

    const created = await runAction(() =>
      createMenuItem({
        restaurantId,
        menuId: newItemDraft.menuId,
        name: newItemDraft.nameAr.trim(),
        nameAr: optionalText(newItemDraft.nameAr),
        nameEn: optionalText(newItemDraft.nameEn),
        nameFr: optionalText(newItemDraft.nameFr),
        description: optionalText(resolvePrimaryMenuDescription(newItemDraft)),
        descriptionAr: optionalText(newItemDraft.descriptionAr),
        descriptionEn: optionalText(newItemDraft.descriptionEn),
        descriptionFr: optionalText(newItemDraft.descriptionFr),
        price,
        image: optionalText(newItemDraft.image),
      }),
    );

    if (created) {
      setSelectedMenuId(created.menuId);
      setSelectedItemId(created.id);
      setNewItemDraft((current) => ({
        ...emptyItemDraft,
        menuId: current.menuId,
      }));
    }
  }

  async function handleSaveItem() {
    if (!selectedItem || !itemEditor.menuId || !requireLanguages(itemEditor)) {
      return;
    }

    const price = toNumber(itemEditor.price, Number.NaN);
    if (!Number.isFinite(price) || price < 0) {
      setError(t('menu.invalidPrice'));
      return;
    }

    await runAction(() =>
      updateMenuItem(selectedItem.id, {
        menuId: itemEditor.menuId,
        name: itemEditor.nameAr.trim(),
        nameAr: optionalText(itemEditor.nameAr),
        nameEn: optionalText(itemEditor.nameEn),
        nameFr: optionalText(itemEditor.nameFr),
        description: optionalText(itemEditor.description),
        descriptionAr: optionalText(itemEditor.descriptionAr),
        descriptionEn: optionalText(itemEditor.descriptionEn),
        descriptionFr: optionalText(itemEditor.descriptionFr),
        price,
        image: optionalText(itemEditor.image),
      }),
    );
  }

  async function handleArchiveItem() {
    if (!restaurantId || !selectedItem) {
      return;
    }

    await runAction(() => archiveMenuItem(selectedItem.id, restaurantId));
  }

  function requireLanguages(draft: { nameAr: string; nameEn: string; nameFr: string }): boolean {
    if (!draft.nameAr.trim() || !draft.nameEn.trim() || !draft.nameFr.trim()) {
      setError(t('menu.requireAllLanguages'));
      return false;
    }
    return true;
  }

  async function handleCreateGroup() {
    if (!restaurantId || !selectedItem || !requireLanguages(groupDraft)) {
      return;
    }

    await runAction(() =>
      createModifierGroup({
        restaurantId,
        menuItemId: selectedItem.id,
        name: groupDraft.nameAr.trim(),
        nameAr: optionalText(groupDraft.nameAr),
        nameEn: optionalText(groupDraft.nameEn),
        nameFr: optionalText(groupDraft.nameFr),
        required: groupDraft.required,
        minSelections: Math.max(0, toNumber(groupDraft.minSelections, 0)),
        maxSelections: Math.max(1, toNumber(groupDraft.maxSelections, 1)),
      }),
    );

    setGroupDraft(emptyGroupDraft);
  }

  async function handleSaveGroup(group: ModifierGroupDTO) {
    const draft = getGroupEdit(group);

    if (!requireLanguages(draft)) {
      return;
    }

    await runAction(() =>
      updateModifierGroup(group.id, {
        name: draft.nameAr.trim(),
        nameAr: optionalText(draft.nameAr),
        nameEn: optionalText(draft.nameEn),
        nameFr: optionalText(draft.nameFr),
        required: draft.required,
        minSelections: Math.max(0, toNumber(draft.minSelections, 0)),
        maxSelections: Math.max(1, toNumber(draft.maxSelections, 1)),
      }),
    );
  }

  async function handleDeleteGroup(group: ModifierGroupDTO) {
    if (!restaurantId) {
      return;
    }

    await runAction(() => deleteModifierGroup(group.id, restaurantId));
  }

  async function handleCreateOption(group: ModifierGroupDTO) {
    const draft = getOptionDraft(group.id);

    if (!requireLanguages(draft)) {
      return;
    }

    await runAction(() =>
      createModifierOption({
        groupId: group.id,
        name: draft.nameAr.trim(),
        nameAr: optionalText(draft.nameAr),
        nameEn: optionalText(draft.nameEn),
        nameFr: optionalText(draft.nameFr),
        priceDelta: toNumber(draft.priceDelta, 0),
      }),
    );

    setOptionDrafts((current) => ({
      ...current,
      [group.id]: emptyOptionDraft,
    }));
  }

  async function handleSaveOption(option: ModifierOptionDTO) {
    const draft = getOptionEdit(option);

    if (!requireLanguages(draft)) {
      return;
    }

    await runAction(() =>
      updateModifierOption(option.id, {
        name: draft.nameAr.trim(),
        nameAr: optionalText(draft.nameAr),
        nameEn: optionalText(draft.nameEn),
        nameFr: optionalText(draft.nameFr),
        priceDelta: toNumber(draft.priceDelta, 0),
      }),
    );
  }

  async function handleArchiveOption(option: ModifierOptionDTO) {
    if (!restaurantId) {
      return;
    }

    await runAction(() => archiveModifierOption(option.id, restaurantId));
  }

  const activeLang = translationPanelLanguage;
  const langDisplay: Record<string, string> = { ar: 'العربية', en: 'English', fr: 'Français' };

  function activeNameValue() {
    if (activeLang === 'ar') return newMenuDraft.nameAr;
    if (activeLang === 'en') return newMenuDraft.nameEn;
    return newMenuDraft.nameFr;
  }

  function activeNameOnChange(value: string) {
    setNewMenuDraft((prev) => {
      if (activeLang === 'ar') return { ...prev, nameAr: value };
      if (activeLang === 'en') return { ...prev, nameEn: value };
      return { ...prev, nameFr: value };
    });
  }

  function activeDescValue() {
    if (activeLang === 'ar') return newMenuDraft.descriptionAr;
    if (activeLang === 'en') return newMenuDraft.descriptionEn;
    return newMenuDraft.descriptionFr;
  }

  function activeDescOnChange(value: string) {
    setNewMenuDraft((prev) => {
      if (activeLang === 'ar') return { ...prev, descriptionAr: value };
      if (activeLang === 'en') return { ...prev, descriptionEn: value };
      return { ...prev, descriptionFr: value };
    });
  }

  function activeEditorNameValue() {
    if (activeLang === 'ar') return menuEditor.nameAr;
    if (activeLang === 'en') return menuEditor.nameEn;
    return menuEditor.nameFr;
  }

  function activeEditorNameOnChange(value: string) {
    setMenuEditor((prev) => {
      if (activeLang === 'ar') return { ...prev, nameAr: value };
      if (activeLang === 'en') return { ...prev, nameEn: value };
      return { ...prev, nameFr: value };
    });
  }

  function activeEditorDescValue() {
    if (activeLang === 'ar') return menuEditor.descriptionAr;
    if (activeLang === 'en') return menuEditor.descriptionEn;
    return menuEditor.descriptionFr;
  }

  function activeEditorDescOnChange(value: string) {
    setMenuEditor((prev) => {
      if (activeLang === 'ar') return { ...prev, descriptionAr: value };
      if (activeLang === 'en') return { ...prev, descriptionEn: value };
      return { ...prev, descriptionFr: value };
    });
  }

  function activeItemNameValue() {
    if (activeLang === 'ar') return newItemDraft.nameAr;
    if (activeLang === 'en') return newItemDraft.nameEn;
    return newItemDraft.nameFr;
  }

  function activeItemNameOnChange(value: string) {
    setNewItemDraft((prev) => {
      if (activeLang === 'ar') return { ...prev, nameAr: value };
      if (activeLang === 'en') return { ...prev, nameEn: value };
      return { ...prev, nameFr: value };
    });
  }

  function activeItemDescValue() {
    if (activeLang === 'ar') return newItemDraft.descriptionAr;
    if (activeLang === 'en') return newItemDraft.descriptionEn;
    return newItemDraft.descriptionFr;
  }

  function activeItemDescOnChange(value: string) {
    setNewItemDraft((prev) => {
      if (activeLang === 'ar') return { ...prev, descriptionAr: value };
      if (activeLang === 'en') return { ...prev, descriptionEn: value };
      return { ...prev, descriptionFr: value };
    });
  }

  function activeEditorItemNameValue() {
    if (activeLang === 'ar') return itemEditor.nameAr;
    if (activeLang === 'en') return itemEditor.nameEn;
    return itemEditor.nameFr;
  }

  function activeEditorItemNameOnChange(value: string) {
    setItemEditor((prev) => {
      if (activeLang === 'ar') return { ...prev, nameAr: value };
      if (activeLang === 'en') return { ...prev, nameEn: value };
      return { ...prev, nameFr: value };
    });
  }

  function activeEditorItemDescValue() {
    if (activeLang === 'ar') return itemEditor.descriptionAr;
    if (activeLang === 'en') return itemEditor.descriptionEn;
    return itemEditor.descriptionFr;
  }

  function activeEditorItemDescOnChange(value: string) {
    setItemEditor((prev) => {
      if (activeLang === 'ar') return { ...prev, descriptionAr: value };
      if (activeLang === 'en') return { ...prev, descriptionEn: value };
      return { ...prev, descriptionFr: value };
    });
  }

  return (
    <div
      className={`space-y-6 ${isFocusedMenuRoute ? 'menu-route-focus-shell' : ''}`}
      dir={dir}
    >
      <section className={`page-header ${isFocusedMenuRoute ? 'menu-route-focus-header' : ''}`}>
        <div className={isFocusedMenuRoute ? 'menu-route-focus-header-copy' : ''}>
          {isFocusedMenuRoute ? (
            <>
              <nav className="menu-route-focus-breadcrumb" aria-label="Breadcrumb">
                <span>{t('menu.workspaceLabel')}</span>
                <span className="material-symbols-outlined" aria-hidden="true">
                  chevron_right
                </span>
                <span className="menu-route-focus-breadcrumb-active">{pageTitle}</span>
              </nav>
              <h1 className="menu-route-focus-title">{pageTitle}</h1>
              <p className="menu-route-focus-subtitle">{pageSubtitle}</p>
            </>
          ) : (
            <>
              <h2>{t('menu.title')}</h2>
              <p>{t('menu.subtitle')}</p>
            </>
          )}
        </div>
        <button
          type="button"
          className={`ghost-btn ${isFocusedMenuRoute ? 'menu-route-focus-refresh' : ''}`}
          onClick={() => void loadMenuData()}
        >
          <RefreshCw size={16} />
          <span>{t('menu.refresh')}</span>
        </button>
      </section>

      <section
        className={`sticky top-16 z-30 bg-white/80 backdrop-blur-md panel menu-language-panel ${
          isFocusedMenuRoute ? 'menu-route-focus-language-panel' : ''
        }`}
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
              {t('menu.tabTranslations')}
            </p>
            <p className="mt-1 text-sm text-slate-500">
              {t('menu.localizedNames')}
            </p>
          </div>
          <TranslationLanguageSwitcher
            activeLanguage={translationPanelLanguage}
            onChange={setTranslationPanelLanguage}
            focused={isFocusedMenuRoute}
          />
        </div>
      </section>

      {!isFocusedMenuRoute ? (
      <section className="panel space-y-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
            {t('menu.workspaceLabel')}
          </p>
          <h3 className="mt-2 text-lg font-semibold text-slate-900">
            {pageTitle}
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            {pageSubtitle}
          </p>
        </div>
        {!lockWorkflowMode ? (
          <div className="flex flex-wrap gap-2">
            <TabButton
              active={workflowMode === 'add'}
              label={t('menu.modeAdd')}
              onClick={() => setWorkflowMode('add')}
            />
            <TabButton
              active={workflowMode === 'edit'}
              label={t('menu.modeEdit')}
              onClick={() => setWorkflowMode('edit')}
            />
          </div>
        ) : null}
        {!lockSection ? (
          <div className="flex flex-wrap gap-2">
            <TabButton
              active={activeSection === 'menus'}
              label={workflowMode === 'add' ? t('menu.addMenu') : t('menu.editMenu')}
              onClick={() => setActiveSection('menus')}
            />
            <TabButton
              active={activeSection === 'items'}
              label={workflowMode === 'add' ? t('menu.addItemShortcut') : t('menu.editItemShortcut')}
              onClick={() => setActiveSection('items')}
            />
            <TabButton
              active={activeSection === 'modifiers'}
              label={
                workflowMode === 'add' ? t('menu.addModifierShortcut') : t('menu.editModifierShortcut')
              }
              onClick={() => setActiveSection('modifiers')}
            />
            {workflowMode === 'edit' ? (
              <TabButton
                active={activeSection === 'themes'}
                label={t('menu.sectionThemes')}
                onClick={() => setActiveSection('themes')}
              />
            ) : null}
          </div>
        ) : null}
      </section>
      ) : null}

      {error ? (
        <div className="panel error-banner flex items-center gap-2 text-xs font-bold">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      ) : null}

      {loading ? (
        <div className="panel flex items-center justify-center gap-3 p-12 text-slate-500">
          <RefreshCw size={18} className="animate-spin" />
          <span>{t('menu.loading')}</span>
        </div>
      ) : (
        <section className={`menu-workspace-shell ${isFocusedMenuRoute ? 'menu-route-focus-workspace' : ''}`}>
          <div className={`menu-workspace-grid ${isFocusedMenuRoute && (isAddMenuSection || isEditMenuSection) ? 'menu-workspace-grid-single' : ''}`}>
          {!(isFocusedMenuRoute && (isAddMenuSection || isEditMenuSection || isModifierSection)) && (
          <aside className="menu-workspace-sidebar space-y-4">
            {isAddMenuSection && !isFocusedMenuRoute ? (
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
                      value={newMenuDraft.nameAr}
                      onChange={(value) =>
                        setNewMenuDraft((current) => ({ ...current, nameAr: value }))
                      }
                      className="px-5 py-4 text-base"
                    />
                    <TextField
                      label={t('menu.menuNameEn')}
                      value={newMenuDraft.nameEn}
                      onChange={(value) =>
                        setNewMenuDraft((current) => ({ ...current, nameEn: value }))
                      }
                      className="px-5 py-4 text-base"
                    />
                    <TextField
                      label={t('menu.menuNameFr')}
                      value={newMenuDraft.nameFr}
                      onChange={(value) =>
                        setNewMenuDraft((current) => ({ ...current, nameFr: value }))
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
                          active={newMenuDraft.themeKey === theme.key}
                          title={theme.title}
                          description={theme.description}
                          accentClass={theme.accentClass}
                          onClick={() =>
                            setNewMenuDraft((current) => ({ ...current, themeKey: theme.key }))
                          }
                        />
                      ))}
                    </div>
                  </div>

                  <TranslationFields title={t('menu.localizedDescriptions')}>
                    <TextAreaField
                      label={t('menu.menuDescriptionAr')}
                      value={newMenuDraft.descriptionAr}
                      onChange={(value) =>
                        setNewMenuDraft((current) => ({ ...current, descriptionAr: value }))
                      }
                      rows={4}
                      className="px-5 py-4 text-base"
                    />
                    <TextAreaField
                      label={t('menu.menuDescriptionEn')}
                      value={newMenuDraft.descriptionEn}
                      onChange={(value) =>
                        setNewMenuDraft((current) => ({ ...current, descriptionEn: value }))
                      }
                      rows={4}
                      className="px-5 py-4 text-base"
                    />
                    <TextAreaField
                      label={t('menu.menuDescriptionFr')}
                      value={newMenuDraft.descriptionFr}
                      onChange={(value) =>
                        setNewMenuDraft((current) => ({ ...current, descriptionFr: value }))
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
                  onClick={() => void handleCreateMenu()}
                >
                  <Plus size={16} />
                  <span>{t('menu.createMenu')}</span>
                </button>
              </div>
            ) : null}

            <div className="panel menu-browser-panel">
              <div className="panel-header">
                <div>
                  <h3>
                    {isAddItemSection || isEditItemSection
                      ? t('menu.menuItems')
                      : isModifierSection && isFocusedMenuRoute
                        ? t('menu.menuCatalog')
                        : isModifierSection
                          ? t('menu.modifiers')
                          : isThemeSection
                            ? t('menu.sectionThemes')
                            : t('menu.menuCatalog')}
                  </h3>
                  <p>
                    {isAddItemSection || isEditItemSection
                      ? t('menu.menuItemsSubtitle')
                      : isModifierSection && isFocusedMenuRoute
                        ? t('menu.menuCatalogSubtitle')
                        : isModifierSection
                          ? t('menu.modifiersSubtitleStatic')
                          : isThemeSection
                            ? t('menu.sectionThemesSubtitle')
                            : t('menu.menuCatalogSubtitle')}
                  </p>
                </div>
              </div>

              <div className="menu-selection-list mt-5 space-y-3">
                {(isAddItemSection || isEditItemSection || (isModifierSection && !isFocusedMenuRoute)) && selectedMenuId ? (
                  itemsForSelectedMenu.length ? (
                    itemsForSelectedMenu.map((item) => {
                      const isActive = item.id === selectedItemId;

                      return (
                        <SelectionCard
                          key={item.id}
                          active={isActive}
                          title={localizeEntityName(item, language)}
                          subtitle={formatCurrency(item.price)}
                          caption={`${item.modifierGroups?.length ?? 0} ${t('menu.modifierGroupsCount')}`}
                          imageSrc={item.image}
                          onClick={() => setSelectedItemId(item.id)}
                          focused={isFocusedMenuRoute}
                        />
                      );
                    })
                  ) : (
                    <EmptyStateCard message={t('menu.noItemsYet')} />
                  )
                ) : menus.length ? (
                  menus.map((menu) => {
                    const isActive = menu.id === selectedMenuId;

                    return (
                      <SelectionCard
                        key={menu.id}
                        active={isActive}
                        title={localizeEntityName(menu, language)}
                        subtitle={`${itemCountByMenu.get(menu.id) ?? 0} ${t('menu.itemsCount')}`}
                        caption={menu.themeKey || t('menu.noThemeKey')}
                        imageSrc={menu.image}
                        onClick={() => setSelectedMenuId(menu.id)}
                        focused={isFocusedMenuRoute}
                      />
                    );
                  })
                ) : (
                  <EmptyStateCard message={t('menu.noMenus')} />
                )}
              </div>
            </div>
          </aside>
          )}

          <div className="menu-workspace-main space-y-6">
            {isAddMenuSection && isFocusedMenuRoute ? (
              <div className="panel menu-editor-panel menu-create-centered">
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
                        value={activeNameValue()}
                        onChange={activeNameOnChange}
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
                          active={newMenuDraft.themeKey === theme.key}
                          title={theme.title}
                          description={theme.description}
                          accentClass={theme.accentClass}
                          onClick={() =>
                            setNewMenuDraft((current) => ({ ...current, themeKey: theme.key }))
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
                        value={activeDescValue()}
                        onChange={activeDescOnChange}
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
                          value={newMenuDraft.image}
                          onChange={(value) =>
                            setNewMenuDraft((current) => ({ ...current, image: value }))
                          }
                          placeholder="https://example.com/image.jpg"
                          className="px-5 py-4 text-base w-full"
                        />
                      </div>
                      <div className="w-full sm:w-48 shrink-0">
                        <SimpleImagePreview src={newMenuDraft.image} emptyLabel={t('menu.noImage')} />
                      </div>
                    </div>
                  </div>

                  <div className="menu-create-footer">
                    <button
                      type="button"
                      className="menu-create-submit-btn"
                      disabled={saving}
                      onClick={() => void handleCreateMenu()}
                    >
                      <Plus size={18} />
                      <span>{t('menu.createMenu')}</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : null}
            {isEditMenuSection || isThemeSection ? (
              selectedMenu ? (
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
                          value={activeEditorNameValue()}
                          onChange={activeEditorNameOnChange}
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
                            active={menuEditor.themeKey === theme.key}
                            title={theme.title}
                            description={theme.description}
                            accentClass={theme.accentClass}
                            onClick={() =>
                              setMenuEditor((current) => ({ ...current, themeKey: theme.key }))
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
                          value={activeEditorDescValue()}
                          onChange={activeEditorDescOnChange}
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
                            value={menuEditor.image}
                            onChange={(value) =>
                              setMenuEditor((current) => ({ ...current, image: value }))
                            }
                            placeholder="https://example.com/image.jpg"
                            className="px-5 py-4 text-base w-full"
                          />
                        </div>
                        <div className="w-full sm:w-48 shrink-0">
                          <SimpleImagePreview src={menuEditor.image} emptyLabel={t('menu.noImage')} />
                        </div>
                      </div>
                    </div>

                    <div className="menu-create-footer">
                      <button
                        type="button"
                        className="menu-create-submit-btn"
                        disabled={saving}
                        onClick={() => void handleSaveMenu()}
                      >
                        <Save size={18} />
                        <span>{t('menu.saveMenu')}</span>
                      </button>
                      <button
                        type="button"
                        className="ghost-btn text-rose-600 mt-3"
                        disabled={saving}
                        onClick={() => void handleArchiveMenu()}
                      >
                        <Trash2 size={16} />
                        <span>{t('menu.deleteMenu')}</span>
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="mt-4 rounded-[28px] border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-slate-500">
                  {t('menu.createFirstMenu')}
                </div>
              )
            ) : null}

            {isAddItemSection || isEditItemSection || isModifierSection ? (
              <section className="menu-detail-grid">
                <div className="menu-detail-sidebar space-y-4">
                  {isAddItemSection ? (
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
                            value={newItemDraft.menuId}
                            onChange={(event) => {
                              setNewItemDraft((current) => ({
                                ...current,
                                menuId: event.target.value,
                              }));
                              setSelectedMenuId(event.target.value || null);
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
                          value={newItemDraft.price}
                          onChange={(value) =>
                            setNewItemDraft((current) => ({ ...current, price: value }))
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
                              value={activeItemNameValue()}
                              onChange={activeItemNameOnChange}
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
                              value={activeItemDescValue()}
                              onChange={activeItemDescOnChange}
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
                                value={newItemDraft.image}
                                onChange={(value) =>
                                  setNewItemDraft((current) => ({ ...current, image: value }))
                                }
                                placeholder="https://example.com/image.jpg"
                                className="px-5 py-4 text-base w-full"
                              />
                            </div>
                            <div className="w-full sm:w-48 shrink-0">
                              <SimpleImagePreview src={newItemDraft.image} emptyLabel={t('menu.noImage')} />
                            </div>
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        className="primary-btn mt-4"
                        disabled={saving}
                        onClick={() => void handleCreateItem()}
                      >
                        <Plus size={16} />
                        <span>{t('menu.createItem')}</span>
                      </button>
                    </div>
                  ) : null}
                </div>

                <div className="menu-detail-main space-y-4">
                  {isEditItemSection ? (
                    selectedItem ? (
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
                          <div className="grid gap-4 sm:grid-cols-2">
                            <label className="space-y-2">
                              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                                {t('menu.selectMenu')}
                              </span>
                              <select
                                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#cf6d43] focus:ring-2 focus:ring-[#cf6d43]/10"
                                value={itemEditor.menuId}
                                onChange={(event) => {
                                  setItemEditor((current) => ({
                                    ...current,
                                    menuId: event.target.value,
                                  }));
                                  setSelectedMenuId(event.target.value || null);
                                }}
                              >
                                {menus.map((menu) => (
                                  <option key={menu.id} value={menu.id}>
                                    {localizeEntityName(menu, language)}
                                  </option>
                                ))}
                              </select>
                            </label>

                            <TextField
                              label={t('menu.price')}
                              value={itemEditor.price}
                              onChange={(value) =>
                                setItemEditor((current) => ({ ...current, price: value }))
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
                                value={activeEditorItemNameValue()}
                                onChange={activeEditorItemNameOnChange}
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
                                value={activeEditorItemDescValue()}
                                onChange={activeEditorItemDescOnChange}
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
                                  value={itemEditor.image}
                                  onChange={(value) =>
                                    setItemEditor((current) => ({ ...current, image: value }))
                                  }
                                  placeholder="https://example.com/image.jpg"
                                  className="px-5 py-4 text-base w-full"
                                />
                              </div>
                              <div className="w-full sm:w-48 shrink-0">
                                <SimpleImagePreview src={itemEditor.image} emptyLabel={t('menu.noImage')} />
                              </div>
                            </div>
                          </div>

                          <div className="flex w-full items-center justify-end gap-3 border-t border-slate-100 pt-6">
                            <button
                              type="button"
                              className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-5 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-100 disabled:opacity-50"
                              disabled={saving}
                              onClick={() => void handleArchiveItem()}
                            >
                              <Trash2 size={16} />
                              <span>{t('menu.deleteItem')}</span>
                            </button>
                            <button
                              type="button"
                              className="menu-create-submit-btn"
                              disabled={saving}
                              onClick={() => void handleSaveItem()}
                            >
                              <Save size={18} />
                              <span>{t('menu.saveItem')}</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="mt-4 rounded-[28px] border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-slate-500">
                        {t('menu.selectItemPrompt')}
                      </div>
                    )
                  ) : null}

                  {isModifierSection ? (
                    <div className={isFocusedMenuRoute ? 'menu-modifier-focused-grid' : ''}>
                      {isFocusedMenuRoute ? (
                        <div className={`menu-modifier-items-col panel menu-editor-panel${selectedGroupId ? ' hidden' : ''}`}>
                          <div className="panel-header">
                            <div>
                              <h3>{t('menu.menuCatalog')}</h3>
                              <p>{t('menu.menuCatalogSubtitle')}</p>
                            </div>
                          </div>
                          <div className="menu-selection-list mt-5 space-y-3">
                            {menus.length ? (
                              menus.map((menu) => {
                                const isActive = menu.id === selectedMenuId;
                                return (
                                  <SelectionCard
                                    key={menu.id}
                                    active={isActive}
                                    title={localizeEntityName(menu, language)}
                                    subtitle={`${itemCountByMenu.get(menu.id) ?? 0} ${t('menu.itemsCount')}`}
                                    caption={menu.themeKey || t('menu.noThemeKey')}
                                    imageSrc={menu.image}
                                    onClick={() => setSelectedMenuId(menu.id)}
                                    focused={isFocusedMenuRoute}
                                  />
                                );
                              })
                            ) : (
                              <EmptyStateCard message={t('menu.noMenus')} />
                            )}
                          </div>
                        </div>
                      ) : null}
                      {isFocusedMenuRoute ? (
                        <div className={`menu-modifier-readonly-col panel menu-editor-panel${!selectedMenuId || selectedGroupId ? ' hidden' : ''}`}>
                          <div className="panel-header">
                            <div>
                              <h3>{t('menu.menuItems')}</h3>
                              <p>
                                {selectedMenuId
                                  ? t('menu.menuItemsSubtitle')
                                  : t('menu.menuCatalogSubtitle')}
                              </p>
                            </div>
                          </div>
                          <div className="menu-selection-list mt-5 space-y-3">
                            {selectedMenuId ? (
                              itemsForSelectedMenu.length ? (
                                itemsForSelectedMenu.map((item) => {
                                  const isActive = item.id === selectedItemId;
                                  return (
                                    <SelectionCard
                                      key={item.id}
                                      active={isActive}
                                      title={localizeEntityName(item, language)}
                                      subtitle={formatCurrency(item.price)}
                                      caption={`${item.modifierGroups?.length ?? 0} ${t('menu.modifierGroupsCount')}`}
                                      imageSrc={item.image}
                                      onClick={() => setSelectedItemId(item.id)}
                                      focused={isFocusedMenuRoute}
                                    />
                                  );
                                })
                              ) : (
                                <EmptyStateCard message={t('menu.noItemsYet')} />
                              )
                            ) : (
                              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-500">
                                {t('menu.selectMenu')}
                              </div>
                            )}
                          </div>
                        </div>
                      ) : null}
                      <div className={`${isFocusedMenuRoute ? 'menu-modifier-addons-col flex-grow flex-1 w-full' : ''}${!selectedItemId && isFocusedMenuRoute ? ' hidden' : ''}`}>
                    <div className="panel menu-editor-panel w-full max-w-none">
                      <div className="panel-header">
                        <div>
                          <h3>{t('menu.modifiers')}</h3>
                          <p>
                            {selectedItem
                              ? `${t('menu.modifiersSubtitle')} ${localizeEntityName(selectedItem, language)}`
                              : t('menu.selectItemPrompt')}
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 space-y-4">
                        {!isFocusedMenuRoute ? (
                        <div className="grid gap-3 md:grid-cols-2">
                          <label className="space-y-2">
                            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                              {t('menu.selectMenu')}
                            </span>
                            <select
                              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#cf6d43] focus:ring-2 focus:ring-[#cf6d43]/10"
                              value={modifierMenuFilter}
                              onChange={(event) => {
                                setModifierMenuFilter(event.target.value);
                                setSelectedItemId(null);
                              }}
                            >
                              <option value="">{t('menu.selectMenu')}</option>
                              {modifierMenus.map((menu) => (
                                <option key={menu.id} value={menu.id}>
                                  {localizeEntityName(menu, language)}
                                </option>
                              ))}
                            </select>
                          </label>

                          <label className="space-y-2">
                            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                              {t('menu.selectItemPrompt')}
                            </span>
                            <select
                              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#cf6d43] focus:ring-2 focus:ring-[#cf6d43]/10"
                              value={selectedItemId ?? ''}
                              onChange={(event) => setSelectedItemId(event.target.value || null)}
                              disabled={!modifierMenuFilter}
                            >
                              <option value="">{t('menu.selectItemPrompt')}</option>
                              {modifierSelectedMenuItems.map((item) => (
                                <option key={item.id} value={item.id}>
                                  {localizeEntityName(item, language)}
                                </option>
                              ))}
                            </select>
                          </label>
                        </div>
                        ) : null}

                        {selectedItem ? (
                          <div className="space-y-4">

                          {selectedGroupId ? (
                            (() => {
                              const group = (selectedItem?.modifierGroups ?? []).find(g => g.id === selectedGroupId);
                              if (!group) { return null; }
                              const groupEdit = getGroupEdit(group);
                              const optionDraft = getOptionDraft(group.id);

                              return (
                                <div
                                  key={group.id}
                                  className="rounded-[28px] border border-slate-200 bg-white p-4 mb-3"
                                >
                                  <button
                                    type="button"
                                    className="flex items-center gap-2 text-slate-500 hover:text-slate-800 mb-4 transition cursor-pointer"
                                    onClick={() => setSelectedGroupId(null)}
                                  >
                                    <ArrowLeft size={16} />
                                    <span className="text-sm font-medium">{t('menu.backToGroups')}</span>
                                  </button>
                                  <div className="grid gap-3">
                                    <div className="space-y-2">
                                      <span className="block text-sm font-medium text-slate-500">
                                        {t('menu.requiredToggle')}
                                      </span>
                                      <div className="flex h-[50px] items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-700">
                                        <span className="font-medium text-slate-600">{t('menu.requiredToggle')}</span>
                                        <button
                                          type="button"
                                          role="switch"
                                          aria-checked={groupEdit.required}
                                          className={`w-11 h-6 rounded-full relative transition-colors duration-200 outline-none ${
                                            groupEdit.required ? 'bg-[var(--admin-primary)]' : 'bg-slate-200'
                                          }`}
                                          onClick={() =>
                                            setGroupEdits((current) => ({
                                              ...current,
                                              [group.id]: {
                                                ...groupEdit,
                                                required: !groupEdit.required,
                                              },
                                            }))
                                          }
                                        >
                                          <span
                                            className={`absolute left-0.5 top-0.5 w-5 h-5 bg-white rounded-full transition-transform duration-200 shadow-sm ${
                                              groupEdit.required ? 'translate-x-5' : ''
                                            }`}
                                          />
                                        </button>
                                      </div>
                                    </div>

                                    <TranslationFields title={t('menu.localizedNames')}>
                                      <TranslationPane
                                        activeLanguage={translationPanelLanguage}
                                        children={{
                                          ar: (
                                            <TextField
                                              label={t('menu.modifierGroupNameAr')}
                                              value={groupEdit.nameAr}
                                              onChange={(value) =>
                                                setGroupEdits((current) => ({
                                                  ...current,
                                                  [group.id]: { ...groupEdit, nameAr: value },
                                                }))
                                              }
                                            />
                                          ),
                                          en: (
                                            <TextField
                                              label={t('menu.modifierGroupNameEn')}
                                              value={groupEdit.nameEn}
                                              onChange={(value) =>
                                                setGroupEdits((current) => ({
                                                  ...current,
                                                  [group.id]: { ...groupEdit, nameEn: value },
                                                }))
                                              }
                                            />
                                          ),
                                          fr: (
                                            <TextField
                                              label={t('menu.modifierGroupNameFr')}
                                              value={groupEdit.nameFr}
                                              onChange={(value) =>
                                                setGroupEdits((current) => ({
                                                  ...current,
                                                  [group.id]: { ...groupEdit, nameFr: value },
                                                }))
                                              }
                                            />
                                          ),
                                        }}
                                      />
                                    </TranslationFields>

                                    <div className="grid gap-3 md:grid-cols-2">
                                      <TextField
                                        label={t('menu.minSelections')}
                                        value={groupEdit.minSelections}
                                        onChange={(value) =>
                                          setGroupEdits((current) => ({
                                            ...current,
                                            [group.id]: { ...groupEdit, minSelections: value },
                                          }))
                                        }
                                        type="number"
                                      />
                                      <TextField
                                        label={t('menu.maxSelections')}
                                        value={groupEdit.maxSelections}
                                        onChange={(value) =>
                                          setGroupEdits((current) => ({
                                            ...current,
                                            [group.id]: { ...groupEdit, maxSelections: value },
                                          }))
                                        }
                                        type="number"
                                      />
                                    </div>
                                  </div>

                                  <div className="mt-4 flex flex-wrap gap-2">
                                    <button
                                      type="button"
                                      className="ghost-btn small"
                                      disabled={saving}
                                      onClick={() => void handleSaveGroup(group)}
                                    >
                                      <Save size={14} />
                                      <span>{t('menu.saveGroup')}</span>
                                    </button>
                                    <button
                                      type="button"
                                      className="ghost-btn small text-rose-600"
                                      disabled={saving}
                                      onClick={() => void handleDeleteGroup(group)}
                                    >
                                      <Trash2 size={14} />
                                      <span>{t('menu.deleteGroup')}</span>
                                    </button>
                                  </div>

                                  <div className="mt-4 rounded-[24px] border border-dashed border-slate-300 bg-slate-50 p-4">
                                    <h4 className="font-semibold text-slate-900">
                                      {t('menu.addOption')}
                                    </h4>
                                    <div className="mt-3 grid gap-3">
                                      <TextField
                                        label={t('menu.priceDelta')}
                                        value={optionDraft.priceDelta}
                                        onChange={(value) =>
                                          setOptionDrafts((current) => ({
                                            ...current,
                                            [group.id]: {
                                              ...optionDraft,
                                              priceDelta: value,
                                            },
                                          }))
                                        }
                                        type="number"
                                      />

                                      <TranslationFields title={t('menu.localizedNames')}>
                                        <TranslationPane
                                          activeLanguage={translationPanelLanguage}
                                          children={{
                                            ar: (
                                              <TextField
                                                label={t('menu.optionNameAr')}
                                                value={optionDraft.nameAr}
                                                onChange={(value) =>
                                                  setOptionDrafts((current) => ({
                                                    ...current,
                                                    [group.id]: { ...optionDraft, nameAr: value },
                                                  }))
                                                }
                                              />
                                            ),
                                            en: (
                                              <TextField
                                                label={t('menu.optionNameEn')}
                                                value={optionDraft.nameEn}
                                                onChange={(value) =>
                                                  setOptionDrafts((current) => ({
                                                    ...current,
                                                    [group.id]: { ...optionDraft, nameEn: value },
                                                  }))
                                                }
                                              />
                                            ),
                                            fr: (
                                              <TextField
                                                label={t('menu.optionNameFr')}
                                                value={optionDraft.nameFr}
                                                onChange={(value) =>
                                                  setOptionDrafts((current) => ({
                                                    ...current,
                                                    [group.id]: { ...optionDraft, nameFr: value },
                                                  }))
                                                }
                                              />
                                            ),
                                          }}
                                        />
                                      </TranslationFields>
                                    </div>

                                    <button
                                      type="button"
                                      className="ghost-btn small mt-4"
                                      disabled={saving}
                                      onClick={() => void handleCreateOption(group)}
                                    >
                                      <Plus size={14} />
                                      <span>{t('menu.addOption')}</span>
                                    </button>
                                  </div>

                                  <div className="mt-4 space-y-3">
                                    {group.options.map((option) => {
                                      const optionEdit = getOptionEdit(option);

                                      return (
                                        <div
                                          key={option.id}
                                          className="rounded-[24px] border border-slate-200 bg-slate-50 p-4"
                                        >
                                          <div className="grid gap-3">
                                            <TextField
                                              label={t('menu.priceDelta')}
                                              value={optionEdit.priceDelta}
                                              onChange={(value) =>
                                                setOptionEdits((current) => ({
                                                  ...current,
                                                  [option.id]: {
                                                    ...optionEdit,
                                                    priceDelta: value,
                                                  },
                                                }))
                                              }
                                              type="number"
                                            />

                                            <TranslationFields title={t('menu.localizedNames')}>
                                              <TranslationPane
                                                activeLanguage={translationPanelLanguage}
                                                children={{
                                                  ar: (
                                                    <TextField
                                                      label={t('menu.optionNameAr')}
                                                      value={optionEdit.nameAr}
                                                      onChange={(value) =>
                                                        setOptionEdits((current) => ({
                                                          ...current,
                                                          [option.id]: {
                                                            ...optionEdit,
                                                            nameAr: value,
                                                          },
                                                        }))
                                                      }
                                                    />
                                                  ),
                                                  en: (
                                                    <TextField
                                                      label={t('menu.optionNameEn')}
                                                      value={optionEdit.nameEn}
                                                      onChange={(value) =>
                                                        setOptionEdits((current) => ({
                                                          ...current,
                                                          [option.id]: {
                                                            ...optionEdit,
                                                            nameEn: value,
                                                          },
                                                        }))
                                                      }
                                                    />
                                                  ),
                                                  fr: (
                                                    <TextField
                                                      label={t('menu.optionNameFr')}
                                                      value={optionEdit.nameFr}
                                                      onChange={(value) =>
                                                        setOptionEdits((current) => ({
                                                          ...current,
                                                          [option.id]: {
                                                            ...optionEdit,
                                                            nameFr: value,
                                                          },
                                                        }))
                                                      }
                                                    />
                                                  ),
                                                }}
                                              />
                                            </TranslationFields>
                                          </div>

                                          <div className="mt-4 flex flex-wrap gap-2">
                                            <button
                                              type="button"
                                              className="ghost-btn small"
                                              disabled={saving}
                                              onClick={() => void handleSaveOption(option)}
                                            >
                                              <Save size={14} />
                                              <span>{t('menu.saveOption')}</span>
                                            </button>
                                            <button
                                              type="button"
                                              className="ghost-btn small text-rose-600"
                                              disabled={saving}
                                              onClick={() => void handleArchiveOption(option)}
                                            >
                                              <Trash2 size={14} />
                                              <span>{t('menu.deleteOption')}</span>
                                            </button>
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              );
                            })()
                            ) : (
                              <>
                                <div className="menu-selection-list space-y-3">
                                  {(selectedItem?.modifierGroups ?? []).length ? (
                                    (selectedItem?.modifierGroups ?? []).map((group) => (
                                      <SelectionCard
                                        key={group.id}
                                        active={false}
                                        title={localizeEntityName(group, language)}
                                        subtitle={`${group.options.length} ${t('menu.modifierGroupsCount')}`}
                                        caption={group.required ? t('menu.requiredToggle') : ''}
                                        onClick={() => setSelectedGroupId(group.id)}
                                        focused={isFocusedMenuRoute}
                                      />
                                    ))
                                  ) : (
                                    <EmptyStateCard message={t('menu.noModifierGroups')} />
                                  )}
                                </div>

                                <div className="rounded-[28px] border border-slate-200 bg-slate-50 p-4">
                                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 mb-3">
                                    {t('menu.createGroup')}
                                  </p>
                                  <div className="grid gap-3">
                                    <div className="space-y-2">
                                      <span className="block text-sm font-medium text-slate-500">
                                        {t('menu.requiredToggle')}
                                      </span>
                                      <div className="flex h-[50px] items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-700">
                                        <span className="font-medium text-slate-600">{t('menu.requiredToggle')}</span>
                                        <button
                                          type="button"
                                          role="switch"
                                          aria-checked={groupDraft.required}
                                          className={`w-11 h-6 rounded-full relative transition-colors duration-200 outline-none ${
                                            groupDraft.required ? 'bg-[var(--admin-primary)]' : 'bg-slate-200'
                                          }`}
                                          onClick={() =>
                                            setGroupDraft((current) => ({
                                              ...current,
                                              required: !current.required,
                                            }))
                                          }
                                        >
                                          <span
                                            className={`absolute left-0.5 top-0.5 w-5 h-5 bg-white rounded-full transition-transform duration-200 shadow-sm ${
                                              groupDraft.required ? 'translate-x-5' : ''
                                            }`}
                                          />
                                        </button>
                                      </div>
                                    </div>

                                    <TranslationFields title={t('menu.localizedNames')}>
                                      <TranslationPane
                                        activeLanguage={translationPanelLanguage}
                                        children={{
                                          ar: (
                                            <TextField
                                              label={t('menu.modifierGroupNameAr')}
                                              value={groupDraft.nameAr}
                                              onChange={(value) =>
                                                setGroupDraft((current) => ({ ...current, nameAr: value }))
                                              }
                                            />
                                          ),
                                          en: (
                                            <TextField
                                              label={t('menu.modifierGroupNameEn')}
                                              value={groupDraft.nameEn}
                                              onChange={(value) =>
                                                setGroupDraft((current) => ({ ...current, nameEn: value }))
                                              }
                                            />
                                          ),
                                          fr: (
                                            <TextField
                                              label={t('menu.modifierGroupNameFr')}
                                              value={groupDraft.nameFr}
                                              onChange={(value) =>
                                                setGroupDraft((current) => ({ ...current, nameFr: value }))
                                              }
                                            />
                                          ),
                                        }}
                                      />
                                    </TranslationFields>

                                    <div className="grid gap-3 md:grid-cols-2">
                                      <TextField
                                        label={t('menu.minSelections')}
                                        value={groupDraft.minSelections}
                                        onChange={(value) =>
                                          setGroupDraft((current) => ({
                                            ...current,
                                            minSelections: value,
                                          }))
                                        }
                                        type="number"
                                      />
                                      <TextField
                                        label={t('menu.maxSelections')}
                                        value={groupDraft.maxSelections}
                                        onChange={(value) =>
                                          setGroupDraft((current) => ({
                                            ...current,
                                            maxSelections: value,
                                          }))
                                        }
                                        type="number"
                                      />
                                    </div>
                                  </div>

                                  <button
                                    type="button"
                                    className="primary-btn mt-4"
                                    disabled={saving}
                                    onClick={() => void handleCreateGroup()}
                                  >
                                    <Plus size={16} />
                                    <span>{t('menu.createGroup')}</span>
                                  </button>
                                </div>
                              </>
                            )}

                          </div>
                        ) : (
                          <div className="mt-4 rounded-[28px] border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-slate-500">
                            {t('menu.selectItemPrompt')}
                          </div>
                        )}
                      </div>
                    </div>
                      </div>
                    </div>
                  ) : null}
                </div>
              </section>
            ) : null}
          </div>
          </div>
        </section>
      )}


    </div>
  );
}
