'use client';

import { useEffect, useMemo, useState } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import type { MenuDTO, MenuItemDTO, ModifierGroupDTO, ModifierOptionDTO } from '@repo/shared-types';
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
import type {
  MenuDraft,
  ItemDraft,
  GroupDraft,
  OptionDraft,
  MenuWorkflowMode,
  MenuWorkspaceSection,
  MenuEditorTab,
  TranslationPanelLanguage,
  MenuScreenProps,
} from './menu-types';
import {
  themePresets,
  emptyMenuDraft,
  emptyItemDraft,
  toNumber,
  optionalText,
  resolvePrimaryDescription,
  localizeEntityName,
  toMenuDraft,
  toItemDraft,
} from './menu-helpers';
import {
  TextField,
  TextAreaField,
  SimpleImagePreview,
  TranslationFields,
  TranslationLanguageSwitcher,
  TranslationPane,
  TabButton,
  EmptyStateCard,
  SelectionCard,
  ThemePresetCard,
} from './menu-primitives';
import { MenuAddSection, MenuEditSection, ItemAddSection, ItemEditSection, ModifierManagerSection, RecipeManagerSection } from './menu-sections';

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
  const [workflowMode, setWorkflowMode] = useState<MenuWorkflowMode>(initialWorkflowMode ?? 'add');
  const [activeSection, setActiveSection] = useState<MenuWorkspaceSection>(initialSection ?? 'menus');
  const [menuEditorTab, setMenuEditorTab] = useState<MenuEditorTab>('general');
  const [translationPanelLanguage, setTranslationPanelLanguage] =
    useState<TranslationPanelLanguage>('ar');
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

  const isAddMenuSection = workflowMode === 'add' && activeSection === 'menus';
  const isEditMenuSection = workflowMode === 'edit' && activeSection === 'menus';
  const isAddItemSection = workflowMode === 'add' && activeSection === 'items';
  const isEditItemSection = workflowMode === 'edit' && activeSection === 'items';
  const isModifierSection = activeSection === 'modifiers';
  const isRecipeSection = activeSection === 'recipe';
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
    setNewItemDraft((current) => ({
      ...current,
      menuId: current.menuId || selectedMenuId || '',
    }));
  }, [selectedMenuId]);

  useEffect(() => {
    setSelectedItemId(null);
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
        description: optionalText(resolvePrimaryDescription(newMenuDraft)),
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
        description: optionalText(resolvePrimaryDescription(menuEditor)),
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
        description: optionalText(resolvePrimaryDescription(newItemDraft)),
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

  async function handleCreateGroup(draft: GroupDraft) {
    if (!restaurantId || !selectedItem || !requireLanguages(draft)) {
      return;
    }

    await runAction(() =>
      createModifierGroup({
        restaurantId,
        menuItemId: selectedItem.id,
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

  async function handleSaveGroup(group: ModifierGroupDTO, draft: GroupDraft) {
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

  async function handleCreateOption(group: ModifierGroupDTO, draft: OptionDraft) {
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
  }

  async function handleSaveOption(option: ModifierOptionDTO, draft: OptionDraft) {
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
                active={activeSection === 'recipe'}
                label={t('menu.recipe')}
                onClick={() => setActiveSection('recipe')}
              />
            ) : null}
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
          {!(isFocusedMenuRoute && (isAddMenuSection || isEditMenuSection || isModifierSection || isRecipeSection)) && (
          <aside className="menu-workspace-sidebar space-y-4">
            {isAddMenuSection && !isFocusedMenuRoute ? (
              <MenuAddSection
                draft={newMenuDraft}
                onDraftChange={setNewMenuDraft}
                activeLang={translationPanelLanguage}
                saving={saving}
                isFocusedMenuRoute={isFocusedMenuRoute}
                onSave={() => void handleCreateMenu()}
              />
            ) : null}
            {isAddMenuSection && isFocusedMenuRoute ? (
              <aside className="menu-workspace-sidebar space-y-4">
                <div className="panel menu-browser-panel">
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
              </aside>
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
                {(isAddItemSection || isEditItemSection || (isModifierSection && !isFocusedMenuRoute) || isRecipeSection) && selectedMenuId ? (
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
              <MenuAddSection
                draft={newMenuDraft}
                onDraftChange={setNewMenuDraft}
                activeLang={translationPanelLanguage}
                saving={saving}
                isFocusedMenuRoute={isFocusedMenuRoute}
                onSave={() => void handleCreateMenu()}
                menus={menus}
                itemCountByMenu={itemCountByMenu}
                selectedMenuId={selectedMenuId}
                onSelectedMenuIdChange={setSelectedMenuId}
                language={language}
              />
            ) : null}
            {isEditMenuSection || isThemeSection ? (
              <MenuEditSection
                draft={menuEditor}
                onDraftChange={setMenuEditor}
                activeLang={translationPanelLanguage}
                saving={saving}
                isFocusedMenuRoute={isFocusedMenuRoute}
                selectedMenu={selectedMenu}
                onSave={() => void handleSaveMenu()}
                onArchive={() => void handleArchiveMenu()}
              />
            ) : null}

            {isRecipeSection ? (
              <RecipeManagerSection menuItemId={selectedItemId} />
            ) : null}

            {isAddItemSection || isEditItemSection || isModifierSection ? (
              <section className="menu-detail-grid">
                <div className="menu-detail-sidebar space-y-4">
                  {isAddItemSection ? (
                      <ItemAddSection
                        draft={newItemDraft}
                        onDraftChange={setNewItemDraft}
                        menus={menus}
                        selectedMenuId={selectedMenuId}
                        onSelectedMenuIdChange={setSelectedMenuId}
                        activeLang={translationPanelLanguage}
                        saving={saving}
                        onSave={() => void handleCreateItem()}
                      />
                  ) : null}
                </div>

                <div className="menu-detail-main space-y-4">
                  {isEditItemSection ? (
                    selectedItem ? (
                      <ItemEditSection
                        draft={itemEditor}
                        onDraftChange={setItemEditor}
                        menus={menus}
                        selectedMenuId={selectedMenuId}
                        onSelectedMenuIdChange={setSelectedMenuId}
                        activeLang={translationPanelLanguage}
                        saving={saving}
                        selectedItem={selectedItem}
                        onSave={() => void handleSaveItem()}
                        onArchive={() => void handleArchiveItem()}
                      />
                    ) : (
                      <div className="mt-4 rounded-[28px] border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-slate-500">
                        {t('menu.selectItemPrompt')}
                      </div>
                    )
                  ) : null}

                  {isModifierSection ? (
                    <ModifierManagerSection
                      menus={menus}
                      menuItems={menuItems}
                      selectedMenuId={selectedMenuId}
                      onSelectedMenuIdChange={setSelectedMenuId}
                      selectedItemId={selectedItemId}
                      onSelectedItemIdChange={setSelectedItemId}
                      selectedItem={selectedItem}
                      itemsForSelectedMenu={itemsForSelectedMenu}
                      itemCountByMenu={itemCountByMenu}
                      isFocusedMenuRoute={isFocusedMenuRoute}
                      activeLang={translationPanelLanguage}
                      saving={saving}
                      language={language}
                      onCreateGroup={(draft) => { void handleCreateGroup(draft); }}
                      onSaveGroup={(group, draft) => { void handleSaveGroup(group, draft); }}
                      onDeleteGroup={(group) => { void handleDeleteGroup(group); }}
                      onCreateOption={(group, draft) => { void handleCreateOption(group, draft); }}
                      onSaveOption={(option, draft) => { void handleSaveOption(option, draft); }}
                      onArchiveOption={(option) => { void handleArchiveOption(option); }}
                    />
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
