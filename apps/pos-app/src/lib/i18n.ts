import type {
  MenuDTO,
  MenuItemDTO,
  ModifierGroupDTO,
  ModifierOptionDTO,
  OrderItemModifierDTO,
  OrderStatus as ApiOrderStatus,
  PaymentMethod as ApiPaymentMethod,
} from '@repo/shared-types';
import type { ActivityItem, DiningTable, NavItem, PaymentMethod, PosScreen } from '@/types/pos';
import type { PosLanguage } from '@/store/pos-ui.store';

type PosDictionary = {
  brand: string;
  operatorLabel: string;
  stationLabel: string;
  language: string;
  english: string;
  french: string;
  arabic: string;
  orders: string;
  tables: string;
  externalOrders: string;
  ordersHistory: string;
  takeaway: string;
  board: string;
  floor: string;
  direct: string;
  liveSync: string;
  connecting: string;
  offline: string;
  kitchenLinked: string;
  items: string;
  item: string;
  qty: string;
  total: string;
  liveActivity: string;
  selectTicketHint: string;
  activeTickets: string;
  tablesCount: string;
  legend: string;
  available: string;
  activeOrders: string;
  orderBoardTitle: string;
  orderBoardSubtitle: string;
  ordersHistoryTitle: string;
  ordersHistorySubtitle: string;
  todayOrdersHistory: string;
  tablesTitle: string;
  tablesSubtitle: string;
  tableBillingTitle: string;
  tableBillingSubtitle: string;
  composeTitle: string;
  composeSubtitle: string;
  orderDetailTitle: string;
  orderDetailSubtitle: string;
  paymentTitle: string;
  paymentSubtitle: string;
  receiptTitle: string;
  receiptSubtitle: string;
  walkIn: string;
  walkInTakeaway: string;
  noActiveOrders: string;
  noOrdersHistory: string;
  createWalkIn: string;
  pending: string;
  preparing: string;
  ready: string;
  delivered: string;
  readyToPay: string;
  prepareAction: string;
  readyAction: string;
  deliverAction: string;
  payAction: string;
  edit: string;
  openOrderDetails: string;
  printInvoice: string;
  floorPlan: string;
  table: string;
  tableBundle: string;
  guest: string;
  tickets: string;
  ticket: string;
  ordersCount: string;
  order: string;
  dineIn: string;
  seats: string;
  seat: string;
  newTicket: string;
  noTableOrders: string;
  activeTicketsAtTable: string;
  tableTotal: string;
  payAllTableTickets: string;
  mainHall: string;
  window: string;
  bar: string;
  noOrderInProgress: string;
  sendToKitchen: string;
  orderedAt: string;
  customerApp: string;
  enterEditReason: string;
  defaultEditReason: string;
  defaultCheckoutEditReason: string;
  defaultBoardEditReason: string;
  defaultTableEditReason: string;
  editReasonRequired: string;
  editReasonHelper: string;
  walkInComposeSubtitle: string;
  tableComposeSubtitle: string;
  selectToEdit: string;
  addItemsTitle: string;
  addToTicket: string;
  addFromMenu: string;
  save: string;
  saving: string;
  cancel: string;
  cancelling: string;
  cancelOrder: string;
  cancelOrderReason: string;
  cancelOrderHelper: string;
  cancelOrderDefaultReason: string;
  couldNotCancel: string;
  couldNotSave: string;
  pay: string;
  orderItems: string;
  noItemsYet: string;
  each: string;
  backToBoard: string;
  groupedTableCheckout: string;
  selectTicketBeforeCheckout: string;
  includedTickets: string;
  paymentMethod: string;
  processing: string;
  payNow: string;
  completePaymentToPreview: string;
  printAgain: string;
  printReceipt: string;
  receiptLanguage: string;
  arabicOnly: string;
  frenchOnly: string;
  englishOnly: string;
  chooseReceiptLanguage: string;
  noAutoPrint: string;
  restaurant: string;
  thankYou: string;
  paid: string;
  chooseAtLeastOne: string;
  chooseAtLeastMany: string;
  chooseUpTo: string;
  upToCount: string;
  couldNotLoadMenus: string;
  couldNotLoadMenuItems: string;
  couldNotSubmitOrder: string;
  back: string;
  chooseMenu: string;
  loading: string;
  menus: string;
  modifierGroups: string;
  add: string;
  currentTicket: string;
  addItemsFromMenu: string;
  submitting: string;
  customize: string;
  required: string;
  optional: string;
  included: string;
  kitchenNote: string;
  kitchenNotePlaceholder: string;
  lineTotal: string;
  saveLine: string;
  card: string;
  cardHint: string;
  cash: string;
  cashHint: string;
  bankTransfer: string;
  bankTransferHint: string;
  mobilePayment: string;
  mobilePaymentHint: string;
  posConnected: string;
  posConnectedDetail: string;
  now: string;
  posHub: string;
  loadingServiceData: string;
  connectionError: string;
  ensureBackend: string;
  unifiedBilling: string;
  orderViewMode: string;
  financialSummary: string;
  ordersIncluded: string;
  paymentsHistory: string;
  guests: string;
  status: string;
  createdTime: string;
  amount: string;
  method: string;
  employee: string;
  outstanding: string;
  unpaid: string;
  partiallyPaid: string;
  allOrdersUnderOneBill: string;
  orderViewReadOnly: string;
  openTableBill: string;
  noPaymentsYet: string;
  noBillingData: string;
  paymentMethodsUsed: string;
  cashier: string;
  billDate: string;
};

const dictionary: Record<PosLanguage, PosDictionary> = {
  en: {
    brand: 'Khalou-Fodil',
    operatorLabel: 'Khalou-Fodil POS',
    stationLabel: 'POS station',
    language: 'Language',
    english: 'English',
    french: 'French',
    arabic: 'Arabic',
    orders: 'Orders',
    tables: 'Tables',
    externalOrders: 'External Orders',
    ordersHistory: 'Orders History',
    takeaway: 'Takeaway',
    board: 'Board',
    floor: 'Floor',
    direct: 'Direct',
    liveSync: 'Live sync',
    connecting: 'Connecting...',
    offline: 'Offline',
    kitchenLinked: 'Kitchen linked',
    items: 'items',
    item: 'item',
    qty: 'qty',
    total: 'Total',
    liveActivity: 'Live Activity',
    selectTicketHint: 'Select a ticket from the board or a table to view details.',
    activeTickets: 'active tickets',
    tablesCount: 'tables',
    legend: 'Legend',
    available: 'Available',
    activeOrders: 'Active orders',
    orderBoardTitle: 'Order Flow Board',
    orderBoardSubtitle: 'Each ticket is separate for walk-in guests or table service.',
    ordersHistoryTitle: 'Today Orders History',
    ordersHistorySubtitle: 'Review today external and dine-in orders, then open any ticket for print or cashier edits.',
    todayOrdersHistory: 'today orders',
    tablesTitle: 'Floor Plan',
    tablesSubtitle: 'Each guest at the table keeps a separate ticket.',
    tableBillingTitle: 'Table Billing',
    tableBillingSubtitle: 'Unified cashier bill for all orders at the table.',
    composeTitle: 'New Order',
    composeSubtitle: 'Choose items and send them to the kitchen.',
    orderDetailTitle: 'Order Detail',
    orderDetailSubtitle: 'Edit items before payment.',
    paymentTitle: 'Payment',
    paymentSubtitle: 'Choose a payment method and confirm.',
    receiptTitle: 'Receipt',
    receiptSubtitle: 'Print the receipt for the guest.',
    walkIn: 'Walk-in',
    walkInTakeaway: 'Walk-in / Takeaway',
    noActiveOrders: 'No active orders. Create a walk-in ticket or wait for guest orders.',
    noOrdersHistory: 'No orders were recorded today yet.',
    createWalkIn: 'Walk-in',
    pending: 'Pending',
    preparing: 'Preparing',
    ready: 'Ready',
    delivered: 'Delivered',
    readyToPay: 'Ready to pay',
    prepareAction: 'Prepare',
    readyAction: 'Ready',
    deliverAction: 'Deliver',
    payAction: 'Pay',
    edit: 'Edit',
    openOrderDetails: 'Open details',
    printInvoice: 'Print invoice',
    floorPlan: 'Floor plan',
    table: 'Table',
    tableBundle: 'Table bundle',
    guest: 'Guest',
    tickets: 'tickets',
    ticket: 'ticket',
    ordersCount: 'orders',
    order: 'order',
    dineIn: 'Dine-in',
    seats: 'seats',
    seat: 'seat',
    newTicket: 'New ticket',
    noTableOrders: 'No active orders. Guests can scan the QR or staff can create a ticket.',
    activeTicketsAtTable: 'Active tickets at this table',
    tableTotal: 'Table total',
    payAllTableTickets: 'Pay all table tickets',
    mainHall: 'Main Hall',
    window: 'Window',
    bar: 'Bar',
    noOrderInProgress: 'No order in progress.',
    sendToKitchen: 'Send to kitchen',
    orderedAt: 'Ordered at',
    customerApp: 'Customer app',
    enterEditReason: 'Enter the reason for this cashier edit',
    defaultEditReason: 'Cashier updated order from POS history',
    defaultCheckoutEditReason: 'Cashier updated order from payment screen',
    defaultBoardEditReason: 'Cashier updated order from order board',
    defaultTableEditReason: 'Cashier updated order from table screen',
    editReasonRequired: 'Enter the reason for this cashier edit before saving.',
    editReasonHelper: 'This reason will be saved in employee-risk with full before and after order details.',
    walkInComposeSubtitle: 'Choose menu items for the guest and send them directly to the kitchen.',
    tableComposeSubtitle: 'Create a new POS order for this table.',
    selectToEdit: 'Select a ticket from the board or a table to edit it.',
    addItemsTitle: 'Add items',
    addToTicket: 'Add to ticket',
    addFromMenu: 'Add from menu',
    save: 'Save',
    saving: 'Saving...',
    cancel: 'Cancel',
    cancelling: 'Cancelling...',
    cancelOrder: 'Cancel order',
    cancelOrderReason: 'Cancellation reason',
    cancelOrderHelper: 'This reason is required and will be recorded in the audit trail.',
    cancelOrderDefaultReason: 'Cashier cancelled order from POS',
    couldNotCancel: 'Could not cancel the order.',
    couldNotSave: 'Could not save changes.',
    pay: 'Pay',
    orderItems: 'Order items',
    noItemsYet: 'No items yet.',
    each: 'each',
    backToBoard: 'Back to order board',
    groupedTableCheckout: 'Grouped table checkout',
    selectTicketBeforeCheckout: 'Select a ticket before checkout.',
    includedTickets: 'Included tickets',
    paymentMethod: 'Payment method',
    processing: 'Processing...',
    payNow: 'Pay now',
    completePaymentToPreview: 'Complete a payment to preview the receipt.',
    printAgain: 'Print again',
    printReceipt: 'Print receipt',
    receiptLanguage: 'Receipt language',
    arabicOnly: 'Arabic',
    frenchOnly: 'French',
    englishOnly: 'English',
    chooseReceiptLanguage: 'Choose receipt language before printing.',
    noAutoPrint: 'Receipt printing is now manual.',
    restaurant: 'Restaurant',
    thankYou: 'Thank you',
    paid: 'Paid',
    chooseAtLeastOne: 'Choose at least 1 option for {{group}}',
    chooseAtLeastMany: 'Choose at least {{count}} option(s) for {{group}}',
    chooseUpTo: 'Choose up to {{count}} option(s) for {{group}}',
    upToCount: 'up to {{count}}',
    couldNotLoadMenus: 'Could not load menus.',
    couldNotLoadMenuItems: 'Could not load menu items.',
    couldNotSubmitOrder: 'Could not submit the order.',
    back: 'Back',
    chooseMenu: 'Choose a menu',
    loading: 'Loading...',
    menus: 'Menus',
    modifierGroups: 'modifier groups',
    add: 'Add',
    currentTicket: 'Current ticket',
    addItemsFromMenu: 'Add items from the menu.',
    submitting: 'Submitting...',
    customize: 'Customize',
    required: 'Required',
    optional: 'Optional',
    included: 'Included',
    kitchenNote: 'Kitchen note',
    kitchenNotePlaceholder: 'Special request, allergies, extra instructions',
    lineTotal: 'Line total',
    saveLine: 'Save line',
    card: 'Card',
    cardHint: 'Bank card payment',
    cash: 'Cash',
    cashHint: 'Cash payment',
    bankTransfer: 'Bank transfer',
    bankTransferHint: 'Transfer to bank account',
    mobilePayment: 'Mobile payment',
    mobilePaymentHint: 'Wallet or mobile app',
    posConnected: 'POS connected',
    posConnectedDetail: 'Orders and tables will appear here as service begins.',
    now: 'Now',
    posHub: 'POS Hub',
    loadingServiceData: 'Loading service data...',
    connectionError: 'Connection error',
    ensureBackend: 'Ensure backend is running on port 4000.',
    unifiedBilling: 'Unified bill',
    orderViewMode: 'Order view',
    financialSummary: 'Financial summary',
    ordersIncluded: 'Orders included',
    paymentsHistory: 'Payments',
    guests: 'Guests',
    status: 'Status',
    createdTime: 'Created',
    amount: 'Amount',
    method: 'Method',
    employee: 'Employee',
    outstanding: 'Outstanding',
    unpaid: 'Unpaid',
    partiallyPaid: 'Partially paid',
    allOrdersUnderOneBill: 'All table orders are combined into one cashier bill.',
    orderViewReadOnly: 'This mode is for review only. Payments still happen on the unified bill.',
    openTableBill: 'Open table bill',
    noPaymentsYet: 'No payments have been recorded for this table yet.',
    noBillingData: 'No billing data is available for this table yet.',
    paymentMethodsUsed: 'Payment methods used',
    cashier: 'Cashier',
    billDate: 'Bill date',
  },
  fr: {
    brand: 'Khalou-Fodil',
    operatorLabel: 'Khalou-Fodil POS',
    stationLabel: 'Station POS',
    language: 'Langue',
    english: 'Anglais',
    french: 'Francais',
    arabic: 'Arabe',
    orders: 'Commandes',
    tables: 'Tables',
    externalOrders: 'Commandes externes',
    ordersHistory: 'Historique commandes',
    takeaway: 'Emporter',
    board: 'Tableau',
    floor: 'Salle',
    direct: 'Direct',
    liveSync: 'Synchro live',
    connecting: 'Connexion...',
    offline: 'Hors ligne',
    kitchenLinked: 'Cuisine reliee',
    items: 'articles',
    item: 'article',
    qty: 'qte',
    total: 'Total',
    liveActivity: 'Activite live',
    selectTicketHint: 'Selectionnez un ticket du tableau ou une table pour voir les details.',
    activeTickets: 'tickets actifs',
    tablesCount: 'tables',
    legend: 'Legende',
    available: 'Disponible',
    activeOrders: 'Commandes actives',
    orderBoardTitle: 'Tableau des commandes',
    orderBoardSubtitle: 'Chaque ticket reste separe pour le sur place ou les passages rapides.',
    ordersHistoryTitle: 'Historique du jour',
    ordersHistorySubtitle: 'Consultez les commandes du jour sur place et externes, puis ouvrez n importe quel ticket pour impression ou modification caisse.',
    todayOrdersHistory: 'commandes du jour',
    tablesTitle: 'Plan de salle',
    tablesSubtitle: 'Chaque client a son propre ticket sur la table.',
    tableBillingTitle: 'Facture de table',
    tableBillingSubtitle: 'Facture caisse unifiee pour toutes les commandes de la table.',
    composeTitle: 'Nouvelle commande',
    composeSubtitle: 'Choisissez les articles et envoyez-les en cuisine.',
    orderDetailTitle: 'Detail de commande',
    orderDetailSubtitle: 'Modifiez les articles avant le paiement.',
    paymentTitle: 'Paiement',
    paymentSubtitle: 'Choisissez un mode de paiement et confirmez.',
    receiptTitle: 'Ticket',
    receiptSubtitle: 'Imprimez le ticket pour le client.',
    walkIn: 'Comptoir',
    walkInTakeaway: 'Comptoir / Emporter',
    noActiveOrders: 'Aucune commande active. Creez un ticket comptoir ou attendez les commandes client.',
    noOrdersHistory: 'Aucune commande n a encore ete enregistree aujourd hui.',
    createWalkIn: 'Comptoir',
    pending: 'En attente',
    preparing: 'En preparation',
    ready: 'Pret',
    delivered: 'Livre',
    readyToPay: 'Pret a payer',
    prepareAction: 'Preparer',
    readyAction: 'Pret',
    deliverAction: 'Livrer',
    payAction: 'Payer',
    edit: 'Modifier',
    openOrderDetails: 'Ouvrir details',
    printInvoice: 'Imprimer facture',
    floorPlan: 'Plan de salle',
    table: 'Table',
    tableBundle: 'Groupe table',
    guest: 'Client',
    tickets: 'tickets',
    ticket: 'ticket',
    ordersCount: 'commandes',
    order: 'commande',
    dineIn: 'Sur place',
    seats: 'places',
    seat: 'place',
    newTicket: 'Nouveau ticket',
    noTableOrders: 'Aucune commande active. Les clients peuvent scanner le QR ou le staff peut creer un ticket.',
    activeTicketsAtTable: 'Tickets actifs sur cette table',
    tableTotal: 'Total table',
    payAllTableTickets: 'Payer tous les tickets de la table',
    mainHall: 'Salle principale',
    window: 'Fenetre',
    bar: 'Bar',
    noOrderInProgress: 'Aucune commande en cours.',
    sendToKitchen: 'Envoyer en cuisine',
    orderedAt: 'Commande a',
    customerApp: 'Application client',
    enterEditReason: 'Saisissez la raison de cette modification caissier',
    defaultEditReason: 'Le caissier a modifie la commande depuis l historique POS',
    defaultCheckoutEditReason: 'Le caissier a modifie la commande depuis la page de paiement',
    defaultBoardEditReason: 'Le caissier a modifie la commande depuis le tableau des commandes',
    defaultTableEditReason: 'Le caissier a modifie la commande depuis l ecran de table',
    editReasonRequired: 'Saisissez la raison de cette modification avant de sauvegarder.',
    editReasonHelper: 'Cette raison sera enregistree dans employee-risk avec tous les details avant et apres.',
    walkInComposeSubtitle: 'Choisissez les articles pour le client puis envoyez-les directement en cuisine.',
    tableComposeSubtitle: 'Creez une nouvelle commande POS pour cette table.',
    selectToEdit: 'Selectionnez un ticket du tableau ou d une table pour le modifier.',
    addItemsTitle: 'Ajouter des articles',
    addToTicket: 'Ajouter au ticket',
    addFromMenu: 'Ajouter du menu',
    save: 'Enregistrer',
    saving: 'Enregistrement...',
    cancel: 'Annuler',
    cancelling: 'Annulation...',
    cancelOrder: 'Annuler la commande',
    cancelOrderReason: 'Raison de l annulation',
    cancelOrderHelper: 'Cette raison est obligatoire et sera enregistree dans le journal d audit.',
    cancelOrderDefaultReason: 'Le caissier a annule la commande depuis le POS',
    couldNotCancel: 'Impossible d annuler la commande.',
    couldNotSave: 'Impossible d enregistrer les changements.',
    pay: 'Payer',
    orderItems: 'Articles de commande',
    noItemsYet: 'Aucun article pour le moment.',
    each: 'chacun',
    backToBoard: 'Retour au tableau',
    groupedTableCheckout: 'Paiement groupe de table',
    selectTicketBeforeCheckout: 'Selectionnez un ticket avant le paiement.',
    includedTickets: 'Tickets inclus',
    paymentMethod: 'Mode de paiement',
    processing: 'Traitement...',
    payNow: 'Payer maintenant',
    completePaymentToPreview: 'Terminez un paiement pour afficher le ticket.',
    printAgain: 'Imprimer encore',
    printReceipt: 'Imprimer le ticket',
    receiptLanguage: 'Langue du ticket',
    arabicOnly: 'Arabe',
    frenchOnly: 'Francais',
    englishOnly: 'Anglais',
    chooseReceiptLanguage: 'Choisissez la langue du ticket avant impression.',
    noAutoPrint: 'L impression du ticket est manuelle.',
    restaurant: 'Restaurant',
    thankYou: 'Merci',
    paid: 'Paye',
    chooseAtLeastOne: 'Choisissez au moins 1 option pour {{group}}',
    chooseAtLeastMany: 'Choisissez au moins {{count}} option(s) pour {{group}}',
    chooseUpTo: 'Choisissez jusqu a {{count}} option(s) pour {{group}}',
    upToCount: 'jusqu a {{count}}',
    couldNotLoadMenus: 'Impossible de charger les menus.',
    couldNotLoadMenuItems: 'Impossible de charger les articles du menu.',
    couldNotSubmitOrder: 'Impossible d envoyer la commande.',
    back: 'Retour',
    chooseMenu: 'Choisissez un menu',
    loading: 'Chargement...',
    menus: 'Menus',
    modifierGroups: 'groupes d options',
    add: 'Ajouter',
    currentTicket: 'Ticket actuel',
    addItemsFromMenu: 'Ajoutez des articles depuis le menu.',
    submitting: 'Envoi...',
    customize: 'Personnaliser',
    required: 'Obligatoire',
    optional: 'Optionnel',
    included: 'Inclus',
    kitchenNote: 'Note cuisine',
    kitchenNotePlaceholder: 'Demande speciale, allergies, instructions',
    lineTotal: 'Total ligne',
    saveLine: 'Enregistrer la ligne',
    card: 'Carte',
    cardHint: 'Paiement par carte bancaire',
    cash: 'Especes',
    cashHint: 'Paiement en especes',
    bankTransfer: 'Virement bancaire',
    bankTransferHint: 'Virement direct',
    mobilePayment: 'Paiement mobile',
    mobilePaymentHint: 'Wallet ou application mobile',
    posConnected: 'POS connecte',
    posConnectedDetail: 'Les commandes et les tables apparaitront ici au debut du service.',
    now: 'Maintenant',
    posHub: 'POS Hub',
    loadingServiceData: 'Chargement des donnees de service...',
    connectionError: 'Erreur de connexion',
    ensureBackend: 'Verifiez que le backend tourne sur le port 4000.',
    unifiedBilling: 'Facture unifiee',
    orderViewMode: 'Vue commandes',
    financialSummary: 'Resume financier',
    ordersIncluded: 'Commandes incluses',
    paymentsHistory: 'Paiements',
    guests: 'Clients',
    status: 'Statut',
    createdTime: 'Cree le',
    amount: 'Montant',
    method: 'Methode',
    employee: 'Employe',
    outstanding: 'Reste a payer',
    unpaid: 'Non paye',
    partiallyPaid: 'Partiellement paye',
    allOrdersUnderOneBill: 'Toutes les commandes de la table sont rassemblees dans une seule facture caisse.',
    orderViewReadOnly: 'Ce mode sert au suivi uniquement. Les paiements restent sur la facture unifiee.',
    openTableBill: 'Ouvrir la facture',
    noPaymentsYet: 'Aucun paiement n a encore ete enregistre pour cette table.',
    noBillingData: 'Aucune donnee de facturation n est disponible pour cette table.',
    paymentMethodsUsed: 'Methodes de paiement utilisees',
    cashier: 'Caissier',
    billDate: 'Date de facture',
  },
  ar: {
    brand: 'Khalou-Fodil',
    operatorLabel: 'Khalou-Fodil POS',
    stationLabel: '\u0646\u0642\u0637\u0629 \u0627\u0644\u0628\u064a\u0639',
    language: '\u0627\u0644\u0644\u063a\u0629',
    english: '\u0627\u0644\u0625\u0646\u062c\u0644\u064a\u0632\u064a\u0629',
    french: '\u0627\u0644\u0641\u0631\u0646\u0633\u064a\u0629',
    arabic: '\u0627\u0644\u0639\u0631\u0628\u064a\u0629',
    orders: '\u0627\u0644\u0637\u0644\u0628\u0627\u062a',
    tables: '\u0627\u0644\u0637\u0627\u0648\u0644\u0627\u062a',
    externalOrders: '\u0627\u0644\u0637\u0644\u0628\u0627\u062a \u0627\u0644\u062e\u0627\u0631\u062c\u064a\u0629',
    ordersHistory: '\u0633\u062c\u0644 \u0627\u0644\u0637\u0644\u0628\u0627\u062a',
    takeaway: '\u0637\u0644\u0628 \u062e\u0627\u0631\u062c\u064a',
    board: '\u0627\u0644\u0644\u0648\u062d\u0629',
    floor: '\u0627\u0644\u0635\u0627\u0644\u0629',
    direct: '\u0645\u0628\u0627\u0634\u0631',
    liveSync: '\u0645\u0632\u0627\u0645\u0646\u0629 \u0645\u0628\u0627\u0634\u0631\u0629',
    connecting: '\u062c\u0627\u0631\u064d \u0627\u0644\u0627\u062a\u0635\u0627\u0644...',
    offline: '\u063a\u064a\u0631 \u0645\u062a\u0635\u0644',
    kitchenLinked: '\u0645\u0631\u0628\u0648\u0637 \u0628\u0627\u0644\u0645\u0637\u0628\u062e',
    items: '\u0639\u0646\u0627\u0635\u0631',
    item: '\u0639\u0646\u0635\u0631',
    qty: '\u0643\u0645\u064a\u0629',
    total: '\u0627\u0644\u0645\u062c\u0645\u0648\u0639',
    liveActivity: '\u0627\u0644\u0646\u0634\u0627\u0637 \u0627\u0644\u0645\u0628\u0627\u0634\u0631',
    selectTicketHint:
      '\u0627\u062e\u062a\u0631 \u062a\u0630\u0643\u0631\u0629 \u0645\u0646 \u0627\u0644\u0644\u0648\u062d\u0629 \u0623\u0648 \u0637\u0627\u0648\u0644\u0629 \u0644\u0639\u0631\u0636 \u0627\u0644\u062a\u0641\u0627\u0635\u064a\u0644.',
    activeTickets: '\u062a\u0630\u0627\u0643\u0631 \u0646\u0634\u0637\u0629',
    tablesCount: '\u0637\u0627\u0648\u0644\u0627\u062a',
    legend: '\u0627\u0644\u062f\u0644\u064a\u0644',
    available: '\u0645\u062a\u0648\u0641\u0631',
    activeOrders: '\u0637\u0644\u0628\u0627\u062a \u0646\u0634\u0637\u0629',
    orderBoardTitle: '\u0644\u0648\u062d\u0629 \u062d\u0631\u0643\u0629 \u0627\u0644\u0637\u0644\u0628\u0627\u062a',
    orderBoardSubtitle:
      '\u0643\u0644 \u062a\u0630\u0643\u0631\u0629 \u0645\u0633\u062a\u0642\u0644\u0629 \u0644\u0637\u0644\u0628\u0627\u062a \u0627\u0644\u0635\u0627\u0644\u0629 \u0623\u0648 \u0627\u0644\u0637\u0644\u0628\u0627\u062a \u0627\u0644\u062e\u0627\u0631\u062c\u064a\u0629.',
    ordersHistoryTitle: '\u0633\u062c\u0644 \u0637\u0644\u0628\u0627\u062a \u0627\u0644\u064a\u0648\u0645',
    ordersHistorySubtitle:
      '\u0645\u0631\u0627\u062c\u0639\u0629 \u0637\u0644\u0628\u0627\u062a \u0627\u0644\u064a\u0648\u0645 \u0627\u0644\u062e\u0627\u0631\u062c\u064a\u0629 \u0648\u062f\u0627\u062e\u0644 \u0627\u0644\u0645\u0637\u0639\u0645 \u0645\u0639 \u0641\u062a\u062d \u0627\u0644\u062a\u0641\u0627\u0635\u064a\u0644 \u0644\u0644\u0637\u0628\u0627\u0639\u0629 \u0623\u0648 \u062a\u0639\u062f\u064a\u0644 \u0627\u0644\u0643\u0627\u0634\u064a\u0631.',
    todayOrdersHistory: '\u0637\u0644\u0628\u0627\u062a \u0627\u0644\u064a\u0648\u0645',
    tablesTitle: '\u0645\u062e\u0637\u0637 \u0627\u0644\u0635\u0627\u0644\u0629',
    tablesSubtitle:
      '\u0643\u0644 \u0636\u064a\u0641 \u0639\u0644\u0649 \u0627\u0644\u0637\u0627\u0648\u0644\u0629 \u064a\u062d\u062a\u0641\u0638 \u0628\u062a\u0630\u0643\u0631\u0629 \u0645\u0633\u062a\u0642\u0644\u0629.',
    tableBillingTitle: '\u0641\u0627\u062a\u0648\u0631\u0629 \u0627\u0644\u0637\u0627\u0648\u0644\u0629',
    tableBillingSubtitle:
      '\u0641\u0627\u062a\u0648\u0631\u0629 \u0645\u0648\u062d\u062f\u0629 \u0644\u0644\u0643\u0627\u0634\u064a\u0631 \u062a\u062c\u0645\u0639 \u062c\u0645\u064a\u0639 \u0637\u0644\u0628\u0627\u062a \u0627\u0644\u0637\u0627\u0648\u0644\u0629.',
    composeTitle: '\u0637\u0644\u0628 \u062c\u062f\u064a\u062f',
    composeSubtitle:
      '\u0627\u062e\u062a\u0631 \u0627\u0644\u0623\u0635\u0646\u0627\u0641 \u062b\u0645 \u0623\u0631\u0633\u0644\u0647\u0627 \u0625\u0644\u0649 \u0627\u0644\u0645\u0637\u0628\u062e.',
    orderDetailTitle: '\u062a\u0641\u0627\u0635\u064a\u0644 \u0627\u0644\u0637\u0644\u0628',
    orderDetailSubtitle:
      '\u0639\u062f\u0644 \u0627\u0644\u0623\u0635\u0646\u0627\u0641 \u0642\u0628\u0644 \u0627\u0644\u062f\u0641\u0639.',
    paymentTitle: '\u0627\u0644\u062f\u0641\u0639',
    paymentSubtitle:
      '\u0627\u062e\u062a\u0631 \u0637\u0631\u064a\u0642\u0629 \u0627\u0644\u062f\u0641\u0639 \u062b\u0645 \u0623\u0643\u062f.',
    receiptTitle: '\u0627\u0644\u0648\u0635\u0644',
    receiptSubtitle:
      '\u0627\u0637\u0628\u0639 \u0627\u0644\u0648\u0635\u0644 \u0644\u0644\u0636\u064a\u0641.',
    walkIn: '\u0637\u0644\u0628 \u062e\u0627\u0631\u062c\u064a',
    walkInTakeaway: '\u0637\u0644\u0628 \u062e\u0627\u0631\u062c\u064a / \u0633\u0641\u0631\u064a',
    noActiveOrders:
      '\u0644\u0627 \u062a\u0648\u062c\u062f \u0637\u0644\u0628\u0627\u062a \u0646\u0634\u0637\u0629. \u0623\u0646\u0634\u0626 \u062a\u0630\u0643\u0631\u0629 \u062e\u0627\u0631\u062c\u064a\u0629 \u0623\u0648 \u0627\u0646\u062a\u0638\u0631 \u0637\u0644\u0628\u0627\u062a \u0627\u0644\u0636\u064a\u0648\u0641.',
    noOrdersHistory:
      '\u0644\u0627 \u062a\u0648\u062c\u062f \u0637\u0644\u0628\u0627\u062a \u0645\u0633\u062c\u0644\u0629 \u0627\u0644\u064a\u0648\u0645 \u0628\u0639\u062f.',
    createWalkIn: '\u0637\u0644\u0628 \u062e\u0627\u0631\u062c\u064a',
    pending: '\u0642\u064a\u062f \u0627\u0644\u0627\u0646\u062a\u0638\u0627\u0631',
    preparing: '\u0642\u064a\u062f \u0627\u0644\u062a\u062d\u0636\u064a\u0631',
    ready: '\u062c\u0627\u0647\u0632',
    delivered: '\u062a\u0645 \u0627\u0644\u062a\u0633\u0644\u064a\u0645',
    readyToPay: '\u062c\u0627\u0647\u0632 \u0644\u0644\u062f\u0641\u0639',
    prepareAction: '\u0627\u0628\u062f\u0623 \u0627\u0644\u062a\u062d\u0636\u064a\u0631',
    readyAction: '\u062a\u0639\u0644\u064a\u0645 \u0643\u062c\u0627\u0647\u0632',
    deliverAction: '\u062a\u0633\u0644\u064a\u0645',
    payAction: '\u062f\u0641\u0639',
    edit: '\u062a\u0639\u062f\u064a\u0644',
    openOrderDetails: '\u0641\u062a\u062d \u0627\u0644\u062a\u0641\u0627\u0635\u064a\u0644',
    printInvoice: '\u0637\u0628\u0627\u0639\u0629 \u0627\u0644\u0641\u0627\u062a\u0648\u0631\u0629',
    floorPlan: '\u0645\u062e\u0637\u0637 \u0627\u0644\u0635\u0627\u0644\u0629',
    table: '\u0637\u0627\u0648\u0644\u0629',
    tableBundle: '\u0645\u062c\u0645\u0648\u0639\u0629 \u0637\u0627\u0648\u0644\u0629',
    guest: '\u0636\u064a\u0641',
    tickets: '\u062a\u0630\u0627\u0643\u0631',
    ticket: '\u062a\u0630\u0643\u0631\u0629',
    ordersCount: '\u0637\u0644\u0628\u0627\u062a',
    order: '\u0637\u0644\u0628',
    dineIn: '\u062f\u0627\u062e\u0644 \u0627\u0644\u0645\u0637\u0639\u0645',
    seats: '\u0645\u0642\u0627\u0639\u062f',
    seat: '\u0645\u0642\u0639\u062f',
    newTicket: '\u062a\u0630\u0643\u0631\u0629 \u062c\u062f\u064a\u062f\u0629',
    noTableOrders:
      '\u0644\u0627 \u062a\u0648\u062c\u062f \u0637\u0644\u0628\u0627\u062a \u0646\u0634\u0637\u0629. \u064a\u0645\u0643\u0646 \u0644\u0644\u0636\u064a\u0648\u0641 \u0645\u0633\u062d QR \u0623\u0648 \u064a\u0645\u0643\u0646 \u0644\u0644\u0645\u0648\u0638\u0641 \u0625\u0646\u0634\u0627\u0621 \u062a\u0630\u0643\u0631\u0629.',
    activeTicketsAtTable: '\u0627\u0644\u062a\u0630\u0627\u0643\u0631 \u0627\u0644\u0646\u0634\u0637\u0629 \u0641\u064a \u0647\u0630\u0647 \u0627\u0644\u0637\u0627\u0648\u0644\u0629',
    tableTotal: '\u0625\u062c\u0645\u0627\u0644\u064a \u0627\u0644\u0637\u0627\u0648\u0644\u0629',
    payAllTableTickets: '\u062f\u0641\u0639 \u062c\u0645\u064a\u0639 \u062a\u0630\u0627\u0643\u0631 \u0627\u0644\u0637\u0627\u0648\u0644\u0629',
    mainHall: '\u0627\u0644\u0635\u0627\u0644\u0629 \u0627\u0644\u0631\u0626\u064a\u0633\u064a\u0629',
    window: '\u0627\u0644\u0646\u0627\u0641\u0630\u0629',
    bar: '\u0627\u0644\u0628\u0627\u0631',
    noOrderInProgress: '\u0644\u0627 \u064a\u0648\u062c\u062f \u0637\u0644\u0628 \u062c\u0627\u0631\u064d.',
    sendToKitchen: '\u0625\u0631\u0633\u0627\u0644 \u0625\u0644\u0649 \u0627\u0644\u0645\u0637\u0628\u062e',
    orderedAt: '\u0637\u064f\u0644\u0628 \u0639\u0646\u062f',
    customerApp: '\u062a\u0637\u0628\u064a\u0642 \u0627\u0644\u0632\u0628\u0648\u0646',
    enterEditReason: '\u0623\u062f\u062e\u0644 \u0633\u0628\u0628 \u062a\u0639\u062f\u064a\u0644 \u0627\u0644\u0643\u0627\u0634\u064a\u0631 \u0644\u0647\u0630\u0627 \u0627\u0644\u0637\u0644\u0628',
    defaultEditReason: '\u0642\u0627\u0645 \u0627\u0644\u0643\u0627\u0634\u064a\u0631 \u0628\u062a\u0639\u062f\u064a\u0644 \u0627\u0644\u0637\u0644\u0628 \u0645\u0646 \u0633\u062c\u0644 POS',
    defaultCheckoutEditReason: '\u0642\u0627\u0645 \u0627\u0644\u0643\u0627\u0634\u064a\u0631 \u0628\u062a\u0639\u062f\u064a\u0644 \u0627\u0644\u0637\u0644\u0628 \u0645\u0646 \u0635\u0641\u062d\u0629 \u0627\u0644\u062f\u0641\u0639',
    defaultBoardEditReason: '\u0642\u0627\u0645 \u0627\u0644\u0643\u0627\u0634\u064a\u0631 \u0628\u062a\u0639\u062f\u064a\u0644 \u0627\u0644\u0637\u0644\u0628 \u0645\u0646 \u0644\u0648\u062d\u0629 \u0627\u0644\u0637\u0644\u0628\u0627\u062a',
    defaultTableEditReason: '\u0642\u0627\u0645 \u0627\u0644\u0643\u0627\u0634\u064a\u0631 \u0628\u062a\u0639\u062f\u064a\u0644 \u0627\u0644\u0637\u0644\u0628 \u0645\u0646 \u0634\u0627\u0634\u0629 \u0627\u0644\u0637\u0627\u0648\u0644\u0629',
    editReasonRequired: '\u064a\u062c\u0628 \u0625\u062f\u062e\u0627\u0644 \u0633\u0628\u0628 \u062a\u0639\u062f\u064a\u0644 \u0627\u0644\u0643\u0627\u0634\u064a\u0631 \u0642\u0628\u0644 \u0627\u0644\u062d\u0641\u0638.',
    editReasonHelper: '\u0633\u064a\u062a\u0645 \u062d\u0641\u0638 \u0647\u0630\u0627 \u0627\u0644\u0633\u0628\u0628 \u0641\u064a \u0635\u0641\u062d\u0629 employee-risk \u0645\u0639 \u062a\u0641\u0627\u0635\u064a\u0644 \u0627\u0644\u0637\u0644\u0628 \u0643\u0627\u0645\u0644\u0629 \u0642\u0628\u0644 \u0627\u0644\u062a\u0639\u062f\u064a\u0644 \u0648\u0628\u0639\u062f\u0647.',
    walkInComposeSubtitle:
      '\u0627\u062e\u062a\u0631 \u0623\u0635\u0646\u0627\u0641 \u0627\u0644\u0636\u064a\u0641 \u062b\u0645 \u0623\u0631\u0633\u0644\u0647\u0627 \u0645\u0628\u0627\u0634\u0631\u0629 \u0625\u0644\u0649 \u0627\u0644\u0645\u0637\u0628\u062e.',
    tableComposeSubtitle:
      '\u0623\u0646\u0634\u0626 \u0637\u0644\u0628 POS \u062c\u062f\u064a\u062f \u0644\u0647\u0630\u0647 \u0627\u0644\u0637\u0627\u0648\u0644\u0629.',
    selectToEdit:
      '\u0627\u062e\u062a\u0631 \u062a\u0630\u0643\u0631\u0629 \u0645\u0646 \u0627\u0644\u0644\u0648\u062d\u0629 \u0623\u0648 \u0637\u0627\u0648\u0644\u0629 \u0644\u062a\u0639\u062f\u064a\u0644\u0647\u0627.',
    addItemsTitle: '\u0625\u0636\u0627\u0641\u0629 \u0623\u0635\u0646\u0627\u0641',
    addToTicket: '\u0625\u0636\u0627\u0641\u0629 \u0625\u0644\u0649 \u0627\u0644\u062a\u0630\u0643\u0631\u0629',
    addFromMenu: '\u0625\u0636\u0627\u0641\u0629 \u0645\u0646 \u0627\u0644\u0645\u0646\u064a\u0648',
    save: '\u062d\u0641\u0638',
    saving: '\u062c\u0627\u0631\u064d \u0627\u0644\u062d\u0641\u0638...',
    cancel: '\u0625\u0644\u063a\u0627\u0621',
    cancelling: '\u062c\u0627\u0631\u064d \u0627\u0644\u0625\u0644\u063a\u0627\u0621...',
    cancelOrder: '\u0625\u0644\u063a\u0627\u0621 \u0627\u0644\u0637\u0644\u0628',
    cancelOrderReason: '\u0633\u0628\u0628 \u0625\u0644\u063a\u0627\u0621 \u0627\u0644\u0637\u0644\u0628',
    cancelOrderHelper:
      '\u0647\u0630\u0627 \u0627\u0644\u0633\u0628\u0628 \u0625\u062c\u0628\u0627\u0631\u064a \u0648\u0633\u064a\u062a\u0645 \u062a\u0633\u062c\u064a\u0644\u0647 \u0641\u064a \u0633\u062c\u0644 \u0627\u0644\u062a\u062f\u0642\u064a\u0642.',
    cancelOrderDefaultReason:
      '\u0642\u0627\u0645 \u0627\u0644\u0643\u0627\u0634\u064a\u0631 \u0628\u0625\u0644\u063a\u0627\u0621 \u0627\u0644\u0637\u0644\u0628 \u0645\u0646 \u0646\u0642\u0637\u0629 \u0627\u0644\u0628\u064a\u0639',
    couldNotCancel: '\u062a\u0639\u0630\u0631 \u0625\u0644\u063a\u0627\u0621 \u0627\u0644\u0637\u0644\u0628.',
    couldNotSave: '\u062a\u0639\u0630\u0631 \u062d\u0641\u0638 \u0627\u0644\u062a\u0639\u062f\u064a\u0644\u0627\u062a.',
    pay: '\u062f\u0641\u0639',
    orderItems: '\u0623\u0635\u0646\u0627\u0641 \u0627\u0644\u0637\u0644\u0628',
    noItemsYet: '\u0644\u0627 \u062a\u0648\u062c\u062f \u0623\u0635\u0646\u0627\u0641 \u0628\u0639\u062f.',
    each: '\u0644\u0643\u0644 \u0648\u0627\u062d\u062f',
    backToBoard: '\u0627\u0644\u0631\u062c\u0648\u0639 \u0625\u0644\u0649 \u0644\u0648\u062d\u0629 \u0627\u0644\u0637\u0644\u0628\u0627\u062a',
    groupedTableCheckout: '\u062f\u0641\u0639 \u0645\u062c\u0645\u0639 \u0644\u0644\u0637\u0627\u0648\u0644\u0629',
    selectTicketBeforeCheckout:
      '\u0627\u062e\u062a\u0631 \u062a\u0630\u0643\u0631\u0629 \u0642\u0628\u0644 \u0627\u0644\u062f\u0641\u0639.',
    includedTickets: '\u0627\u0644\u062a\u0630\u0627\u0643\u0631 \u0627\u0644\u0645\u0634\u0645\u0648\u0644\u0629',
    paymentMethod: '\u0637\u0631\u064a\u0642\u0629 \u0627\u0644\u062f\u0641\u0639',
    processing: '\u062c\u0627\u0631\u064d \u0627\u0644\u0645\u0639\u0627\u0644\u062c\u0629...',
    payNow: '\u0627\u062f\u0641\u0639 \u0627\u0644\u0622\u0646',
    completePaymentToPreview:
      '\u0623\u0643\u0645\u0644 \u0639\u0645\u0644\u064a\u0629 \u062f\u0641\u0639 \u0644\u0645\u0639\u0627\u064a\u0646\u0629 \u0627\u0644\u0648\u0635\u0644.',
    printAgain: '\u0637\u0628\u0627\u0639\u0629 \u0645\u0631\u0629 \u0623\u062e\u0631\u0649',
    printReceipt: '\u0637\u0628\u0627\u0639\u0629 \u0627\u0644\u0641\u0627\u062a\u0648\u0631\u0629',
    receiptLanguage: '\u0644\u063a\u0629 \u0627\u0644\u0641\u0627\u062a\u0648\u0631\u0629',
    arabicOnly: '\u0627\u0644\u0639\u0631\u0628\u064a\u0629',
    frenchOnly: '\u0627\u0644\u0641\u0631\u0646\u0633\u064a\u0629',
    englishOnly: '\u0627\u0644\u0625\u0646\u062c\u0644\u064a\u0632\u064a\u0629',
    chooseReceiptLanguage: '\u0627\u062e\u062a\u0631 \u0644\u063a\u0629 \u0627\u0644\u0641\u0627\u062a\u0648\u0631\u0629 \u0642\u0628\u0644 \u0627\u0644\u0637\u0628\u0627\u0639\u0629.',
    noAutoPrint: '\u0644\u0645 \u062a\u0639\u062f \u0627\u0644\u0637\u0628\u0627\u0639\u0629 \u062a\u0644\u0642\u0627\u0626\u064a\u0629.',
    restaurant: '\u0627\u0644\u0645\u0637\u0639\u0645',
    thankYou: '\u0634\u0643\u0631\u0627 \u0644\u0643\u0645',
    paid: '\u0645\u062f\u0641\u0648\u0639',
    chooseAtLeastOne:
      '\u0627\u062e\u062a\u0631 \u062e\u064a\u0627\u0631\u0627 \u0648\u0627\u062d\u062f\u0627 \u0639\u0644\u0649 \u0627\u0644\u0623\u0642\u0644 \u0641\u064a {{group}}',
    chooseAtLeastMany:
      '\u0627\u062e\u062a\u0631 {{count}} \u062e\u064a\u0627\u0631(\u0627\u062a) \u0639\u0644\u0649 \u0627\u0644\u0623\u0642\u0644 \u0641\u064a {{group}}',
    chooseUpTo:
      '\u0627\u062e\u062a\u0631 \u062d\u062a\u0649 {{count}} \u062e\u064a\u0627\u0631(\u0627\u062a) \u0641\u064a {{group}}',
    upToCount: '\u062d\u062a\u0649 {{count}}',
    couldNotLoadMenus: '\u062a\u0639\u0630\u0631 \u062a\u062d\u0645\u064a\u0644 \u0627\u0644\u0642\u0648\u0627\u0626\u0645.',
    couldNotLoadMenuItems: '\u062a\u0639\u0630\u0631 \u062a\u062d\u0645\u064a\u0644 \u0623\u0635\u0646\u0627\u0641 \u0627\u0644\u0645\u0646\u064a\u0648.',
    couldNotSubmitOrder: '\u062a\u0639\u0630\u0631 \u0625\u0631\u0633\u0627\u0644 \u0627\u0644\u0637\u0644\u0628.',
    back: '\u0631\u062c\u0648\u0639',
    chooseMenu: '\u0627\u062e\u062a\u0631 \u0642\u0627\u0626\u0645\u0629',
    loading: '\u062c\u0627\u0631\u064d \u0627\u0644\u062a\u062d\u0645\u064a\u0644...',
    menus: '\u0627\u0644\u0642\u0648\u0627\u0626\u0645',
    modifierGroups: '\u0645\u062c\u0645\u0648\u0639\u0627\u062a \u0625\u0636\u0627\u0641\u0627\u062a',
    add: '\u0625\u0636\u0627\u0641\u0629',
    currentTicket: '\u0627\u0644\u062a\u0630\u0643\u0631\u0629 \u0627\u0644\u062d\u0627\u0644\u064a\u0629',
    addItemsFromMenu: '\u0623\u0636\u0641 \u0623\u0635\u0646\u0627\u0641\u0627 \u0645\u0646 \u0627\u0644\u0645\u0646\u064a\u0648.',
    submitting: '\u062c\u0627\u0631\u064d \u0627\u0644\u0625\u0631\u0633\u0627\u0644...',
    customize: '\u062a\u062e\u0635\u064a\u0635',
    required: '\u0625\u062c\u0628\u0627\u0631\u064a',
    optional: '\u0627\u062e\u062a\u064a\u0627\u0631\u064a',
    included: '\u0645\u0634\u0645\u0648\u0644',
    kitchenNote: '\u0645\u0644\u0627\u062d\u0638\u0629 \u0627\u0644\u0645\u0637\u0628\u062e',
    kitchenNotePlaceholder:
      '\u0637\u0644\u0628 \u062e\u0627\u0635\u060c \u062d\u0633\u0627\u0633\u064a\u0629\u060c \u0623\u0648 \u062a\u0639\u0644\u064a\u0645\u0627\u062a \u0625\u0636\u0627\u0641\u064a\u0629',
    lineTotal: '\u0625\u062c\u0645\u0627\u0644\u064a \u0627\u0644\u0633\u0637\u0631',
    saveLine: '\u062d\u0641\u0638 \u0627\u0644\u0633\u0637\u0631',
    card: '\u0628\u0637\u0627\u0642\u0629',
    cardHint: '\u062f\u0641\u0639 \u0628\u0627\u0644\u0628\u0637\u0627\u0642\u0629 \u0627\u0644\u0628\u0646\u0643\u064a\u0629',
    cash: '\u0646\u0642\u062f\u0627',
    cashHint: '\u062f\u0641\u0639 \u0646\u0642\u062f\u064a',
    bankTransfer: '\u062a\u062d\u0648\u064a\u0644 \u0628\u0646\u0643\u064a',
    bankTransferHint: '\u062f\u0641\u0639 \u0639\u0628\u0631 \u0627\u0644\u0628\u0646\u0643',
    mobilePayment: '\u062f\u0641\u0639 \u0639\u0628\u0631 \u0627\u0644\u0647\u0627\u062a\u0641',
    mobilePaymentHint: '\u0645\u062d\u0641\u0638\u0629 \u0623\u0648 \u062a\u0637\u0628\u064a\u0642 \u062f\u0641\u0639',
    posConnected: 'POS \u0645\u062a\u0635\u0644',
    posConnectedDetail:
      '\u0633\u062a\u0638\u0647\u0631 \u0627\u0644\u0637\u0644\u0628\u0627\u062a \u0648\u0627\u0644\u0637\u0627\u0648\u0644\u0627\u062a \u0647\u0646\u0627 \u0645\u0639 \u0628\u062f\u0627\u064a\u0629 \u0627\u0644\u062e\u062f\u0645\u0629.',
    now: '\u0627\u0644\u0622\u0646',
    posHub: 'POS Hub',
    loadingServiceData: '\u062c\u0627\u0631\u064d \u062a\u062d\u0645\u064a\u0644 \u0628\u064a\u0627\u0646\u0627\u062a \u0627\u0644\u062e\u062f\u0645\u0629...',
    connectionError: '\u062e\u0637\u0623 \u0641\u064a \u0627\u0644\u0627\u062a\u0635\u0627\u0644',
    ensureBackend: '\u062a\u0623\u0643\u062f \u0623\u0646 \u0627\u0644\u0628\u0627\u0643\u0627\u0646\u062f \u064a\u0639\u0645\u0644 \u0639\u0644\u0649 \u0627\u0644\u0645\u0646\u0641\u0630 4000.',
    unifiedBilling: '\u0641\u0627\u062a\u0648\u0631\u0629 \u0645\u0648\u062d\u062f\u0629',
    orderViewMode: '\u0639\u0631\u0636 \u0627\u0644\u0637\u0644\u0628\u0627\u062a',
    financialSummary: '\u0627\u0644\u0645\u0644\u062e\u0635 \u0627\u0644\u0645\u0627\u0644\u064a',
    ordersIncluded: '\u0627\u0644\u0637\u0644\u0628\u0627\u062a \u0627\u0644\u0645\u0634\u0645\u0648\u0644\u0629',
    paymentsHistory: '\u0627\u0644\u0645\u062f\u0641\u0648\u0639\u0627\u062a',
    guests: '\u0627\u0644\u0636\u064a\u0648\u0641',
    status: '\u0627\u0644\u062d\u0627\u0644\u0629',
    createdTime: '\u0648\u0642\u062a \u0627\u0644\u0625\u0646\u0634\u0627\u0621',
    amount: '\u0627\u0644\u0645\u0628\u0644\u063a',
    method: '\u0627\u0644\u0637\u0631\u064a\u0642\u0629',
    employee: '\u0627\u0644\u0645\u0648\u0638\u0641',
    outstanding: '\u0627\u0644\u0645\u062a\u0628\u0642\u064a',
    unpaid: '\u063a\u064a\u0631 \u0645\u062f\u0641\u0648\u0639',
    partiallyPaid: '\u0645\u062f\u0641\u0648\u0639 \u062c\u0632\u0626\u064a\u0627',
    allOrdersUnderOneBill:
      '\u062c\u0645\u064a\u0639 \u0637\u0644\u0628\u0627\u062a \u0627\u0644\u0637\u0627\u0648\u0644\u0629 \u0645\u062c\u0645\u0639\u0629 \u062f\u0627\u062e\u0644 \u0641\u0627\u062a\u0648\u0631\u0629 \u0648\u0627\u062d\u062f\u0629.',
    orderViewReadOnly:
      '\u0647\u0630\u0627 \u0627\u0644\u0648\u0636\u0639 \u0644\u0644\u0645\u062a\u0627\u0628\u0639\u0629 \u0641\u0642\u0637. \u0627\u0644\u062f\u0641\u0639 \u064a\u0628\u0642\u0649 \u0639\u0644\u0649 \u0645\u0633\u062a\u0648\u0649 \u0627\u0644\u0641\u0627\u062a\u0648\u0631\u0629 \u0627\u0644\u0645\u0648\u062d\u062f\u0629.',
    openTableBill: '\u0641\u062a\u062d \u0641\u0627\u062a\u0648\u0631\u0629 \u0627\u0644\u0637\u0627\u0648\u0644\u0629',
    noPaymentsYet: '\u0644\u0627 \u062a\u0648\u062c\u062f \u0645\u062f\u0641\u0648\u0639\u0627\u062a \u0645\u0633\u062c\u0644\u0629 \u0644\u0647\u0630\u0647 \u0627\u0644\u0637\u0627\u0648\u0644\u0629 \u0628\u0639\u062f.',
    noBillingData: '\u0644\u0627 \u062a\u0648\u062c\u062f \u0628\u064a\u0627\u0646\u0627\u062a \u0641\u0648\u062a\u0631\u0629 \u0645\u062a\u0627\u062d\u0629 \u0644\u0647\u0630\u0647 \u0627\u0644\u0637\u0627\u0648\u0644\u0629 \u0628\u0639\u062f.',
    paymentMethodsUsed: '\u0637\u0631\u0642 \u0627\u0644\u062f\u0641\u0639 \u0627\u0644\u0645\u0633\u062a\u062e\u062f\u0645\u0629',
    cashier: '\u0627\u0644\u0643\u0627\u0634\u064a\u0631',
    billDate: '\u062a\u0627\u0631\u064a\u062e \u0627\u0644\u0641\u0627\u062a\u0648\u0631\u0629',
  },
};

const screenCopyKeys: Record<
  PosScreen,
  { title: keyof PosDictionary; subtitle: keyof PosDictionary }
> = {
  orders: { title: 'orderBoardTitle', subtitle: 'orderBoardSubtitle' },
  tables: { title: 'tablesTitle', subtitle: 'tablesSubtitle' },
  'table-billing': { title: 'tableBillingTitle', subtitle: 'tableBillingSubtitle' },
  'external-orders': { title: 'externalOrders', subtitle: 'walkInComposeSubtitle' },
  'orders-history': { title: 'ordersHistoryTitle', subtitle: 'ordersHistorySubtitle' },
  'order-compose': { title: 'composeTitle', subtitle: 'composeSubtitle' },
  'order-detail': { title: 'orderDetailTitle', subtitle: 'orderDetailSubtitle' },
  checkout: { title: 'paymentTitle', subtitle: 'paymentSubtitle' },
  receipt: { title: 'receiptTitle', subtitle: 'receiptSubtitle' },
};

export function posT(language: PosLanguage) {
  return dictionary[language];
}

export function posDir(language: PosLanguage) {
  return language === 'ar' ? 'rtl' : 'ltr';
}

export function replaceTemplate(template: string, values: Record<string, string | number>) {
  return Object.entries(values).reduce(
    (result, [key, value]) => result.replace(`{{${key}}}`, String(value)),
    template,
  );
}

function localizedName<
  T extends { name: string; nameEn?: string | null; nameFr?: string | null; nameAr?: string | null },
>(entity: T, language: PosLanguage) {
  if (language === 'ar') {
    return entity.nameAr ?? entity.name;
  }

  if (language === 'fr') {
    return entity.nameFr ?? entity.nameEn ?? entity.name;
  }

  return entity.nameEn ?? entity.name;
}

export function localizeMenuName(menu: MenuDTO, language: PosLanguage) {
  return localizedName(menu, language);
}

export function localizeMenuItemName(item: MenuItemDTO, language: PosLanguage) {
  return localizedName(item, language);
}

export function localizeModifierGroupName(group: ModifierGroupDTO, language: PosLanguage) {
  return localizedName(group, language);
}

export function localizeModifierOptionName(option: ModifierOptionDTO, language: PosLanguage) {
  return localizedName(option, language);
}

export function localizeModifierName(modifier: OrderItemModifierDTO, language: PosLanguage) {
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

export function getPosNavItems(language: PosLanguage): NavItem[] {
  const t = posT(language);

  return [
    { id: 'orders', label: t.orders, shortLabel: t.board },
    { id: 'tables', label: t.tables, shortLabel: t.floor },
    { id: 'external-orders', label: t.externalOrders, shortLabel: t.direct },
    { id: 'orders-history', label: t.ordersHistory, shortLabel: t.ordersHistory },
  ];
}

export function getPosScreenCopy(language: PosLanguage) {
  const t = posT(language);

  return Object.fromEntries(
    Object.entries(screenCopyKeys).map(([screen, keys]) => [
      screen,
      {
        title: t[keys.title],
        subtitle: t[keys.subtitle],
      },
    ]),
  ) as Record<PosScreen, { title: string; subtitle: string }>;
}

export function getLocalizedPaymentMethods(language: PosLanguage): PaymentMethod[] {
  const t = posT(language);

  return [
    { id: 'cash', label: t.cash, hint: t.cashHint, backendMethod: 'CASH' },
    { id: 'card', label: t.card, hint: t.cardHint, backendMethod: 'CARD' },
    {
      id: 'bank-transfer',
      label: t.bankTransfer,
      hint: t.bankTransferHint,
      backendMethod: 'BANK_TRANSFER',
    },
    {
      id: 'mobile-payment',
      label: t.mobilePayment,
      hint: t.mobilePaymentHint,
      backendMethod: 'MOBILE_PAYMENT',
    },
  ];
}

export function getLocalizedPaymentMethod(language: PosLanguage, methodId: string) {
  return getLocalizedPaymentMethods(language).find((method) => method.id === methodId);
}

export function localizeBackendPaymentMethod(method: ApiPaymentMethod, language: PosLanguage) {
  const methods = getLocalizedPaymentMethods(language);
  return methods.find((entry) => entry.backendMethod === method)?.label ?? method;
}

export function localizeFinancialStatus(
  status: 'PAID' | 'UNPAID' | 'PARTIALLY_PAID',
  language: PosLanguage,
) {
  const t = posT(language);

  switch (status) {
    case 'PAID':
      return t.paid;
    case 'PARTIALLY_PAID':
      return t.partiallyPaid;
    default:
      return t.unpaid;
  }
}

export function getLiveActivityFallback(language: PosLanguage): ActivityItem[] {
  const t = posT(language);

  return [
    {
      id: 'welcome',
      title: t.posConnected,
      detail: t.posConnectedDetail,
      time: t.now,
      tone: 'primary',
    },
  ];
}

export function localizeUiStatus(
  status: ApiOrderStatus | 'Pending' | 'Preparing' | 'Ready' | 'Delivered',
  language: PosLanguage,
) {
  const t = posT(language);

  switch (status) {
    case 'PENDING':
    case 'Pending':
      return t.pending;
    case 'PREPARING':
    case 'Preparing':
      return t.preparing;
    case 'READY':
    case 'Ready':
      return t.ready;
    case 'DELIVERED':
    case 'Delivered':
      return t.delivered;
    default:
      return status;
  }
}

export function localizeActionLabel(
  status: ApiOrderStatus | 'Pending' | 'Preparing' | 'Ready' | 'Delivered',
  language: PosLanguage,
) {
  const t = posT(language);

  switch (status) {
    case 'PENDING':
    case 'Pending':
      return t.prepareAction;
    case 'PREPARING':
    case 'Preparing':
      return t.readyAction;
    case 'READY':
    case 'Ready':
      return t.deliverAction;
    case 'DELIVERED':
    case 'Delivered':
      return t.payAction;
    default:
      return t.edit;
  }
}

export function localizeTableStatus(status: DiningTable['status'], language: PosLanguage) {
  const t = posT(language);

  switch (status) {
    case 'available':
      return t.available;
    case 'occupied':
      return t.activeOrders;
    case 'reserved':
      return t.pending;
    case 'preparing':
      return t.preparing;
    default:
      return status;
  }
}

export function localizeAreaName(area: 'main-hall' | 'window' | 'bar', language: PosLanguage) {
  const t = posT(language);

  switch (area) {
    case 'window':
      return t.window;
    case 'bar':
      return t.bar;
    default:
      return t.mainHall;
  }
}

export function formatCountLabel(
  count: number,
  singular: string,
  plural: string,
  language: PosLanguage,
) {
  if (language === 'ar') {
    return `${count} ${plural}`;
  }

  return `${count} ${count === 1 ? singular : plural}`;
}

export function formatTableLabel(
  tableNumber: number | null | undefined,
  language: PosLanguage,
  walkIn = false,
) {
  const t = posT(language);

  if (walkIn || !tableNumber) {
    return t.walkInTakeaway;
  }

  return `${t.table} ${tableNumber}`;
}

export function formatGuestLabel(
  guestSessionId: string | null | undefined,
  dailyOrderNumber: string | number | null | undefined,
  language: PosLanguage,
  walkIn = false,
) {
  const t = posT(language);

  if (walkIn) {
    return t.walkIn;
  }

  if (guestSessionId?.startsWith('pos-')) {
    return `POS ${guestSessionId.slice(-4).toUpperCase()}`;
  }

  if (guestSessionId) {
    return `${t.guest} ${guestSessionId.slice(-4).toUpperCase()}`;
  }

  return `${t.ticket} ${dailyOrderNumber ?? ''}`.trim();
}

export function formatRelativeMinutes(isoDate: string, language: PosLanguage) {
  const diffMs = Date.now() - new Date(isoDate).getTime();
  const minutes = Math.max(1, Math.floor(diffMs / 60000));

  if (language === 'fr') {
    return `il y a ${minutes} min`;
  }

  if (language === 'ar') {
    return `\u0645\u0646\u0630 ${minutes} \u062f`;
  }

  return `${minutes} min ago`;
}
