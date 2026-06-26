import type { Language, LocalizedEntity } from '@/types/menu';

type Dictionary = {
  brand: string;
  table: string;
  chooseLanguage: string;
  chooseLanguageHint: string;
  continue: string;
  changeLater: string;
  menusTitle: string;
  menusHint: string;
  itemsHint: string;
  backToMenus: string;
  viewMenu: string;
  noMenuItems: string;
  viewCart: string;
  add: string;
  unavailable: string;
  cart: string;
  emptyCart: string;
  note: string;
  notePlaceholder: string;
  checkout: string;
  submitOrder: string;
  submittingOrder: string;
  submitOrderFailed: string;
  successTitle: string;
  successHint: string;
  addMore: string;
  statusPending: string;
  statusPreparing: string;
  statusReady: string;
  statusDelivered: string;
  statusPaid: string;
  statusCancelled: string;
  headlinePreparing: string;
  headlineReady: string;
  headlineDelivered: string;
  stepPending: string;
  stepPreparing: string;
  stepReady: string;
  stepDelivered: string;
  liveTracking: string;
  connecting: string;
  reconnecting: string;
  orderDetails: string;
  statusUpdated: string;
  myOrders: string;
  myOrdersHint: string;
  orderLabel: string;
  orderAt: string;
  customize: string;
  selectOptions: string;
  required: string;
  optional: string;
  addToCart: string;
  itemAdded: string;
  total: string;
  confirmOrder: string;
  continueBrowsing: string;
  kitchenNote: string;
  suggestedForYou: string;
  chefRecommendations: string;
  houseFavorites: string;
  menuLoadFailed: string;
  orderLoadFailed: string;
  callWaiter: string;
  noTableContext: string;
  chooseAtLeast: string;
  chooseUpTo: string;
  currentOrder: string;
  readyWhenYouAre: string;
  selectedItems: string;
  modifierIncluded: string;
  menuUpdated: string;
  editOrder: string;
  cancelEditing: string;
  updateOrder: string;
  updatingOrder: string;
  updateOrderSuccess: string;
  updateOrderFailed: string;
  editingOrderBanner: string;
  orderUpdatedByStaff: string;
  orderPreparationStarted: string;
  invalidTableSession: string;
  waiterComing: string;
  waiterCallAlreadyOpen: string;
  waiterCalled: string;
  cancelOrder: string;
  cancellingOrder: string;
  cancelOrderFailed: string;
  orderCancelled: string;
};

export const dictionaries: Record<Language, Dictionary> = {
  en: {
    brand: 'Khalou-Fodil',
    table: 'Table',
    chooseLanguage: 'Choose your language',
    chooseLanguageHint: 'Select the language you want before browsing the menu.',
    continue: 'Continue',
    changeLater: 'You can switch language later from the menu screen.',
    menusTitle: 'What would you like today?',
    menusHint: 'Browse the restaurant menus and build your order from the table.',
    itemsHint: 'Fresh picks from this menu.',
    backToMenus: 'Back to menus',
    viewMenu: 'Open menu',
    noMenuItems: 'No dishes are available in this menu yet.',
    viewCart: 'View cart',
    add: 'Add',
    unavailable: 'Unavailable',
    cart: 'Your cart',
    emptyCart: 'Your cart is empty.',
    note: 'Note',
    notePlaceholder: 'Allergies, cooking level, or special request',
    checkout: 'Checkout',
    submitOrder: 'Send order',
    submittingOrder: 'Sending...',
    submitOrderFailed: 'Could not send the order. Please try again.',
    successTitle: 'Your order is on its way to the kitchen',
    successHint: 'You can track the order live from this table.',
    addMore: 'Add more items',
    statusPending: 'Pending',
    statusPreparing: 'Preparing',
    statusReady: 'Ready',
    statusDelivered: 'Delivered',
    statusPaid: 'Paid',
    statusCancelled: 'Cancelled',
    headlinePreparing: 'Your order is being prepared',
    headlineReady: 'Your order is ready',
    headlineDelivered: 'Enjoy your meal',
    stepPending: 'Sent',
    stepPreparing: 'Kitchen',
    stepReady: 'Ready',
    stepDelivered: 'Served',
    liveTracking: 'Live tracking active',
    connecting: 'Connecting...',
    reconnecting: 'Reconnecting...',
    orderDetails: 'Order details',
    statusUpdated: 'Status updated',
    myOrders: 'Table orders',
    myOrdersHint: 'Live orders for this table. You can only edit your own order before preparation starts.',
    orderLabel: 'Order',
    orderAt: 'at',
    customize: 'Customize',
    selectOptions: 'Choose your options',
    required: 'Required',
    optional: 'Optional',
    addToCart: 'Add to cart',
    itemAdded: 'Added to cart',
    total: 'Total',
    confirmOrder: 'Confirm order',
    continueBrowsing: 'Continue browsing',
    kitchenNote: 'Kitchen note',
    suggestedForYou: 'Suggested for you',
    chefRecommendations: 'Chef recommendations',
    houseFavorites: 'House favorites',
    menuLoadFailed: 'The menu could not be loaded right now.',
    orderLoadFailed: 'The order could not be loaded.',
    callWaiter: 'Call waiter',
    noTableContext: 'Restaurant and table information is required.',
    chooseAtLeast: 'Choose at least',
    chooseUpTo: 'Choose up to',
    currentOrder: 'Current order',
    readyWhenYouAre: 'Ready whenever you are.',
    selectedItems: 'selected items',
    modifierIncluded: 'Included',
    menuUpdated: 'Menu updated',
    editOrder: 'Edit order',
    cancelEditing: 'Cancel',
    updateOrder: 'Update order',
    updatingOrder: 'Updating...',
    updateOrderSuccess: 'Order updated successfully!',
    updateOrderFailed: 'Could not update the order. Please try again.',
    editingOrderBanner: 'You are editing order #{{number}}',
    orderUpdatedByStaff:
      'This order was updated by restaurant staff. Please refresh and try again.',
    orderPreparationStarted:
      'Order preparation has already started. This order can no longer be modified.',
    invalidTableSession: 'Your table session is invalid. Please scan the QR code again.',
    waiterComing: 'A waiter is on the way to your table.',
    waiterCallAlreadyOpen: 'You have already called a waiter. Please wait.',
    waiterCalled: 'Waiter called. Please wait.',
    cancelOrder: 'Cancel order',
    cancellingOrder: 'Cancelling...',
    cancelOrderFailed: 'Could not cancel the order. Please try again.',
    orderCancelled: 'Order cancelled.',
  },
  fr: {
    brand: 'Khalou-Fodil',
    table: 'Table',
    chooseLanguage: 'Choisissez votre langue',
    chooseLanguageHint: 'Choisissez la langue avant de parcourir le menu.',
    continue: 'Continuer',
    changeLater: 'Vous pourrez changer la langue plus tard depuis le menu.',
    menusTitle: 'Que souhaitez-vous commander ?',
    menusHint: 'Parcourez les menus du restaurant et composez votre commande depuis la table.',
    itemsHint: 'Selections fraiches de ce menu.',
    backToMenus: 'Retour aux menus',
    viewMenu: 'Ouvrir le menu',
    noMenuItems: 'Aucun plat n est disponible dans ce menu pour le moment.',
    viewCart: 'Voir le panier',
    add: 'Ajouter',
    unavailable: 'Indisponible',
    cart: 'Votre panier',
    emptyCart: 'Votre panier est vide.',
    note: 'Note',
    notePlaceholder: 'Allergies, cuisson ou demande speciale',
    checkout: 'Passer a la commande',
    submitOrder: 'Envoyer la commande',
    submittingOrder: 'Envoi...',
    submitOrderFailed: 'Impossible d envoyer la commande. Veuillez reessayer.',
    successTitle: 'Votre commande est partie en cuisine',
    successHint: 'Vous pouvez suivre la commande en direct depuis cette table.',
    addMore: 'Ajouter des articles',
    statusPending: 'En attente',
    statusPreparing: 'En preparation',
    statusReady: 'Prete',
    statusDelivered: 'Servie',
    statusPaid: 'Payee',
    statusCancelled: 'Annulee',
    headlinePreparing: 'Votre commande est en preparation',
    headlineReady: 'Votre commande est prete',
    headlineDelivered: 'Bon appetit',
    stepPending: 'Envoyee',
    stepPreparing: 'Cuisine',
    stepReady: 'Prete',
    stepDelivered: 'Servie',
    liveTracking: 'Suivi en direct actif',
    connecting: 'Connexion...',
    reconnecting: 'Reconnexion...',
    orderDetails: 'Details de la commande',
    statusUpdated: 'Statut mis a jour',
    myOrders: 'Commandes de la table',
    myOrdersHint: 'Commandes en direct pour cette table. Vous ne pouvez modifier que votre commande avant la preparation.',
    orderLabel: 'Commande',
    orderAt: 'a',
    customize: 'Personnaliser',
    selectOptions: 'Choisissez vos options',
    required: 'Obligatoire',
    optional: 'Optionnel',
    addToCart: 'Ajouter au panier',
    itemAdded: 'Ajoute au panier',
    total: 'Total',
    confirmOrder: 'Confirmer la commande',
    continueBrowsing: 'Continuer',
    kitchenNote: 'Note cuisine',
    suggestedForYou: 'Suggestions pour vous',
    chefRecommendations: 'Recommandations du chef',
    houseFavorites: 'Favoris de la maison',
    menuLoadFailed: 'Le menu n a pas pu etre charge pour le moment.',
    orderLoadFailed: 'La commande n a pas pu etre chargee.',
    callWaiter: 'Appeler un serveur',
    noTableContext: 'Les informations du restaurant et de la table sont requises.',
    chooseAtLeast: 'Choisissez au moins',
    chooseUpTo: 'Choisissez jusqu a',
    currentOrder: 'Commande en cours',
    readyWhenYouAre: 'Pret des que vous l etes.',
    selectedItems: 'articles selectionnes',
    modifierIncluded: 'Inclus',
    menuUpdated: 'Menu mis a jour',
    editOrder: 'Modifier la commande',
    cancelEditing: 'Annuler',
    updateOrder: 'Mettre à jour la commande',
    updatingOrder: 'Mise à jour...',
    updateOrderSuccess: 'Commande mise à jour avec succès!',
    updateOrderFailed: 'Impossible de mettre à jour la commande. Veuillez réessayer.',
    editingOrderBanner: 'Vous modifiez la commande #{{number}}',
    orderUpdatedByStaff:
      'Cette commande a été mise à jour par le restaurant. Veuillez actualiser et réessayer.',
    orderPreparationStarted:
      'La préparation de la commande a déjà commencé. Elle ne peut plus être modifiée.',
    invalidTableSession: 'Votre session de table est invalide. Veuillez scanner le QR code.',
    waiterComing: 'Un serveur est en route vers votre table.',
    waiterCallAlreadyOpen: 'Vous avez déjà appelé un serveur. Veuillez patienter.',
    waiterCalled: 'Serveur appelé. Veuillez patienter.',
    cancelOrder: 'Annuler la commande',
    cancellingOrder: 'Annulation...',
    cancelOrderFailed: 'Impossible d annuler la commande. Veuillez reessayer.',
    orderCancelled: 'Commande annulee.',
  },
  ar: {
    brand: 'خلوفوديل',
    table: 'الطاولة',
    chooseLanguage: 'اختر لغتك',
    chooseLanguageHint: 'حدد اللغة التي تريدها قبل تصفح المنيو.',
    continue: 'متابعة',
    changeLater: 'يمكنك تغيير اللغة لاحقًا من شاشة المنيو.',
    menusTitle: 'ماذا ترغب أن تطلب اليوم؟',
    menusHint: 'تصفح منيوهات المطعم وكون طلبك مباشرة من الطاولة.',
    itemsHint: 'اختيارات طازجة من هذا المنيو.',
    backToMenus: 'العودة إلى المنيوهات',
    viewMenu: 'فتح المنيو',
    noMenuItems: 'لا توجد أطباق متاحة في هذا المنيو حاليًا.',
    viewCart: 'عرض السلة',
    add: 'إضافة',
    unavailable: 'غير متاح',
    cart: 'سلتك',
    emptyCart: 'السلة فارغة.',
    note: 'ملاحظة',
    notePlaceholder: 'حساسية، درجة الطهي، أو طلب خاص',
    checkout: 'مراجعة الطلب',
    submitOrder: 'إرسال الطلب',
    submittingOrder: 'جارٍ الإرسال...',
    submitOrderFailed: 'تعذر إرسال الطلب. حاول مرة أخرى.',
    successTitle: 'تم إرسال طلبك إلى المطبخ',
    successHint: 'يمكنك متابعة الطلب مباشرة من هذه الطاولة.',
    addMore: 'إضافة المزيد',
    statusPending: 'قيد الانتظار',
    statusPreparing: 'قيد التحضير',
    statusReady: 'جاهز',
    statusDelivered: 'تم التقديم',
    statusPaid: 'مدفوع',
    statusCancelled: 'ملغي',
    headlinePreparing: 'طلبك قيد التحضير',
    headlineReady: 'طلبك جاهز',
    headlineDelivered: 'بالهناء والشفاء',
    stepPending: 'تم الإرسال',
    stepPreparing: 'المطبخ',
    stepReady: 'جاهز',
    stepDelivered: 'تم التقديم',
    liveTracking: 'المتابعة المباشرة مفعلة',
    connecting: 'جارٍ الاتصال...',
    reconnecting: 'إعادة الاتصال...',
    orderDetails: 'تفاصيل الطلب',
    statusUpdated: 'تم تحديث الحالة',
    myOrders: 'طلبات الطاولة',
    myOrdersHint: 'طلبات مباشرة لهذه الطاولة. يمكنك تعديل طلبك فقط قبل بدء التحضير.',
    orderLabel: 'طلب',
    orderAt: 'الساعة',
    customize: 'تخصيص',
    selectOptions: 'اختر الإضافات',
    required: 'إجباري',
    optional: 'اختياري',
    addToCart: 'أضف إلى السلة',
    itemAdded: 'تمت الإضافة إلى السلة',
    total: 'الإجمالي',
    confirmOrder: 'تأكيد الطلب',
    continueBrowsing: 'متابعة التصفح',
    kitchenNote: 'ملاحظة للمطبخ',
    suggestedForYou: 'مقترح لك',
    chefRecommendations: 'ترشيحات الشيف',
    houseFavorites: 'الأكثر طلبًا',
    menuLoadFailed: 'تعذر تحميل المنيو حاليًا.',
    orderLoadFailed: 'تعذر تحميل الطلب.',
    callWaiter: 'نداء النادل',
    noTableContext: 'معلومات المطعم والطاولة مطلوبة.',
    chooseAtLeast: 'اختر على الأقل',
    chooseUpTo: 'اختر حتى',
    currentOrder: 'الطلب الحالي',
    readyWhenYouAre: 'جاهز عندما تكون جاهزًا.',
    selectedItems: 'عناصر محددة',
    modifierIncluded: 'مشمول',
    menuUpdated: 'تم تحديث المنيو',
    editOrder: 'تعديل الطلب',
    cancelEditing: 'إلغاء التعديل',
    updateOrder: 'تحديث الطلب',
    updatingOrder: 'جاري التحديث...',
    updateOrderSuccess: 'تم تحديث طلبك بنجاح!',
    updateOrderFailed: 'تعذر تحديث الطلب. حاول مرة أخرى.',
    editingOrderBanner: 'أنت تقوم بتعديل الطلب #{{number}}',
    orderUpdatedByStaff:
      'تم تحديث هذا الطلب من قبل المطعم. يرجى التحديث والمحاولة مرة أخرى.',
    orderPreparationStarted: 'بدأ تحضير الطلب بالفعل. لم يعد بإمكانك تعديله.',
    invalidTableSession: 'جلسة الطاولة غير صالحة. يرجى مسح رمز QR مرة أخرى.',
    waiterComing: 'النادل في طريقه إلى طاولتك.',
    waiterCallAlreadyOpen: 'لقد قمت بنداء النادل بالفعل. يرجى الانتظار.',
    waiterCalled: 'تم نداء النادل. يرجى الانتظار.',
    cancelOrder: 'إلغاء الطلب',
    cancellingOrder: 'جاري الإلغاء...',
    cancelOrderFailed: 'تعذر إلغاء الطلب. حاول مرة أخرى.',
    orderCancelled: 'تم إلغاء الطلب.',
  },
};

export function t(language: Language) {
  return dictionaries[language];
}

function normalizeText(text: string | null | undefined) {
  return typeof text === 'string' ? text.trim() : '';
}

export function localizeValue(
  entity: Partial<LocalizedEntity> | null | undefined,
  language: Language,
) {
  if (!entity) {
    return '';
  }

  const translated =
    language === 'ar'
      ? entity.nameAr ?? entity.optionNameAr ?? entity.descriptionAr
      : language === 'fr'
        ? entity.nameFr ?? entity.optionNameFr ?? entity.descriptionFr
        : entity.nameEn ?? entity.optionNameEn ?? entity.descriptionEn;

  return (
    normalizeText(translated) ||
    normalizeText(entity.name) ||
    normalizeText(entity.optionName) ||
    normalizeText(entity.description)
  );
}

export function localizeText(
  value:
    | string
    | null
    | undefined
    | (Partial<LocalizedEntity> & {
        name?: string | null;
        description?: string | null;
      }),
  language: Language = 'en',
) {
  if (typeof value === 'string' || value == null) {
    return normalizeText(value);
  }

  return localizeValue(value, language);
}

export function localizeName(
  entity: Partial<LocalizedEntity> | null | undefined,
  language: Language,
) {
  if (!entity) {
    return '';
  }

  const translated =
    language === 'ar'
      ? entity.nameAr ?? entity.optionNameAr
      : language === 'fr'
        ? entity.nameFr ?? entity.optionNameFr
        : entity.nameEn ?? entity.optionNameEn;

  return normalizeText(translated) || normalizeText(entity.name) || normalizeText(entity.optionName);
}

export function localizeDescription(
  entity: Partial<LocalizedEntity> | null | undefined,
  language: Language,
) {
  if (!entity) {
    return '';
  }

  const translated =
    language === 'ar'
      ? entity.descriptionAr
      : language === 'fr'
        ? entity.descriptionFr
        : entity.descriptionEn;

  return normalizeText(translated) || normalizeText(entity.description);
}

export function localize(
  value:
    | string
    | null
    | undefined
    | (Partial<LocalizedEntity> & {
        name?: string | null;
        description?: string | null;
      }),
  language: Language = 'en',
) {
  return localizeText(value, language);
}
