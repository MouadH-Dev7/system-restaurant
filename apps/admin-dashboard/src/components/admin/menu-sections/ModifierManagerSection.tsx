'use client';

import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Plus, Save, Trash2 } from 'lucide-react';
import type { MenuDTO, MenuItemDTO, ModifierGroupDTO, ModifierOptionDTO } from '@repo/shared-types';
import { useI18n } from '@/hooks/use-i18n';
import type {
  GroupDraft,
  OptionDraft,
  ModifierMenuFilter,
  TranslationPanelLanguage,
  LanguageKey,
} from '../menu-types';
import {
  emptyGroupDraft,
  emptyOptionDraft,
  toGroupDraft,
  toOptionDraft,
  localizeEntityName,
} from '../menu-helpers';
import {
  TextField,
  TranslationFields,
  TranslationPane,
  EmptyStateCard,
  SelectionCard,
} from '../menu-primitives';

type ModifierManagerSectionProps = {
  menus: MenuDTO[];
  menuItems: MenuItemDTO[];
  selectedMenuId: string | null;
  onSelectedMenuIdChange: (id: string | null) => void;
  selectedItemId: string | null;
  onSelectedItemIdChange: (id: string | null) => void;
  selectedItem: MenuItemDTO | null;
  itemsForSelectedMenu: MenuItemDTO[];
  itemCountByMenu: Map<string, number>;
  isFocusedMenuRoute: boolean;
  activeLang: TranslationPanelLanguage;
  saving: boolean;
  language: LanguageKey;
  onCreateGroup: (draft: GroupDraft) => void;
  onSaveGroup: (group: ModifierGroupDTO, draft: GroupDraft) => void;
  onDeleteGroup: (group: ModifierGroupDTO) => void;
  onCreateOption: (group: ModifierGroupDTO, draft: OptionDraft) => void;
  onSaveOption: (option: ModifierOptionDTO, draft: OptionDraft) => void;
  onArchiveOption: (option: ModifierOptionDTO) => void;
};

export function ModifierManagerSection({
  menus,
  menuItems,
  selectedMenuId,
  onSelectedMenuIdChange,
  selectedItemId,
  onSelectedItemIdChange,
  selectedItem,
  itemsForSelectedMenu,
  itemCountByMenu,
  isFocusedMenuRoute,
  activeLang,
  saving,
  language,
  onCreateGroup,
  onSaveGroup,
  onDeleteGroup,
  onCreateOption,
  onSaveOption,
  onArchiveOption,
}: ModifierManagerSectionProps) {
  const { t, formatCurrency } = useI18n();

  const [groupDraft, setGroupDraft] = useState<GroupDraft>(emptyGroupDraft);
  const [groupEdits, setGroupEdits] = useState<Record<string, GroupDraft>>({});
  const [optionDrafts, setOptionDrafts] = useState<Record<string, OptionDraft>>({});
  const [optionEdits, setOptionEdits] = useState<Record<string, OptionDraft>>({});
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [modifierMenuFilter, setModifierMenuFilter] = useState<ModifierMenuFilter>('');

  const modifierSelectedMenuItems = useMemo(() => {
    if (!modifierMenuFilter) {
      return menuItems;
    }
    return menuItems.filter((item) => item.menuId === modifierMenuFilter);
  }, [menuItems, modifierMenuFilter]);

  function getGroupEdit(group: ModifierGroupDTO) {
    return groupEdits[group.id] ?? toGroupDraft(group);
  }

  function getOptionEdit(option: ModifierOptionDTO) {
    return optionEdits[option.id] ?? toOptionDraft(option);
  }

  function getOptionDraft(groupId: string) {
    return optionDrafts[groupId] ?? emptyOptionDraft;
  }

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
      onSelectedItemIdChange(modifierSelectedMenuItems[0]?.id ?? null);
    }
  }, [modifierMenuFilter, modifierSelectedMenuItems, selectedItemId, onSelectedItemIdChange]);

  useEffect(() => {
    setSelectedGroupId(null);
  }, [selectedItemId]);

  useEffect(() => {
    setSelectedGroupId(null);
  }, [selectedMenuId]);

  return (
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
                    onClick={() => onSelectedMenuIdChange(menu.id)}
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
                      onClick={() => onSelectedItemIdChange(item.id)}
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
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-3">
                  <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                    {t('menu.selectMenu')}
                  </span>
                  <div className="max-h-60 space-y-2 overflow-y-auto rounded-2xl border border-slate-200 bg-slate-50 p-2">
                    <SelectionCard
                      active={!modifierMenuFilter}
                      title={t('menu.selectMenu')}
                      subtitle=""
                      onClick={() => {
                        setModifierMenuFilter('');
                        onSelectedItemIdChange(null);
                      }}
                    />
                    {menus.map((menu) => (
                      <SelectionCard
                        key={menu.id}
                        active={menu.id === modifierMenuFilter}
                        title={localizeEntityName(menu, language)}
                        subtitle={`${itemCountByMenu.get(menu.id) ?? 0} ${t('menu.itemsCount')}`}
                        imageSrc={menu.image}
                        onClick={() => {
                          setModifierMenuFilter(menu.id);
                          onSelectedItemIdChange(null);
                        }}
                      />
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                    {t('menu.selectItemPrompt')}
                  </span>
                  <div className="max-h-60 space-y-2 overflow-y-auto rounded-2xl border border-slate-200 bg-slate-50 p-2">
                    {modifierSelectedMenuItems.length ? (
                      modifierSelectedMenuItems.map((item) => (
                        <SelectionCard
                          key={item.id}
                          active={item.id === selectedItemId}
                          title={localizeEntityName(item, language)}
                          subtitle=""
                          imageSrc={item.image}
                          onClick={() => onSelectedItemIdChange(item.id)}
                        />
                      ))
                    ) : (
                      <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-center text-sm text-slate-500">
                        {t('menu.selectMenu')}
                      </div>
                    )}
                  </div>
                </div>
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
                              activeLanguage={activeLang}
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
                                            onClick={() => onSaveGroup(group, getGroupEdit(group))}
                                          >
                                            <Save size={14} />
                                            <span>{t('menu.saveGroup')}</span>
                                          </button>
                                          <button
                                            type="button"
                                            className="ghost-btn small text-rose-600"
                                            disabled={saving}
                                            onClick={() => onDeleteGroup(group)}
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
                                activeLanguage={activeLang}
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
                                            onClick={() => onCreateOption(group, getOptionDraft(group.id))}
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
                                      activeLanguage={activeLang}
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
                                                    onClick={() => onSaveOption(option, getOptionEdit(option))}
                                  >
                                    <Save size={14} />
                                    <span>{t('menu.saveOption')}</span>
                                  </button>
                                  <button
                                    type="button"
                                    className="ghost-btn small text-rose-600"
                                    disabled={saving}
                                                    onClick={() => onArchiveOption(option)}
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
                            activeLanguage={activeLang}
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
                                        onClick={() => onCreateGroup(groupDraft)}
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
  );
}
