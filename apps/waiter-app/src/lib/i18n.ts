import type {
  MenuDTO,
  MenuItemDTO,
  ModifierGroupDTO,
  ModifierOptionDTO,
  OrderResponse,
  TableDTO,
} from '@repo/shared-types';
import type { DraftLine, DraftModifierDetail } from '@/store/waiter.store';
import type { Language } from '@repo/i18n';

type WaiterLanguage = Language;

type WaiterDictionary = {
  waiterService: string;
  loadingServiceData: string;
  loadingFloorMenuTickets: string;
  connectionError: string;
  retryLoad: string;
  signOut: string;
  service: string;
  tracking: string;
  tickets: string;
  tables: string;
  live: string;
  diningRoom: string;
  activeTables: string;
  readyOrders: string;
  needPayment: string;
  lastSync: string;
  searchTablePlaceholder: string;
  table: string;
  active: string;
  ready: string;
  waitingPayment: string;
  reserved: string;
  available: string;
  seats: string;
  seat: string;
  items: string;
  item: string;
  waiting: string;
  restaurantWaiterConsole: string;
  selectTable: string;
  waiterDescription: string;
  noReadyAlerts: string;
  readyForPickup: string;
  waiterCalledTable: string;
  orderReadyTable: string;
  activeService: string;
  trackTableOrders: string;
  trackOrdersHint: string;
  noOrdersForTracking: string;
  trackingOrdersCount: string;
  trackingUpdatedLive: string;
  newTicketDraft: string;
  draftOnly: string;
  kitchenPipeline: string;
  saveDraft: string;
  clearDraft: string;
  localDraftSaved: string;
  allMenu: string;
  requiredOptions: string;
  selectAtLeast: string;
  selectAtMost: string;
  selectTableBeforeAdding: string;
  addAtLeastOneItem: string;
  itemAddedToTable: string;
  ticketUpdated: string;
  ticketSent: string;
  failedSendToKitchen: string;
  tableWaitingPaymentFeedback: string;
  failedDelivered: string;
  paymentCompleted: string;
  failedPayment: string;
  chefChoice: string;
  customizable: string;
  featured: string;
  customize: string;
  quickAdd: string;
  currentTicket: string;
  tableSummary: string;
  totalOrders: string;
  peopleCount: string;
  preparingCount: string;
  readyCountLabel: string;
  addNewOrder: string;
  originalOrderLocked: string;
  additionalOrders: string;
  primaryOrder: string;
  orderTimeline: string;
  createdAtLabel: string;
  acceptedAtLabel: string;
  preparingAtLabel: string;
  readyAtLabel: string;
  deliveredAtLabel: string;
  duplicateItemWarning: string;
  duplicateItemAdded: string;
  duplicateItemIgnored: string;
  orderStatus: string;
  localDraft: string;
  addItemsToStart: string;
  kitchenNote: string;
  kitchenNotePlaceholder: string;
  subtotal: string;
  tax: string;
  total: string;
  savingTicket: string;
  updateKitchenTicket: string;
  sendToKitchen: string;
  updating: string;
  markDelivered: string;
  processing: string;
  payNow: string;
  kitchenNotes: string;
  posSync: string;
  realtime: string;
  customizeItem: string;
  chooseModifiers: string;
  stepPending: string;
  stepPreparing: string;
  stepReady: string;
  stepDelivered: string;
  qtyLabel: string;
  notesLabel: string;
  addonsLabel: string;
  selected: string;
  included: string;
  cancel: string;
  addToTicket: string;
  activeTicket: string;
  floorStaff: string;
  socket: string;
  statusAvailable: string;
  statusReserved: string;
  statusOccupied: string;
  noDescription: string;
  language: string;
  english: string;
  french: string;
  arabic: string;
};

const dictionary: Record<WaiterLanguage, Partial<WaiterDictionary>> = {
  en: {
    waiterService: 'Waiter Service',
    loadingServiceData: 'Loading service data',
    loadingFloorMenuTickets: 'Loading floor, menu, and live tickets',
    connectionError: 'Waiter app cannot load restaurant data',
    retryLoad: 'Retry',
    signOut: 'Sign out',
    service: 'Service',
    tracking: 'Tracking',
    tickets: 'Tickets',
    tables: 'Tables',
    live: 'Live',
    diningRoom: 'Dining Room',
    activeTables: 'Active tables',
    readyOrders: 'Ready orders',
    needPayment: 'Need payment',
    lastSync: 'Last sync',
    searchTablePlaceholder: 'Search table number',
    table: 'Table',
    active: 'Active',
    ready: 'Ready',
    waitingPayment: 'Waiting Payment',
    reserved: 'Reserved',
    available: 'Available',
    seats: 'seats',
    seat: 'seat',
    items: 'items',
    item: 'item',
    waiting: 'Waiting',
    restaurantWaiterConsole: 'Restaurant Waiter Console',
    selectTable: 'Select a table',
    waiterDescription:
      'Live menu service for floor staff, connected to the restaurant backend and real-time order feed.',
    noReadyAlerts: 'No ready alerts',
    readyForPickup: '{{count}} ready for pickup',
    waiterCalledTable: 'Table {{table}} is calling a waiter',
    orderReadyTable: 'Order #{{ticket}} for table {{table}} is ready to serve',
    activeService: 'Active service',
    trackTableOrders: 'Track table orders',
    trackOrdersHint: 'Choose a table to follow every order and its kitchen progress in real time.',
    noOrdersForTracking: 'No active orders for this table yet.',
    trackingOrdersCount: '{{count}} active order(s) on this table',
    trackingUpdatedLive: 'Updated live from kitchen',
    newTicketDraft: 'New ticket draft',
    draftOnly: 'Draft only',
    kitchenPipeline: 'Kitchen pipeline and payment state',
    saveDraft: 'Save Draft',
    clearDraft: 'Clear Draft',
    localDraftSaved: 'Draft for table {{table}} is stored locally in this device',
    allMenu: 'All Menu',
    requiredOptions: 'Select the required options for {{group}}',
    selectAtLeast: 'Select at least {{count}} option(s) for {{group}}',
    selectAtMost: 'Select at most {{count}} option(s) for {{group}}',
    selectTableBeforeAdding: 'Select a table before adding menu items',
    addAtLeastOneItem: 'Add at least one item before sending the ticket',
    itemAddedToTable: 'Added {{item}} to table {{table}}',
    ticketUpdated: 'Ticket #{{ticket}} updated for table {{table}}',
    ticketSent: 'Ticket #{{ticket}} sent to kitchen',
    failedSendToKitchen: 'Failed to send order to kitchen',
    tableWaitingPaymentFeedback: 'Table {{table}} is now waiting for payment',
    failedDelivered: 'Failed to mark the order as delivered',
    paymentCompleted: 'Payment completed for table {{table}}',
    failedPayment: 'Failed to complete the payment',
    chefChoice: 'Chef choice',
    customizable: 'Customizable',
    featured: 'Featured',
    customize: 'Customize',
    quickAdd: 'Quick Add',
    currentTicket: 'Current Ticket',
    tableSummary: 'Table Summary',
    totalOrders: 'Total orders',
    peopleCount: 'Guests',
    preparingCount: 'Preparing',
    readyCountLabel: 'Ready',
    addNewOrder: 'Add New Order',
    originalOrderLocked:
      'Order preparation has started. The original order cannot be changed. You can create an additional order for this table.',
    additionalOrders: 'Additional Orders',
    primaryOrder: 'Primary Order',
    orderTimeline: 'Order Timeline',
    createdAtLabel: 'Created',
    acceptedAtLabel: 'Accepted',
    preparingAtLabel: 'Preparing',
    readyAtLabel: 'Ready',
    deliveredAtLabel: 'Delivered',
    duplicateItemWarning:
      'This item was added very recently. Add it again only if the guest asked for another one.',
    duplicateItemAdded: 'The item was added again to the draft.',
    duplicateItemIgnored: 'The repeated item was ignored.',
    orderStatus: 'Order status',
    localDraft: 'Local draft',
    addItemsToStart: 'Add menu items to start a waiter ticket for this table.',
    kitchenNote: 'Kitchen note',
    kitchenNotePlaceholder: 'For example: no onions, extra spicy, VIP guest',
    subtotal: 'Subtotal',
    tax: 'Tax',
    total: 'Total',
    savingTicket: 'Saving ticket...',
    updateKitchenTicket: 'Update Kitchen Ticket',
    sendToKitchen: 'Send To Kitchen',
    updating: 'Updating...',
    markDelivered: 'Mark Delivered',
    processing: 'Processing...',
    payNow: 'Pay Now',
    kitchenNotes: 'Kitchen Notes',
    posSync: 'POS Sync',
    realtime: 'Realtime',
    customizeItem: 'Customize Item',
    chooseModifiers: 'Choose modifiers and kitchen notes before adding the item to the table ticket.',
    stepPending: 'Pending',
    stepPreparing: 'Preparing',
    stepReady: 'Ready',
    stepDelivered: 'Delivered',
    qtyLabel: 'Qty',
    notesLabel: 'Notes',
    addonsLabel: 'Addons',
    selected: 'Selected',
    included: 'Included',
    cancel: 'Cancel',
    addToTicket: 'Add To Ticket',
    activeTicket: 'Active ticket',
    floorStaff: 'Floor staff',
    socket: 'Socket',
    statusAvailable: 'Available',
    statusReserved: 'Reserved',
    statusOccupied: 'Occupied',
    noDescription: 'Prepared for fast floor service and kitchen routing.',
    language: 'Language',
    english: 'English',
    french: 'French',
    arabic: 'Arabic',
  },
  fr: {
    waiterService: 'Service Serveur',
    loadingServiceData: 'Chargement du service',
    loadingFloorMenuTickets: 'Chargement de la salle, du menu et des tickets en direct',
    connectionError: 'L application serveur ne peut pas charger les donnees du restaurant',
    retryLoad: 'Reessayer',
    signOut: 'Deconnexion',
    service: 'Service',
    tracking: 'Suivi',
    tickets: 'Tickets',
    tables: 'Tables',
    live: 'Live',
    diningRoom: 'Salle',
    activeTables: 'Tables actives',
    readyOrders: 'Commandes pretes',
    needPayment: 'A payer',
    lastSync: 'Derniere synchro',
    searchTablePlaceholder: 'Rechercher un numero de table',
    table: 'Table',
    active: 'Active',
    ready: 'Prete',
    waitingPayment: 'En attente de paiement',
    reserved: 'Reservee',
    available: 'Disponible',
    seats: 'places',
    seat: 'place',
    items: 'articles',
    item: 'article',
    waiting: 'En attente',
    restaurantWaiterConsole: 'Console Serveur Restaurant',
    selectTable: 'Selectionnez une table',
    waiterDescription:
      'Service de menu en direct pour la salle, connecte au backend du restaurant et au flux temps reel.',
    noReadyAlerts: 'Aucune alerte prete',
    readyForPickup: '{{count}} prete(s) a servir',
    waiterCalledTable: 'La table {{table}} appelle un serveur',
    orderReadyTable: 'La commande #{{ticket}} de la table {{table}} est prete a servir',
    activeService: 'Service actif',
    trackTableOrders: 'Suivi des commandes de la table',
    trackOrdersHint: 'Choisissez une table pour suivre chaque commande et son avancement cuisine en temps reel.',
    noOrdersForTracking: 'Aucune commande active pour cette table pour le moment.',
    trackingOrdersCount: '{{count}} commande(s) active(s) sur cette table',
    trackingUpdatedLive: 'Mis a jour en direct depuis la cuisine',
    newTicketDraft: 'Nouveau brouillon de ticket',
    draftOnly: 'Brouillon seulement',
    kitchenPipeline: 'Etat de la cuisine et du paiement',
    saveDraft: 'Enregistrer le brouillon',
    clearDraft: 'Vider le brouillon',
    localDraftSaved: 'Le brouillon de la table {{table}} est enregistre localement sur cet appareil',
    allMenu: 'Tout le menu',
    requiredOptions: 'Selectionnez les options obligatoires pour {{group}}',
    selectAtLeast: 'Selectionnez au moins {{count}} option(s) pour {{group}}',
    selectAtMost: 'Selectionnez au maximum {{count}} option(s) pour {{group}}',
    selectTableBeforeAdding: 'Selectionnez une table avant d ajouter des articles',
    addAtLeastOneItem: 'Ajoutez au moins un article avant d envoyer le ticket',
    itemAddedToTable: '{{item}} ajoute a la table {{table}}',
    ticketUpdated: 'Le ticket #{{ticket}} a ete mis a jour pour la table {{table}}',
    ticketSent: 'Le ticket #{{ticket}} a ete envoye en cuisine',
    failedSendToKitchen: 'Impossible d envoyer la commande en cuisine',
    tableWaitingPaymentFeedback: 'La table {{table}} attend maintenant le paiement',
    failedDelivered: 'Impossible de marquer la commande comme livree',
    paymentCompleted: 'Paiement termine pour la table {{table}}',
    failedPayment: 'Impossible de terminer le paiement',
    chefChoice: 'Choix du chef',
    customizable: 'Personnalisable',
    featured: 'Vedette',
    customize: 'Personnaliser',
    quickAdd: 'Ajout rapide',
    currentTicket: 'Ticket actuel',
    tableSummary: 'Resume de la table',
    totalOrders: 'Total commandes',
    peopleCount: 'Couverts',
    preparingCount: 'En preparation',
    readyCountLabel: 'Pretes',
    addNewOrder: 'Ajouter une nouvelle commande',
    originalOrderLocked:
      'La preparation a deja commence. La commande d origine ne peut plus etre modifiee. Vous pouvez creer une commande supplementaire pour cette table.',
    additionalOrders: 'Commandes supplementaires',
    primaryOrder: 'Commande principale',
    orderTimeline: 'Chronologie',
    createdAtLabel: 'Creation',
    acceptedAtLabel: 'Acceptation',
    preparingAtLabel: 'Preparation',
    readyAtLabel: 'Prete',
    deliveredAtLabel: 'Livree',
    duplicateItemWarning:
      'Cet article a ete ajoute tres recemment. Ajoutez-le a nouveau seulement si le client le veut vraiment.',
    duplicateItemAdded: 'L article a ete ajoute une nouvelle fois au brouillon.',
    duplicateItemIgnored: 'L article repete a ete ignore.',
    orderStatus: 'Statut de commande',
    localDraft: 'Brouillon local',
    addItemsToStart: 'Ajoutez des articles pour demarrer un ticket serveur pour cette table.',
    kitchenNote: 'Note cuisine',
    kitchenNotePlaceholder: 'Exemple : sans oignons, tres epice, client VIP',
    subtotal: 'Sous-total',
    tax: 'Taxe',
    total: 'Total',
    savingTicket: 'Enregistrement du ticket...',
    updateKitchenTicket: 'Mettre a jour le ticket cuisine',
    sendToKitchen: 'Envoyer en cuisine',
    updating: 'Mise a jour...',
    markDelivered: 'Marquer livre',
    processing: 'Traitement...',
    payNow: 'Payer maintenant',
    kitchenNotes: 'Notes cuisine',
    posSync: 'Sync POS',
    realtime: 'Temps reel',
    customizeItem: 'Personnaliser l article',
    chooseModifiers: 'Choisissez les options et notes cuisine avant d ajouter l article au ticket.',
    stepPending: 'En attente',
    stepPreparing: 'Preparation',
    stepReady: 'Prete',
    stepDelivered: 'Servie',
    qtyLabel: 'Qt',
    notesLabel: 'Notes',
    addonsLabel: 'Suppléments',
    selected: 'Selectionne',
    included: 'Inclus',
    cancel: 'Annuler',
    addToTicket: 'Ajouter au ticket',
    activeTicket: 'Ticket actif',
    floorStaff: 'Equipe de salle',
    socket: 'Socket',
    statusAvailable: 'Disponible',
    statusReserved: 'Reservee',
    statusOccupied: 'Occupee',
    noDescription: 'Prepare pour un service rapide en salle et un envoi cuisine immediat.',
    language: 'Langue',
    english: 'Anglais',
    french: 'Francais',
    arabic: 'Arabe',
  },
  ar: {
    waiterService: 'خدمة النادل',
    loadingServiceData: 'جار تحميل بيانات الخدمة',
    loadingFloorMenuTickets: 'جار تحميل الصالة والقائمة والتذاكر المباشرة',
    connectionError: 'تعذر على تطبيق النادل تحميل بيانات المطعم',
    retryLoad: 'إعادة المحاولة',
    signOut: 'تسجيل الخروج',
    service: 'الخدمة',
    tickets: 'التذاكر',
    tables: 'الطاولات',
    live: 'مباشر',
    diningRoom: 'الصالة',
    activeTables: 'الطاولات النشطة',
    readyOrders: 'الطلبات الجاهزة',
    needPayment: 'بانتظار الدفع',
    lastSync: 'آخر مزامنة',
    searchTablePlaceholder: 'ابحث عن رقم الطاولة',
    table: 'طاولة',
    active: 'نشطة',
    ready: 'جاهزة',
    waitingPayment: 'بانتظار الدفع',
    reserved: 'محجوزة',
    available: 'متاحة',
    seats: 'مقاعد',
    seat: 'مقعد',
    items: 'عناصر',
    item: 'عنصر',
    waiting: 'انتظار',
    restaurantWaiterConsole: 'لوحة النادل',
    selectTable: 'اختر طاولة',
    waiterDescription:
      'خدمة قائمة مباشرة لموظفي الصالة، مرتبطة بباك اند المطعم وتحديثات الطلبات الفورية.',
    noReadyAlerts: 'لا توجد تنبيهات جاهزة',
    readyForPickup: '{{count}} جاهز للتقديم',
    waiterCalledTable: 'الطاولة {{table}} تطلب النادل',
    orderReadyTable: 'الطلب #{{ticket}} للطاولة {{table}} جاهز للتقديم',
    activeService: 'الخدمة النشطة',
    trackTableOrders: 'تتبع طلبات الطاولة',
    trackOrdersHint: 'اختر طاولة لمتابعة كل طلب وتقدمه في المطبخ مباشرة.',
    noOrdersForTracking: 'لا توجد طلبات نشطة لهذه الطاولة بعد.',
    trackingOrdersCount: '{{count}} طلب نشط على هذه الطاولة',
    trackingUpdatedLive: 'يتم التحديث مباشرة من المطبخ',
    newTicketDraft: 'مسودة تذكرة جديدة',
    draftOnly: 'مسودة فقط',
    kitchenPipeline: 'حالة المطبخ والدفع',
    saveDraft: 'حفظ المسودة',
    clearDraft: 'مسح المسودة',
    localDraftSaved: 'تم حفظ مسودة الطاولة {{table}} محليًا على هذا الجهاز',
    allMenu: 'كل القائمة',
    requiredOptions: 'اختر الخيارات الإلزامية لـ {{group}}',
    selectAtLeast: 'اختر {{count}} خيار(ات) على الأقل لـ {{group}}',
    selectAtMost: 'اختر {{count}} خيار(ات) كحد أقصى لـ {{group}}',
    selectTableBeforeAdding: 'اختر طاولة قبل إضافة عناصر من القائمة',
    addAtLeastOneItem: 'أضف عنصرًا واحدًا على الأقل قبل إرسال التذكرة',
    itemAddedToTable: 'تمت إضافة {{item}} إلى الطاولة {{table}}',
    ticketUpdated: 'تم تحديث التذكرة رقم {{ticket}} للطاولة {{table}}',
    ticketSent: 'تم إرسال التذكرة رقم {{ticket}} إلى المطبخ',
    failedSendToKitchen: 'تعذر إرسال الطلب إلى المطبخ',
    tableWaitingPaymentFeedback: 'الطاولة {{table}} الآن بانتظار الدفع',
    failedDelivered: 'تعذر تعليم الطلب كمسلّم',
    paymentCompleted: 'اكتمل الدفع للطاولة {{table}}',
    failedPayment: 'تعذر إكمال عملية الدفع',
    chefChoice: 'اختيار الشيف',
    customizable: 'قابل للتخصيص',
    featured: 'مميز',
    customize: 'تخصيص',
    quickAdd: 'إضافة سريعة',
    currentTicket: 'التذكرة الحالية',
    tableSummary: 'ملخص الطاولة',
    totalOrders: 'إجمالي الطلبات',
    peopleCount: 'عدد الأشخاص',
    preparingCount: 'قيد التحضير',
    readyCountLabel: 'جاهزة',
    addNewOrder: 'إضافة طلب جديد',
    originalOrderLocked:
      'تم بدء تحضير الطلب، لا يمكن تعديل الطلب الأصلي. يمكن إنشاء طلب إضافي للطاولة.',
    additionalOrders: 'الطلبات الإضافية',
    primaryOrder: 'الطلب الأساسي',
    orderTimeline: 'سجل الطلب',
    createdAtLabel: 'الإنشاء',
    acceptedAtLabel: 'القبول',
    preparingAtLabel: 'بدء التحضير',
    readyAtLabel: 'الجاهزية',
    deliveredAtLabel: 'التسليم',
    duplicateItemWarning:
      'تمت إضافة هذا الصنف قبل لحظات. أضفه مرة أخرى فقط إذا كان الزبون طلبه فعلًا مرة ثانية.',
    duplicateItemAdded: 'تمت إضافة الصنف مرة أخرى إلى المسودة.',
    duplicateItemIgnored: 'تم تجاهل الإضافة المكررة.',
    orderStatus: 'حالة الطلب',
    localDraft: 'مسودة محلية',
    addItemsToStart: 'أضف عناصر من القائمة لبدء تذكرة النادل لهذه الطاولة.',
    kitchenNote: 'ملاحظة للمطبخ',
    kitchenNotePlaceholder: 'مثال: بدون بصل، حار جدًا، زبون VIP',
    subtotal: 'المجموع الفرعي',
    tax: 'الضريبة',
    total: 'الإجمالي',
    savingTicket: 'جار حفظ التذكرة...',
    updateKitchenTicket: 'تحديث تذكرة المطبخ',
    sendToKitchen: 'إرسال إلى المطبخ',
    updating: 'جار التحديث...',
    markDelivered: 'تعليم كمسلّم',
    processing: 'جار المعالجة...',
    payNow: 'ادفع الآن',
    kitchenNotes: 'ملاحظات المطبخ',
    posSync: 'مزامنة POS',
    realtime: 'لحظي',
    customizeItem: 'تخصيص العنصر',
    chooseModifiers: 'اختر الإضافات وملاحظات المطبخ قبل إضافة العنصر إلى التذكرة.',
    selected: 'تم الاختيار',
    included: 'مشمول',
    cancel: 'إلغاء',
    addToTicket: 'إضافة إلى التذكرة',
    activeTicket: 'التذكرة النشطة',
    floorStaff: 'طاقم الصالة',
    socket: 'الاتصال',
    statusAvailable: 'متاحة',
    statusReserved: 'محجوزة',
    statusOccupied: 'مشغولة',
    noDescription: 'مجهز لخدمة سريعة داخل الصالة وربط فوري مع المطبخ.',
    language: 'اللغة',
    english: 'الإنجليزية',
    french: 'الفرنسية',
    arabic: 'العربية',
  },
};

export function waiterT(language: WaiterLanguage) {
  return {
    ...dictionary.en,
    ...dictionary[language],
  } as WaiterDictionary;
}

export function waiterDir(language: WaiterLanguage) {
  return language === 'ar' ? 'rtl' : 'ltr';
}

export { replaceTemplate } from '@repo/i18n';

function localizedName<
  T extends { name: string; nameEn?: string | null; nameFr?: string | null; nameAr?: string | null },
>(entity: T, language: WaiterLanguage) {
  if (language === 'ar') {
    return entity.nameAr ?? entity.name;
  }

  if (language === 'fr') {
    return entity.nameFr ?? entity.nameEn ?? entity.name;
  }

  return entity.nameEn ?? entity.name;
}

function localizedDescription<
  T extends {
    description?: string | null;
    descriptionEn?: string | null;
    descriptionFr?: string | null;
    descriptionAr?: string | null;
  },
>(entity: T, language: WaiterLanguage) {
  if (language === 'ar') {
    return entity.descriptionAr ?? entity.description ?? null;
  }

  if (language === 'fr') {
    return entity.descriptionFr ?? entity.descriptionEn ?? entity.description ?? null;
  }

  return entity.descriptionEn ?? entity.description ?? null;
}

export function localizeMenuName(menu: MenuDTO, language: WaiterLanguage) {
  return localizedName(menu, language);
}

export function localizeMenuItemName(item: MenuItemDTO, language: WaiterLanguage) {
  return localizedName(item, language);
}

export function localizeMenuItemDescription(item: MenuItemDTO, language: WaiterLanguage) {
  return localizedDescription(item, language);
}

export function localizeMenuItemBadge(item: MenuItemDTO, language: WaiterLanguage) {
  if (language === 'ar') {
    return item.badgeAr ?? item.badge ?? null;
  }

  if (language === 'fr') {
    return item.badgeFr ?? item.badgeEn ?? item.badge ?? null;
  }

  return item.badgeEn ?? item.badge ?? null;
}

export function localizeModifierGroupName(group: ModifierGroupDTO, language: WaiterLanguage) {
  return localizedName(group, language);
}

export function localizeModifierOptionName(option: ModifierOptionDTO, language: WaiterLanguage) {
  return localizedName(option, language);
}

function localizedModifierPart(
  entity: {
    groupName?: string;
    groupNameEn?: string | null;
    groupNameFr?: string | null;
    groupNameAr?: string | null;
    optionName?: string;
    optionNameEn?: string | null;
    optionNameFr?: string | null;
    optionNameAr?: string | null;
  },
  language: WaiterLanguage,
) {
  const groupName =
    language === 'ar'
      ? entity.groupNameAr ?? entity.groupName ?? ''
      : language === 'fr'
        ? entity.groupNameFr ?? entity.groupNameEn ?? entity.groupName ?? ''
        : entity.groupNameEn ?? entity.groupName ?? '';

  const optionName =
    language === 'ar'
      ? entity.optionNameAr ?? entity.optionName ?? ''
      : language === 'fr'
        ? entity.optionNameFr ?? entity.optionNameEn ?? entity.optionName ?? ''
        : entity.optionNameEn ?? entity.optionName ?? '';

  return { groupName, optionName };
}

export function localizeDraftModifierName(
  modifier: DraftModifierDetail,
  language: WaiterLanguage,
) {
  const { groupName, optionName } = localizedModifierPart(modifier, language);

  return groupName ? `${groupName}: ${optionName}` : optionName;
}

export function localizeDraftLineName(line: DraftLine, language: WaiterLanguage) {
  return localizedName(line, language);
}

export function localizeOrderStatus(status: OrderResponse['status'], language: WaiterLanguage) {
  const t = waiterT(language);

  switch (status) {
    case 'PENDING':
      return t.active;
    case 'PREPARING':
      return t.active;
    case 'READY':
      return t.ready;
    case 'DELIVERED':
      return t.waitingPayment;
    case 'PAID':
      return t.payNow;
    default:
      return status;
  }
}

export function localizeTableLabel(tableNumber: number, language: WaiterLanguage) {
  const t = waiterT(language);
  return `${t.table} ${tableNumber}`;
}

export function localizeTableSearchText(table: TableDTO, language: WaiterLanguage) {
  const label = localizeTableLabel(table.number, language).toLowerCase();
  return `${table.number} ${label}`;
}

export function formatCountLabel(
  count: number,
  singular: string,
  plural: string,
  language: WaiterLanguage,
) {
  if (language === 'ar') {
    return `${count} ${plural}`;
  }

  return `${count} ${count === 1 ? singular : plural}`;
}
