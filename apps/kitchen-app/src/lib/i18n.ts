import type {
  MenuDTO,
  MenuItemDTO,
  ModifierGroupDTO,
  ModifierOptionDTO,
  OrderItemModifierDTO,
  OrderResponse,
} from '@repo/shared-types';
import { OrderType } from '@repo/shared-types';
import type { KitchenLanguage } from '@/store/app.store';

type KitchenDictionary = {
  brandStation: string;
  stationLabel: string;
  dashboard: string;
  availability: string;
  pending: string;
  preparing: string;
  ready: string;
  startPreparing: string;
  markReady: string;
  completeOrder: string;
  live: string;
  connecting: string;
  offline: string;
  syncIdle: string;
  syncAgo: string;
  newOrder: string;
  availabilityTitle: string;
  availabilitySubtitle: string;
  allMenus: string;
  availabilityLoadError: string;
  loadingMenuItems: string;
  available: string;
  finished: string;
  markFinished: string;
  returnToMenu: string;
  modifierOptionsTitle: string;
  modifierOptionsSubtitle: string;
  noModifierOptions: string;
  unavailableAddonsOnly: string;
  hideOption: string;
  returnOption: string;
  required: string;
  optional: string;
  updating: string;
  menuLabel: string;
  itemFallback: string;
  language: string;
  english: string;
  french: string;
  arabic: string;
  tableGroup: string;
  externalOrder: string;
  ticketSingular: string;
  ticketPlural: string;
  orderedAt: string;
  readyBadge: string;
  orderItems: string;
  dineIn: string;
  takeaway: string;
  delivery: string;
  notes: string;
  table: string;
};

const dictionary: Record<KitchenLanguage, KitchenDictionary> = {
  en: {
    brandStation: 'Khalou-Fodil',
    stationLabel: 'Kitchen',
    dashboard: 'Dashboard',
    availability: 'Availability',
    pending: 'Pending',
    preparing: 'Preparing',
    ready: 'Ready',
    startPreparing: 'Start Preparing',
    markReady: 'Mark Ready',
    completeOrder: 'Complete Order',
    live: 'Live',
    connecting: 'Connecting',
    offline: 'Offline',
    syncIdle: 'SYNC: --',
    syncAgo: 'SYNC: {{seconds}}s ago',
    newOrder: 'New order!',
    availabilityTitle: 'Menu Availability Control',
    availabilitySubtitle:
      'Hide finished dishes from the customer menu, or return them when they are available again.',
    allMenus: 'All menus',
    availabilityLoadError: 'Menu availability panel could not be loaded.',
    loadingMenuItems: 'Loading menu items...',
    available: 'Available',
    finished: 'Finished',
    markFinished: 'Mark as finished',
    returnToMenu: 'Return to menu',
    modifierOptionsTitle: 'Dish add-ons availability',
    modifierOptionsSubtitle: 'Control modifier options separately from the main dish.',
    noModifierOptions: 'No add-ons for this dish.',
    unavailableAddonsOnly: 'Unavailable add-ons only',
    hideOption: 'Hide option',
    returnOption: 'Return option',
    required: 'Required',
    optional: 'Optional',
    updating: 'Updating...',
    menuLabel: 'Menu',
    itemFallback: 'Item',
    language: 'Language',
    english: 'English',
    french: 'French',
    arabic: 'Arabic',
    tableGroup: 'Table group',
    externalOrder: 'External order',
    ticketSingular: 'ticket',
    ticketPlural: 'tickets',
    orderedAt: 'Ordered {{time}}',
    readyBadge: 'Ready',
    orderItems: 'Order items',
    dineIn: 'Dine-in',
    takeaway: 'Takeaway',
    delivery: 'Delivery',
    notes: 'Notes',
    table: 'Table',
  },
  fr: {
    brandStation: 'Khalou-Fodil',
    stationLabel: 'Cuisine',
    dashboard: 'Tableau',
    availability: 'Disponibilite',
    pending: 'En attente',
    preparing: 'En preparation',
    ready: 'Pret',
    startPreparing: 'Commencer',
    markReady: 'Marquer pret',
    completeOrder: 'Terminer commande',
    live: 'En direct',
    connecting: 'Connexion',
    offline: 'Hors ligne',
    syncIdle: 'SYNC: --',
    syncAgo: 'SYNC: il y a {{seconds}}s',
    newOrder: 'Nouvelle commande !',
    availabilityTitle: 'Controle de disponibilite',
    availabilitySubtitle:
      "Masquez les plats termines du menu client ou remettez-les en ligne lorsqu'ils reviennent.",
    allMenus: 'Tous les menus',
    availabilityLoadError: "Le panneau de disponibilite n'a pas pu etre charge.",
    loadingMenuItems: 'Chargement des plats...',
    available: 'Disponible',
    finished: 'Termine',
    markFinished: 'Marquer termine',
    returnToMenu: 'Remettre au menu',
    modifierOptionsTitle: 'Disponibilite des supplements',
    modifierOptionsSubtitle: 'Controlez les options separement du plat principal.',
    noModifierOptions: 'Aucun supplement pour ce plat.',
    unavailableAddonsOnly: 'Supplements indisponibles فقط',
    hideOption: 'Masquer option',
    returnOption: 'Remettre option',
    required: 'Obligatoire',
    optional: 'Optionnel',
    updating: 'Mise a jour...',
    menuLabel: 'Menu',
    itemFallback: 'Article',
    language: 'Langue',
    english: 'Anglais',
    french: 'Francais',
    arabic: 'Arabe',
    tableGroup: 'Groupe de table',
    externalOrder: 'Commande externe',
    ticketSingular: 'ticket',
    ticketPlural: 'tickets',
    orderedAt: 'Commande a {{time}}',
    readyBadge: 'Pret',
    orderItems: 'Articles',
    dineIn: 'Sur place',
    takeaway: 'A emporter',
    delivery: 'Livraison',
    notes: 'Notes',
    table: 'Table',
  },
  ar: {
    brandStation: 'Khalou-Fodil',
    stationLabel: '\u0627\u0644\u0645\u0637\u0628\u062e',
    dashboard: '\u0644\u0648\u062d\u0629 \u0627\u0644\u0645\u0637\u0628\u062e',
    availability: '\u062a\u0648\u0641\u0631 \u0627\u0644\u0623\u0637\u0628\u0627\u0642',
    pending: '\u0642\u064a\u062f \u0627\u0644\u0627\u0646\u062a\u0638\u0627\u0631',
    preparing: '\u0642\u064a\u062f \u0627\u0644\u062a\u062d\u0636\u064a\u0631',
    ready: '\u062c\u0627\u0647\u0632',
    startPreparing: '\u0627\u0628\u062f\u0623 \u0627\u0644\u062a\u062d\u0636\u064a\u0631',
    markReady: '\u062a\u0639\u0644\u064a\u0645 \u0643\u062c\u0627\u0647\u0632',
    completeOrder: '\u0625\u0646\u0647\u0627\u0621 \u0627\u0644\u0637\u0644\u0628',
    live: '\u0645\u0628\u0627\u0634\u0631',
    connecting: '\u062c\u0627\u0631\u064d \u0627\u0644\u0627\u062a\u0635\u0627\u0644',
    offline: '\u063a\u064a\u0631 \u0645\u062a\u0635\u0644',
    syncIdle: 'SYNC: --',
    syncAgo: 'SYNC: \u0645\u0646\u0630 {{seconds}}\u062b',
    newOrder: '\u0637\u0644\u0628 \u062c\u062f\u064a\u062f!',
    availabilityTitle: '\u0627\u0644\u062a\u062d\u0643\u0645 \u0641\u064a \u062a\u0648\u0641\u0631 \u0627\u0644\u0623\u0637\u0628\u0627\u0642',
    availabilitySubtitle:
      '\u0623\u062e\u0641\u0650 \u0627\u0644\u0623\u0637\u0628\u0627\u0642 \u0627\u0644\u0645\u0646\u062a\u0647\u064a\u0629 \u0645\u0646 \u0645\u0646\u064a\u0648 \u0627\u0644\u0639\u0645\u064a\u0644 \u0623\u0648 \u0623\u0639\u062f\u0647\u0627 \u0644\u0644\u0638\u0647\u0648\u0631 \u0639\u0646\u062f\u0645\u0627 \u062a\u0635\u0628\u062d \u0645\u062a\u0648\u0641\u0631\u0629 \u0645\u0646 \u062c\u062f\u064a\u062f.',
    allMenus: '\u0643\u0644 \u0627\u0644\u0642\u0648\u0627\u0626\u0645',
    availabilityLoadError: '\u062a\u0639\u0630\u0631 \u062a\u062d\u0645\u064a\u0644 \u0644\u0648\u062d\u0629 \u062a\u0648\u0641\u0631 \u0627\u0644\u0623\u0637\u0628\u0627\u0642.',
    loadingMenuItems: '\u062c\u0627\u0631\u064d \u062a\u062d\u0645\u064a\u0644 \u0627\u0644\u0623\u0637\u0628\u0627\u0642...',
    available: '\u0645\u062a\u0648\u0641\u0631',
    finished: '\u0645\u0646\u062a\u0647\u064d',
    markFinished: '\u062a\u0639\u0644\u064a\u0645 \u0643\u0645\u0646\u062a\u0647\u064d',
    returnToMenu: '\u0625\u0631\u062c\u0627\u0639 \u0625\u0644\u0649 \u0627\u0644\u0645\u0646\u064a\u0648',
    modifierOptionsTitle: '\u062a\u0648\u0641\u0631 \u0625\u0636\u0627\u0641\u0627\u062a \u0627\u0644\u0623\u0637\u0628\u0627\u0642',
    modifierOptionsSubtitle: '\u062a\u062d\u0643\u0645 \u0641\u064a \u0627\u0644\u062e\u064a\u0627\u0631\u0627\u062a \u0628\u0634\u0643\u0644 \u0645\u0633\u062a\u0642\u0644 \u0639\u0646 \u0627\u0644\u0637\u0628\u0642 \u0627\u0644\u0631\u0626\u064a\u0633\u064a.',
    noModifierOptions: '\u0644\u0627 \u062a\u0648\u062c\u062f \u0625\u0636\u0627\u0641\u0627\u062a \u0644\u0647\u0630\u0627 \u0627\u0644\u0637\u0628\u0642.',
    unavailableAddonsOnly: '\u0627\u0644\u0625\u0636\u0627\u0641\u0627\u062a \u063a\u064a\u0631 \u0627\u0644\u0645\u062a\u0648\u0641\u0631\u0629 \u0641\u0642\u0637',
    hideOption: '\u0625\u062e\u0641\u0627\u0621 \u0627\u0644\u062e\u064a\u0627\u0631',
    returnOption: '\u0625\u0631\u062c\u0627\u0639 \u0627\u0644\u062e\u064a\u0627\u0631',
    required: '\u0625\u062c\u0628\u0627\u0631\u064a',
    optional: '\u0627\u062e\u062a\u064a\u0627\u0631\u064a',
    updating: '\u062c\u0627\u0631\u064d \u0627\u0644\u062a\u062d\u062f\u064a\u062b...',
    menuLabel: '\u0627\u0644\u0645\u0646\u064a\u0648',
    itemFallback: '\u0635\u0646\u0641',
    language: '\u0627\u0644\u0644\u063a\u0629',
    english: '\u0627\u0644\u0625\u0646\u062c\u0644\u064a\u0632\u064a\u0629',
    french: '\u0627\u0644\u0641\u0631\u0646\u0633\u064a\u0629',
    arabic: '\u0627\u0644\u0639\u0631\u0628\u064a\u0629',
    tableGroup: '\u0645\u062c\u0645\u0648\u0639\u0629 \u0637\u0627\u0648\u0644\u0629',
    externalOrder: '\u0637\u0644\u0628 \u062e\u0627\u0631\u062c\u064a',
    ticketSingular: '\u062a\u0630\u0643\u0631\u0629',
    ticketPlural: '\u062a\u0630\u0627\u0643\u0631',
    orderedAt: '\u0637\u0644\u0628 \u0639\u0646\u062f {{time}}',
    readyBadge: '\u062c\u0627\u0647\u0632',
    orderItems: '\u0623\u0635\u0646\u0627\u0641 \u0627\u0644\u0637\u0644\u0628',
    dineIn: '\u0635\u0627\u0644\u0629',
    takeaway: '\u0633\u0641\u0631\u064a',
    delivery: '\u062a\u0648\u0635\u064a\u0644',
    notes: '\u0645\u0644\u0627\u062d\u0638\u0627\u062a',
    table: '\u0637\u0627\u0648\u0644\u0629',
  },
};

export function kitchenT(language: KitchenLanguage) {
  return dictionary[language];
}

export function kitchenDir(language: KitchenLanguage) {
  return language === 'ar' ? 'rtl' : 'ltr';
}

export function replaceTemplate(template: string, values: Record<string, string | number>) {
  return Object.entries(values).reduce(
    (result, [key, value]) => result.replace(`{{${key}}}`, String(value)),
    template,
  );
}

function localizedName<T extends { name: string; nameEn?: string | null; nameFr?: string | null; nameAr?: string | null }>(
  entity: T,
  language: KitchenLanguage,
) {
  if (language === 'ar') {
    return entity.nameAr ?? entity.name;
  }

  if (language === 'fr') {
    return entity.nameFr ?? entity.nameEn ?? entity.name;
  }

  return entity.nameEn ?? entity.name;
}

export function localizeMenuName(menu: MenuDTO, language: KitchenLanguage) {
  return localizedName(menu, language);
}

export function localizeMenuItemName(item: MenuItemDTO, language: KitchenLanguage) {
  return localizedName(item, language);
}

export function localizeModifierGroupName(group: ModifierGroupDTO, language: KitchenLanguage) {
  return localizedName(group, language);
}

export function localizeModifierOptionName(option: ModifierOptionDTO, language: KitchenLanguage) {
  return localizedName(option, language);
}

export function localizeModifierName(
  modifier: OrderItemModifierDTO,
  language: KitchenLanguage,
) {
  const groupName =
    language === 'ar'
      ? modifier.groupNameAr ?? modifier.groupName
      : language === 'fr'
        ? modifier.groupNameFr ?? modifier.groupNameEn ?? modifier.groupName
        : modifier.groupNameEn ?? modifier.groupName;
  const optionName =
    language === 'ar'
      ? modifier.optionNameAr ?? modifier.optionName
      : language === 'fr'
        ? modifier.optionNameFr ?? modifier.optionNameEn ?? modifier.optionName
        : modifier.optionNameEn ?? modifier.optionName;

  return groupName ? `${groupName}: ${optionName}` : optionName;
}

export function localizeOrderTypeLabel(
  order: Pick<OrderResponse, 'orderType' | 'table'>,
  language: KitchenLanguage,
) {
  const t = kitchenT(language);

  if (order.orderType === OrderType.DELIVERY) {
    return t.delivery;
  }

  if (order.orderType === OrderType.TAKEAWAY) {
    return t.takeaway;
  }

  const tableNumber = order.table?.number ?? 0;
  return `${t.table} ${tableNumber}`;
}

export function localizeOrderChannel(
  order: Pick<OrderResponse, 'orderType'>,
  language: KitchenLanguage,
) {
  const t = kitchenT(language);

  if (order.orderType === OrderType.DELIVERY) {
    return t.delivery;
  }

  if (order.orderType === OrderType.TAKEAWAY) {
    return t.takeaway;
  }

  return t.dineIn;
}

export function localizeGroupLabel(
  group: { isExternal: boolean; tableNumber: number; label: string },
  language: KitchenLanguage,
) {
  const t = kitchenT(language);

  if (!group.isExternal) {
    return `${t.table} ${group.tableNumber}`;
  }

  if (group.label === 'Delivery') {
    return t.delivery;
  }

  if (group.label === 'Takeaway') {
    return t.takeaway;
  }

  return t.externalOrder;
}
