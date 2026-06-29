import type { Language } from '@repo/i18n';

export type AdminLanguage = Language;

type Dictionary = Record<string, Record<AdminLanguage, string>>;

export const dictionary: Dictionary = {
  'brand.name': {
    en: 'Khalou-Fodil',
    fr: 'Khalou-Fodil',
    ar: 'Khalou-Fodil',
  },
  'brand.subtitle': {
    en: 'Restaurant Admin',
    fr: 'Administration du restaurant',
    ar: 'إدارة المطعم',
  },
  'search.placeholder': {
    en: 'Search orders, menu, tables, CRM...',
    fr: 'Rechercher commandes, menu, tables, CRM...',
    ar: 'ابحث في الطلبات والقائمة والطاولات والعملاء...',
  },
  'notifications.title': {
    en: 'Alerts & Notifications',
    fr: 'Alertes et Notifications',
    ar: 'التنبيهات والإشعارات',
  },
  'notifications.empty': {
    en: 'All caught up! No active warnings.',
    fr: 'Tout est a jour. Aucune alerte active.',
    ar: 'كل شيء جيد. لا توجد تنبيهات نشطة.',
  },
  'topbar.location': {
    en: 'Main Dining Hall',
    fr: 'Salle Principale',
    ar: 'القاعة الرئيسية',
  },
  'topbar.status': {
    en: 'Operational',
    fr: 'Operationnel',
    ar: 'يعمل',
  },
  'nav.dashboard': {
    en: 'Dashboard',
    fr: 'Tableau de bord',
    ar: 'لوحة التحكم',
  },
  'nav.orders': {
    en: 'Orders',
    fr: 'Commandes',
    ar: 'الطلبات',
  },
  'nav.menu': {
    en: 'Menu',
    fr: 'Menu',
    ar: 'القائمة',
  },
  'nav.tables': {
    en: 'Tables',
    fr: 'Tables',
    ar: 'الطاولات',
  },
  'nav.kitchen': {
    en: 'Khalou-Fodil Kitchen',
    fr: 'Cuisine Khalou-Fodil',
    ar: 'مطبخ Khalou-Fodil',
  },
  'nav.inventory': {
    en: 'Inventory',
    fr: 'Inventaire',
    ar: 'المخزون',
  },
  'nav.consumptionLogs': {
    en: 'Consumption Logs',
    fr: 'Journaux de consommation',
    ar: 'سجلات الاستهلاك',
  },
  'suppliers.category.Bakery': {
    en: 'Bakery',
    fr: 'Boulangerie',
    ar: 'مخبوزات',
  },
  'suppliers.category.Dairy': {
    en: 'Dairy',
    fr: 'Produits laitiers',
    ar: 'ألبان وأجبان',
  },
  'suppliers.category.Meat': {
    en: 'Meat',
    fr: 'Viandes',
    ar: 'لحوم',
  },
  'suppliers.category.Produce': {
    en: 'Produce',
    fr: 'Fruits et Légumes',
    ar: 'خضار وفواكه',
  },
  'suppliers.category.DryGoods': {
    en: 'Dry Goods',
    fr: 'Épicerie Sèche',
    ar: 'مواد جافة',
  },
  'nav.suppliers': {
    en: 'Suppliers',
    fr: 'Fournisseurs',
    ar: 'الموردون',
  },
  'nav.customers': {
    en: 'Customers CRM',
    fr: 'Clients CRM',
    ar: 'العملاء',
  },
  'nav.staff': {
    en: 'Staff & RBAC',
    fr: 'Equipe et RBAC',
    ar: 'الموظفون والصلاحيات',
  },
  'nav.printers': {
    en: 'Printers',
    fr: 'Imprimantes',
    ar: 'الطابعات',
  },
  'nav.analytics': {
    en: 'BI Analytics',
    fr: 'Analytique BI',
    ar: 'تحليلات الأعمال',
  },
  'nav.reports': {
    en: 'Reports Export',
    fr: 'Exports et Rapports',
    ar: 'التقارير',
  },
  'nav.monitoring': {
    en: 'Monitoring',
    fr: 'Surveillance',
    ar: 'المراقبة',
  },
  'nav.logs': {
    en: 'Audit Logs',
    fr: 'Journaux d audit',
    ar: 'سجلات التدقيق',
  },
  'nav.settings': {
    en: 'POS Settings',
    fr: 'Parametres POS',
    ar: 'الإعدادات',
  },
  'settings.title': {
    en: 'Settings',
    fr: 'Parametres',
    ar: 'الإعدادات',
  },
  'settings.subtitle': {
    en: 'Persistent restaurant and POS configuration from the database.',
    fr: 'Configuration persistante du restaurant et du POS depuis la base de donnees.',
    ar: 'إعدادات المطعم ونقطة البيع محفوظة في قاعدة البيانات.',
  },
  'settings.save': {
    en: 'Save',
    fr: 'Enregistrer',
    ar: 'حفظ',
  },
  'settings.refresh': {
    en: 'Refresh',
    fr: 'Actualiser',
    ar: 'تحديث',
  },
  'settings.restaurantName': {
    en: 'Restaurant name',
    fr: 'Nom du restaurant',
    ar: 'اسم المطعم',
  },
  'settings.contactPhone': {
    en: 'Contact phone',
    fr: 'Telephone',
    ar: 'رقم الهاتف',
  },
  'settings.address': {
    en: 'Address',
    fr: 'Adresse',
    ar: 'العنوان',
  },
  'settings.openingHours': {
    en: 'Opening hours',
    fr: 'Heure ouverture',
    ar: 'وقت الفتح',
  },
  'settings.closingHours': {
    en: 'Closing hours',
    fr: 'Heure fermeture',
    ar: 'وقت الإغلاق',
  },
  'settings.currency': {
    en: 'Currency',
    fr: 'Devise',
    ar: 'العملة',
  },
  'settings.salesTax': {
    en: 'Sales tax',
    fr: 'Taxe',
    ar: 'ضريبة المبيعات',
  },
  'settings.discount': {
    en: 'Default discount label',
    fr: 'Libelle remise par defaut',
    ar: 'اسم الخصم الافتراضي',
  },
  'settings.language': {
    en: 'Language',
    fr: 'Langue',
    ar: 'اللغة',
  },
  'settings.direction': {
    en: 'Direction',
    fr: 'Direction',
    ar: 'الاتجاه',
  },
  'settings.locale': {
    en: 'Locale',
    fr: 'Locale',
    ar: 'المنطقة',
  },
  'settings.dateFormat': {
    en: 'Date format',
    fr: 'Format de date',
    ar: 'تنسيق التاريخ',
  },
  'language.en': {
    en: 'English',
    fr: 'Anglais',
    ar: 'الإنجليزية',
  },
  'language.fr': {
    en: 'French',
    fr: 'Francais',
    ar: 'الفرنسية',
  },
  'language.ar': {
    en: 'Arabic',
    fr: 'Arabe',
    ar: 'العربية',
  },
  'dashboard.title': {
    en: 'Executive Overview',
    fr: 'Vue executive',
    ar: 'نظرة تنفيذية',
  },
  'dashboard.subtitle': {
    en: 'Business intelligence dashboard for managers and owners',
    fr: 'Tableau de bord analytique pour les managers et proprietaires',
    ar: 'لوحة تحليلات الأعمال للمديرين والمالكين',
  },
  'dashboard.last7days': {
    en: 'Last 7 Days',
    fr: '7 derniers jours',
    ar: 'آخر 7 أيام',
  },
  'dashboard.last4weeks': {
    en: 'Last 4 Weeks',
    fr: '4 dernieres semaines',
    ar: 'آخر 4 أسابيع',
  },
  'dashboard.last6months': {
    en: 'Last 6 Months',
    fr: '6 derniers mois',
    ar: 'آخر 6 أشهر',
  },
  'dashboard.exportReport': {
    en: 'Export Report',
    fr: 'Exporter rapport',
    ar: 'تصدير التقرير',
  },
  'dashboard.loading': {
    en: 'Loading...',
    fr: 'Chargement...',
    ar: 'جاري التحميل...',
  },
  'dashboard.pleaseWait': {
    en: 'Please wait',
    fr: 'Veuillez patienter',
    ar: 'يرجى الانتظار',
  },
  'dashboard.revenueToday': {
    en: "Today's Revenue",
    fr: 'Revenu du jour',
    ar: 'إيراد اليوم',
  },
  'dashboard.thisMonth': {
    en: 'This Month',
    fr: 'Ce mois',
    ar: 'هذا الشهر',
  },
  'dashboard.totalOrders': {
    en: 'Total Orders',
    fr: 'Total commandes',
    ar: 'إجمالي الطلبات',
  },
  'dashboard.cancelled': {
    en: 'Cancelled',
    fr: 'Annules',
    ar: 'الملغاة',
  },
  'dashboard.returningGuests': {
    en: 'Returning Guests',
    fr: 'Clients de retour',
    ar: 'العملاء العائدون',
  },
  'dashboard.revenueTrends': {
    en: 'Revenue Trends',
    fr: 'Tendance des revenus',
    ar: 'اتجاه الإيرادات',
  },
  'dashboard.topDishes': {
    en: 'Top Selling Dishes',
    fr: 'Plats les plus vendus',
    ar: 'الأطباق الأكثر مبيعًا',
  },
  'dashboard.recentOrders': {
    en: 'Recent Orders',
    fr: 'Dernieres commandes',
    ar: 'أحدث الطلبات',
  },
  'dashboard.ordersByHour': {
    en: 'Orders by Hour',
    fr: 'Commandes par heure',
    ar: 'الطلبات حسب الساعة',
  },
  'dashboard.orderSummary': {
    en: 'Order Summary',
    fr: 'Resume des commandes',
    ar: 'ملخص الطلبات',
  },
  'analytics.title': {
    en: 'Business Intelligence & Analytics',
    fr: 'Business Intelligence et Analytique',
    ar: 'ذكاء الأعمال والتحليلات',
  },
  'analytics.subtitle': {
    en: 'Fully live analytics built from restaurant orders and menu performance.',
    fr: 'Analytique en direct basee sur les commandes et la performance du menu.',
    ar: 'تحليلات مباشرة مبنية على الطلبات وأداء القائمة.',
  },
  'analytics.daily': {
    en: 'Daily',
    fr: 'Journalier',
    ar: 'يومي',
  },
  'analytics.weekly': {
    en: 'Weekly',
    fr: 'Hebdomadaire',
    ar: 'أسبوعي',
  },
  'analytics.monthly': {
    en: 'Monthly',
    fr: 'Mensuel',
    ar: 'شهري',
  },
  'analytics.exportSheets': {
    en: 'Export Sheets',
    fr: 'Exporter feuilles',
    ar: 'تصدير الجداول',
  },
  'tables.title': {
    en: 'Table & Floor Plan',
    fr: 'Tables et plan de salle',
    ar: 'الطاولات ومخطط الصالة',
  },
  'tables.subtitle': {
    en: 'Manage seating arrangements, QR codes, and live occupancy status.',
    fr: 'Gerer les tables, QR codes et l occupation en direct.',
    ar: 'إدارة الطاولات ورموز QR وحالة الإشغال المباشرة.',
  },
  'tables.floorMap': {
    en: 'Floor Map',
    fr: 'Plan de salle',
    ar: 'مخطط الصالة',
  },
  'tables.gridView': {
    en: 'Grid View',
    fr: 'Vue grille',
    ar: 'عرض شبكي',
  },
  'tables.createTable': {
    en: 'Create Table',
    fr: 'Ajouter table',
    ar: 'إنشاء طاولة',
  },
  'tables.loading': {
    en: 'Loading tables',
    fr: 'Chargement des tables',
    ar: 'تحميل الطاولات',
  },
  'tables.viewQr': {
    en: 'View QR',
    fr: 'Voir QR',
    ar: 'عرض QR',
  },
  'tables.download': {
    en: 'Download',
    fr: 'Telecharger',
    ar: 'تنزيل',
  },
  'tables.print': {
    en: 'Print',
    fr: 'Imprimer',
    ar: 'طباعة',
  },
  'tables.edit': {
    en: 'Edit',
    fr: 'Modifier',
    ar: 'تعديل',
  },
  'tables.delete': {
    en: 'Delete',
    fr: 'Supprimer',
    ar: 'حذف',
  },
  'tables.restaurantScope': {
    en: 'Restaurant Scope',
    fr: 'Contexte restaurant',
    ar: 'نطاق المطعم',
  },
  'tables.totalTables': {
    en: 'Total Tables',
    fr: 'Total tables',
    ar: 'إجمالي الطاولات',
  },
  'tables.bulkPrint': {
    en: 'Bulk Print',
    fr: 'Impression groupee',
    ar: 'طباعة جماعية',
  },
  'tables.printA4Sheet': {
    en: 'Print A4 Sheet',
    fr: 'Imprimer feuille A4',
    ar: 'طباعة ورقة A4',
  },
  'orders.title': {
    en: 'Order Operations',
    fr: 'Operations des commandes',
    ar: 'عمليات الطلبات',
  },
  'orders.subtitle': {
    en: 'Live order flow backed by database and analytics services.',
    fr: 'Flux de commandes en direct relie a la base et aux analyses.',
    ar: 'تدفق الطلبات المباشر مرتبط بقاعدة البيانات والتحليلات.',
  },
  'orders.today': {
    en: 'Today',
    fr: 'Aujourd hui',
    ar: 'اليوم',
  },
  'orders.export': {
    en: 'Export Orders',
    fr: 'Exporter commandes',
    ar: 'تصدير الطلبات',
  },
  'orders.pendingQueue': {
    en: 'Pending Queue',
    fr: 'File en attente',
    ar: 'الطلبات المعلقة',
  },
  'orders.cookingNow': {
    en: 'Cooking Now',
    fr: 'قيد التحضير',
    ar: 'قيد التحضير',
  },
  'orders.readyForHandoff': {
    en: 'Ready for Handoff',
    fr: 'Pret a livraison',
    ar: 'جاهز للتسليم',
  },
  'orders.averageTicket': {
    en: 'Average Ticket',
    fr: 'Ticket moyen',
    ar: 'متوسط الفاتورة',
  },
  'orders.refresh': {
    en: 'Refresh',
    fr: 'Actualiser',
    ar: 'تحديث',
  },
  'orders.liveQueue': {
    en: 'Live Order Queue',
    fr: 'File de commandes en direct',
    ar: 'قائمة الطلبات المباشرة',
  },
  'orders.orderId': {
    en: 'Order ID',
    fr: 'ID commande',
    ar: 'رقم الطلب',
  },
  'orders.source': {
    en: 'Source',
    fr: 'Source',
    ar: 'المصدر',
  },
  'orders.status': {
    en: 'Status',
    fr: 'Statut',
    ar: 'الحالة',
  },
  'orders.items': {
    en: 'Items',
    fr: 'Articles',
    ar: 'العناصر',
  },
  'orders.total': {
    en: 'Total',
    fr: 'Total',
    ar: 'الإجمالي',
  },
  'orders.elapsed': {
    en: 'Elapsed',
    fr: 'Ecoule',
    ar: 'الوقت المنقضي',
  },
  'orders.noOrders': {
    en: 'No orders found.',
    fr: 'Aucune commande trouvee.',
    ar: 'لا توجد طلبات.',
  },
  'orders.justNow': {
    en: 'Just now',
    fr: 'A l instant',
    ar: 'الآن',
  },
  'orders.mins': {
    en: 'mins',
    fr: 'min',
    ar: 'دقيقة',
  },
  'orders.takeaway': {
    en: 'Takeaway / Walk-in',
    fr: 'A emporter / Sur place',
    ar: 'خارجي / مباشر',
  },
  'orders.dineIn': {
    en: 'Dine In',
    fr: 'Sur place',
    ar: 'داخل المطعم',
  },
  'orders.kitchenLoad': {
    en: 'Kitchen Load',
    fr: 'Charge cuisine',
    ar: 'ضغط المطبخ',
  },
  'orders.hourlyVolume': {
    en: 'Hourly Volume',
    fr: 'Volume horaire',
    ar: 'الحجم حسب الساعة',
  },
  'menu.title': {
    en: 'Menu Management',
    fr: 'Gestion du menu',
    ar: 'إدارة القائمة',
  },
  'menu.subtitle': {
    en: 'Real menu catalog from the database with live availability control.',
    fr: 'Catalogue reel avec controle de disponibilite en direct.',
    ar: 'قائمة حقيقية من قاعدة البيانات مع التحكم المباشر في التوفر.',
  },
  'menu.refresh': {
    en: 'Refresh',
    fr: 'Actualiser',
    ar: 'تحديث',
  },
  'menu.addItem': {
    en: 'Add Menu Item',
    fr: 'Ajouter un article',
    ar: 'إضافة عنصر',
  },
  'menu.itemName': {
    en: 'Item name',
    fr: 'Nom article',
    ar: 'اسم العنصر',
  },
  'menu.selectMenu': {
    en: 'Select menu',
    fr: 'Choisir menu',
    ar: 'اختر قائمة',
  },
  'menu.price': {
    en: 'Price',
    fr: 'Prix',
    ar: 'السعر',
  },
  'menu.description': {
    en: 'Description',
    fr: 'Description',
    ar: 'الوصف',
  },
  'menu.allItems': {
    en: 'All Items',
    fr: 'Tous les articles',
    ar: 'كل العناصر',
  },
  'menu.loading': {
    en: 'Loading live menu data...',
    fr: 'Chargement des donnees du menu...',
    ar: 'تحميل بيانات القائمة...',
  },
  'menu.unavailable': {
    en: 'Unavailable',
    fr: 'Indisponible',
    ar: 'غير متوفر',
  },
  'menu.noDescription': {
    en: 'No description provided.',
    fr: 'Aucune description.',
    ar: 'لا يوجد وصف.',
  },
  'menu.markUnavailable': {
    en: 'Mark Unavailable',
    fr: 'Rendre indisponible',
    ar: 'تعطيل التوفر',
  },
  'menu.markAvailable': {
    en: 'Mark Available',
    fr: 'Rendre disponible',
    ar: 'تفعيل التوفر',
  },
  'menu.archive': {
    en: 'Archive',
    fr: 'Archiver',
    ar: 'أرشفة',
  },
  'menu.noItemsFound': {
    en: 'No items found',
    fr: 'Aucun article trouve',
    ar: 'لم يتم العثور على عناصر',
  },
  'inventory.title': {
    en: 'Inventory',
    fr: 'Inventaire',
    ar: 'المخزون',
  },
  'inventory.subtitle': {
    en: 'Live stock registry backed by database records.',
    fr: 'Registre de stock en direct depuis la base.',
    ar: 'سجل مخزون مباشر من قاعدة البيانات.',
  },
  'inventory.totalItems': {
    en: 'Total Items',
    fr: 'Total articles',
    ar: 'إجمالي العناصر',
  },
  'inventory.alerts': {
    en: 'Alerts',
    fr: 'Alertes',
    ar: 'التنبيهات',
  },
  'inventory.valuation': {
    en: 'Valuation',
    fr: 'Valorisation',
    ar: 'القيمة',
  },
  'inventory.addItem': {
    en: 'Add Inventory Item',
    fr: 'Ajouter stock',
    ar: 'إضافة عنصر مخزون',
  },
  'inventory.add': {
    en: 'Add Item',
    fr: 'Ajouter',
    ar: 'إضافة عنصر',
  },
  'inventory.restock': {
    en: 'Restock',
    fr: 'Reapprovisionner',
    ar: 'إعادة تزويد',
  },
  'inventory.loading': {
    en: 'Loading inventory...',
    fr: 'Chargement du stock...',
    ar: 'تحميل المخزون...',
  },
  'customers.title': {
    en: 'Customers CRM',
    fr: 'Clients CRM',
    ar: 'إدارة العملاء',
  },
  'customers.subtitle': {
    en: 'Real customer profiles stored in the database.',
    fr: 'Profils clients reels en base de donnees.',
    ar: 'ملفات العملاء الحقيقية محفوظة في قاعدة البيانات.',
  },
  'customers.total': {
    en: 'Total Customers',
    fr: 'Total clients',
    ar: 'إجمالي العملاء',
  },
  'customers.vip': {
    en: 'VIP',
    fr: 'VIP',
    ar: 'كبار العملاء',
  },
  'customers.lifetimeSpend': {
    en: 'Lifetime Spend',
    fr: 'Depense totale',
    ar: 'إجمالي الإنفاق',
  },
  'customers.add': {
    en: 'Add Customer',
    fr: 'Ajouter client',
    ar: 'إضافة عميل',
  },
  'customers.createProfile': {
    en: 'Create Profile',
    fr: 'Creer profil',
    ar: 'إنشاء ملف',
  },
  'customers.loading': {
    en: 'Loading customers...',
    fr: 'Chargement des clients...',
    ar: 'تحميل العملاء...',
  },
  'staff.title': {
    en: 'Staff Directory',
    fr: 'Annuaire du personnel',
    ar: 'دليل الموظفين',
  },
  'staff.subtitle': {
    en: 'Real employee accounts loaded from the users table.',
    fr: 'Comptes employes reels charges depuis la table users.',
    ar: 'حسابات الموظفين الحقيقية محملة من جدول المستخدمين.',
  },
  'staff.total': {
    en: 'Total Staff',
    fr: 'Total personnel',
    ar: 'إجمالي الموظفين',
  },
  'staff.admins': {
    en: 'Admins',
    fr: 'Admins',
    ar: 'المديرون',
  },
  'staff.managers': {
    en: 'Managers',
    fr: 'Managers',
    ar: 'المديرون المناوبون',
  },
  'staff.waiters': {
    en: 'Waiters',
    fr: 'Serveurs',
    ar: 'الندلاء',
  },
  'staff.operations': {
    en: 'Chefs + Cashiers',
    fr: 'Chefs + Caissiers',
    ar: 'الطهاة + الكاشير',
  },
  'staff.add': {
    en: 'Add Staff Member',
    fr: 'Ajouter employe',
    ar: 'إضافة موظف',
  },
  'staff.createAccount': {
    en: 'Create Staff Account',
    fr: 'Creer compte',
    ar: 'إنشاء حساب موظف',
  },
  'staff.accounts': {
    en: 'Staff Accounts',
    fr: 'Comptes du personnel',
    ar: 'حسابات الموظفين',
  },
  'staff.loading': {
    en: 'Loading staff...',
    fr: 'Chargement du personnel...',
    ar: 'تحميل الموظفين...',
  },
  'printers.title': {
    en: 'Printers Console',
    fr: 'Console imprimantes',
    ar: 'وحدة الطابعات',
  },
  'printers.subtitle': {
    en: 'Real network printer configuration and print history.',
    fr: 'Configuration reseau reelle et historique impression.',
    ar: 'إعدادات الطابعات الشبكية الحقيقية وسجل الطباعة.',
  },
  'printers.add': {
    en: 'Add Printer',
    fr: 'Ajouter imprimante',
    ar: 'إضافة طابعة',
  },
  'printers.register': {
    en: 'Register Printer',
    fr: 'Enregistrer imprimante',
    ar: 'تسجيل طابعة',
  },
  'printers.registered': {
    en: 'Registered Printers',
    fr: 'Imprimantes enregistrees',
    ar: 'الطابعات المسجلة',
  },
  'printers.history': {
    en: 'Print History',
    fr: 'Historique impression',
    ar: 'سجل الطباعة',
  },
  'printers.loading': {
    en: 'Loading printers...',
    fr: 'Chargement des imprimantes...',
    ar: 'تحميل الطابعات...',
  },
  'printers.test': {
    en: 'Test',
    fr: 'Tester',
    ar: 'اختبار',
  },
  'printers.status': {
    en: 'Status',
    fr: 'Statut',
    ar: 'الحالة',
  },
  'reports.title': {
    en: 'Reports & Exports',
    fr: 'Rapports et exports',
    ar: 'التقارير والتصدير',
  },
  'reports.subtitle': {
    en: 'Real report jobs generated from orders and printing activity.',
    fr: 'Jobs de rapports reels generes depuis commandes et impressions.',
    ar: 'مهام تقارير حقيقية مولدة من الطلبات والطباعة.',
  },
  'reports.total': {
    en: 'Total Jobs',
    fr: 'Total jobs',
    ar: 'إجمالي المهام',
  },
  'reports.completed': {
    en: 'Completed',
    fr: 'Termines',
    ar: 'المكتملة',
  },
  'reports.financial': {
    en: 'Financial Reports',
    fr: 'Rapports financiers',
    ar: 'التقارير المالية',
  },
  'reports.create': {
    en: 'Create Report Job',
    fr: 'Creer job rapport',
    ar: 'إنشاء مهمة تقرير',
  },
  'reports.generate': {
    en: 'Generate Report',
    fr: 'Generer rapport',
    ar: 'إنشاء التقرير',
  },
  'reports.archived': {
    en: 'Archived Reports',
    fr: 'Rapports archives',
    ar: 'التقارير المؤرشفة',
  },
  'reports.loading': {
    en: 'Loading reports...',
    fr: 'Chargement des rapports...',
    ar: 'تحميل التقارير...',
  },
  'logs.title': {
    en: 'Audit Logs',
    fr: 'Journaux audit',
    ar: 'سجلات التدقيق',
  },
  'logs.subtitle': {
    en: 'Real security and operations logs from the database.',
    fr: 'Journaux reels de securite et operations depuis la base.',
    ar: 'سجلات الأمان والعمليات الحقيقية من قاعدة البيانات.',
  },
  'logs.loading': {
    en: 'Loading logs...',
    fr: 'Chargement des journaux...',
    ar: 'تحميل السجلات...',
  },
  'kitchen.title': {
    en: 'Khalou-Fodil Kitchen Display',
    fr: 'Affichage cuisine Khalou-Fodil',
    ar: 'شاشة مطبخ Khalou-Fodil',
  },
  'kitchen.subtitle': {
    en: 'Real-time order dispatching, preparation stages, and station times.',
    fr: 'Suivi en temps reel des tickets et etapes de preparation.',
    ar: 'متابعة الطلبات ومراحل التحضير وأوقات المحطات بشكل مباشر.',
  },
  'kitchen.avgSpeed': {
    en: 'Avg. Speed',
    fr: 'Vitesse moyenne',
    ar: 'متوسط السرعة',
  },
  'kitchen.dispatched': {
    en: 'Dispatched',
    fr: 'تم التسليم',
    ar: 'تم التسليم',
  },
  'kitchen.simulateOrder': {
    en: 'Simulate Order',
    fr: 'Simuler commande',
    ar: 'محاكاة طلب',
  },
  'kitchen.stationProductivity': {
    en: 'Station Productivity',
    fr: 'Productivite des stations',
    ar: 'إنتاجية المحطات',
  },
  'kitchen.search': {
    en: 'Search active tickets by Table, Order # or Item name...',
    fr: 'Rechercher par table, numero ou article...',
    ar: 'ابحث حسب الطاولة أو رقم الطلب أو اسم العنصر...',
  },
  'kitchen.clear': {
    en: 'Clear',
    fr: 'Effacer',
    ar: 'مسح',
  },
  'kitchen.pendingOrders': {
    en: 'Pending Orders',
    fr: 'Commandes en attente',
    ar: 'الطلبات المعلقة',
  },
  'kitchen.preparing': {
    en: 'Preparing/Cooking',
    fr: 'Preparation/Cuisson',
    ar: 'قيد التحضير/الطبخ',
  },
  'kitchen.ready': {
    en: 'Ready for Pickup',
    fr: 'Pret a recuperer',
    ar: 'جاهز للاستلام',
  },
  'kitchen.note': {
    en: 'Note',
    fr: 'Note',
    ar: 'ملاحظة',
  },
  'kitchen.startCooking': {
    en: 'Start Cooking',
    fr: 'Commencer cuisson',
    ar: 'بدء التحضير',
  },
  'kitchen.markReady': {
    en: 'Mark Ready',
    fr: 'Marquer pret',
    ar: 'وضعه جاهز',
  },
  'kitchen.completeTicket': {
    en: 'Complete Ticket',
    fr: 'Terminer ticket',
    ar: 'إنهاء التذكرة',
  },
  'kitchen.noPending': {
    en: 'No pending orders',
    fr: 'Aucune commande en attente',
    ar: 'لا توجد طلبات معلقة',
  },
  'kitchen.noPreparing': {
    en: 'No active tickets cooking',
    fr: 'Aucun ticket en cuisson',
    ar: 'لا توجد تذاكر قيد التحضير',
  },
  'kitchen.noReady': {
    en: 'No orders waiting pickup',
    fr: 'Aucune commande en attente de retrait',
    ar: 'لا توجد طلبات بانتظار الاستلام',
  },
  'monitoring.title': {
    en: 'System Performance & Services Heartbeat',
    fr: 'Performance systeme et heartbeat des services',
    ar: 'أداء النظام ونبض الخدمات',
  },
  'monitoring.subtitle': {
    en: 'Real-time telemetry of APIs, PostgreSQL Database, Redis Caching, WebSockets, and connected thermal printer networks.',
    fr: 'Telemetrie en temps reel des API, PostgreSQL, Redis, WebSockets et imprimantes.',
    ar: 'قياسات مباشرة للواجهات البرمجية وقاعدة البيانات وRedis وWebSockets والطابعات.',
  },
  'monitoring.diagnosing': {
    en: 'Diagnosing...',
    fr: 'Diagnostic...',
    ar: 'جاري الفحص...',
  },
  'monitoring.triggerDiagnostic': {
    en: 'Trigger System Diagnostic',
    fr: 'Lancer diagnostic systeme',
    ar: 'تشغيل فحص النظام',
  },
  'monitoring.heartbeatConsole': {
    en: 'Operational Heartbeat Console',
    fr: 'Console heartbeat operationnelle',
    ar: 'وحدة نبض التشغيل',
  },
  'monitoring.clearTerminal': {
    en: 'Clear Terminal',
    fr: 'Vider terminal',
    ar: 'مسح الطرفية',
  },
  'monitoring.emptyTerminal': {
    en: 'Terminal log is currently empty. Simulating incoming system telemetry...',
    fr: 'Le terminal est vide. Simulation de telemetrie en cours...',
    ar: 'سجل الطرفية فارغ حاليًا. تتم محاكاة التليمترية...',
  },
  'monitoring.criticalAlerts': {
    en: 'Critical Operational Traces & Alerts',
    fr: 'Alertes et traces critiques',
    ar: 'التنبيهات والمسارات الحرجة',
  },
  'monitoring.redisMemory': {
    en: 'Redis Memory',
    fr: 'Memoire Redis',
    ar: 'ذاكرة Redis',
  },
  'monitoring.active': {
    en: 'Active',
    fr: 'Actif',
    ar: 'نشط',
  },
  'monitoring.connected': {
    en: 'Connected',
    fr: 'Connecte',
    ar: 'متصل',
  },
  'monitoring.latency': {
    en: 'Latency',
    fr: 'Latence',
    ar: 'الاستجابة',
  },
  'monitoring.ramUsage': {
    en: 'RAM Usage',
    fr: 'Utilisation RAM',
    ar: 'استخدام الذاكرة',
  },
  'monitoring.connections': {
    en: 'Connections',
    fr: 'Connexions',
    ar: 'الاتصالات',
  },
  'monitoring.capacity': {
    en: 'Capacity',
    fr: 'Capacite',
    ar: 'السعة',
  },
  'monitoring.hitRate': {
    en: 'Hit Rate',
    fr: 'Taux de hit',
    ar: 'معدل الإصابات',
  },
  'monitoring.cacheSize': {
    en: 'Cache Size',
    fr: 'Taille du cache',
    ar: 'حجم التخزين المؤقت',
  },
  'monitoring.clientsOnline': {
    en: 'Clients Online',
    fr: 'Clients en ligne',
    ar: 'العملاء المتصلون',
  },
  'monitoring.syncLatency': {
    en: 'Sync Latency',
    fr: 'Latence de synchro',
    ar: 'زمن المزامنة',
  },
  'monitoring.lastDiagnostics': {
    en: 'Last Diagnostics',
    fr: 'Dernier diagnostic',
    ar: 'آخر تشخيص',
  },
  'monitoring.hardwareAlert': {
    en: 'Hardware Alert',
    fr: 'Alerte materielle',
    ar: 'تنبيه عتاد',
  },
  'monitoring.paperOut': {
    en: 'Paper out',
    fr: 'Papier vide',
    ar: 'نفاد الورق',
  },
  'monitoring.pendingQueued': {
    en: 'All pending receipt prints are queued in buffer memory.',
    fr: 'Toutes les impressions en attente sont en memoire tampon.',
    ar: 'كل الطباعة المعلقة محفوظة في الذاكرة المؤقتة.',
  },
  'monitoring.detectedMinsAgo': {
    en: 'Detected 45 mins ago',
    fr: 'Detecte il y a 45 min',
    ar: 'تم اكتشافه قبل 45 دقيقة',
  },
  'monitoring.sslHealth': {
    en: 'SSL Certificate Health',
    fr: 'Sante du certificat SSL',
    ar: 'سلامة شهادة SSL',
  },
  'monitoring.sslRenewal': {
    en: 'Auto-renew verification completed successfully. Next renewal on August 30, 2026.',
    fr: 'Le renouvellement automatique a reussi. Prochain renouvellement le 30 aout 2026.',
    ar: 'اكتمل التحقق من التجديد التلقائي بنجاح. التجديد القادم في 30 أغسطس 2026.',
  },
  'monitoring.detectedHoursAgo': {
    en: 'Detected 3 hours ago',
    fr: 'Detecte il y a 3 heures',
    ar: 'تم اكتشافه قبل 3 ساعات',
  },
  'role.admin': {
    en: 'Administrator',
    fr: 'Administrateur',
    ar: 'المدير',
  },
  'role.manager': {
    en: 'Manager',
    fr: 'Manager',
    ar: 'المدير المسؤول',
  },
  'role.chef': {
    en: 'Chef',
    fr: 'Chef de Cuisine',
    ar: 'الطاهي',
  },
  'role.cashier': {
    en: 'Cashier',
    fr: 'Caissier',
    ar: 'الكاشير',
  },
  'role.waiter': {
    en: 'Waiter',
    fr: 'Serveur',
    ar: 'النادل',
  },
  'status.available': {
    en: 'Available',
    fr: 'Disponible',
    ar: 'متاح',
  },
  'status.occupied': {
    en: 'Occupied',
    fr: 'Occupé',
    ar: 'مشغول',
  },
  'status.reserved': {
    en: 'Reserved',
    fr: 'Réservé',
    ar: 'محجوز',
  },
  'status.pending': {
    en: 'Pending',
    fr: 'En attente',
    ar: 'معلق',
  },
  'status.preparing': {
    en: 'Preparing',
    fr: 'En préparation',
    ar: 'قيد التحضير',
  },
  'status.ready': {
    en: 'Ready',
    fr: 'Prêt',
    ar: 'جاهز',
  },
  'status.delivered': {
    en: 'Delivered',
    fr: 'Livré',
    ar: 'تم التوصيل',
  },
  'status.paid': {
    en: 'Paid',
    fr: 'Payé',
    ar: 'مدفوع',
  },
  'status.cancelled': {
    en: 'Cancelled',
    fr: 'Annulé',
    ar: 'ملغى',
  },
  'status.completed': {
    en: 'Completed',
    fr: 'Terminé',
    ar: 'مكتمل',
  },
  'status.failed': {
    en: 'Failed',
    fr: 'Échoué',
    ar: 'فشل',
  },
  'status.online': {
    en: 'Online',
    fr: 'En ligne',
    ar: 'متصل',
  },
  'status.offline': {
    en: 'Offline',
    fr: 'Hors ligne',
    ar: 'غير متصل',
  },
  'status.low_paper': {
    en: 'Low Paper',
    fr: 'Papier faible',
    ar: 'ورق قليل',
  },
  'status.healthy': {
    en: 'Healthy',
    fr: 'Sain',
    ar: 'سليم',
  },
  'status.low_stock': {
    en: 'Low Stock',
    fr: 'Stock faible',
    ar: 'مخزون منخفض',
  },
  'status.critical': {
    en: 'Critical',
    fr: 'Critique',
    ar: 'حرج',
  },
  'status.success': {
    en: 'Success',
    fr: 'Succès',
    ar: 'ناجح',
  },
  'status.warning': {
    en: 'Warning',
    fr: 'Avertissement',
    ar: 'تحذير',
  },
  'printerType.receipt': {
    en: 'Receipt Printer',
    fr: 'Imprimante de reçus',
    ar: 'طابعة الفواتير',
  },
  'printerType.kitchen': {
    en: 'Kitchen Ticket Printer',
    fr: 'Imprimante cuisine',
    ar: 'طابعة المطبخ',
  },
  'printerType.bar': {
    en: 'Bar Printer',
    fr: 'Imprimante bar',
    ar: 'طابعة البار',
  },
  'reportType.financial': {
    en: 'Financial',
    fr: 'Financier',
    ar: 'مالي',
  },
  'reportType.operations': {
    en: 'Operations',
    fr: 'Opérations',
    ar: 'عمليات',
  },
  'reportType.printing': {
    en: 'Printing',
    fr: 'Impression',
    ar: 'طباعة',
  },
  'analytics.averageRevenue': {
    en: 'Average Revenue',
    fr: 'Revenu Moyen',
    ar: 'متوسط الإيرادات',
  },
  'analytics.cancelledOrders': {
    en: 'Cancelled Orders',
    fr: 'Commandes Annulées',
    ar: 'الطلبات الملغاة',
  },
  'analytics.completionRate': {
    en: 'Completion Rate',
    fr: 'Taux de Complétion',
    ar: 'معدل الإنجاز',
  },
  'analytics.orderStatusSummary': {
    en: 'Order Status Summary',
    fr: 'Résumé des Statuts de Commande',
    ar: 'ملخص حالات الطلبات',
  },
  'analytics.ordersCount': {
    en: 'orders',
    fr: 'commandes',
    ar: 'طلب',
  },
  'analytics.peakHourlyHeatmap': {
    en: 'Peak Hourly Heatmap',
    fr: 'Carte Thermique des Heures de Pointe',
    ar: 'المخطط الحراري لساعات الذروة',
  },
  'analytics.rankedPaidOrders': {
    en: 'Ranked Paid Orders',
    fr: 'Classement des Commandes Payées',
    ar: 'تصنيف الطلبات المدفوعة',
  },
  'analytics.revenuePerformance': {
    en: 'Revenue Performance',
    fr: 'Performance des Revenus',
    ar: 'أداء الإيرادات',
  },
  'analytics.revenueTotal': {
    en: 'Total Revenue',
    fr: 'Revenu Total',
    ar: 'إجمالي الإيرادات',
  },
  'analytics.topDishesCount': {
    en: 'Top Selling Dishes',
    fr: 'Plats les plus vendus',
    ar: 'الأطباق الأكثر مبيعًا',
  },
  'common.cancel': {
    en: 'Cancel',
    fr: 'Annuler',
    ar: 'إلغاء',
  },
  'common.delete': {
    en: 'Delete',
    fr: 'Supprimer',
    ar: 'حذف',
  },
  'common.create': {
    en: 'Create',
    fr: 'Créer',
    ar: 'إنشاء',
  },
  'common.update': {
    en: 'Update',
    fr: 'Mettre à jour',
    ar: 'تحديث',
  },
  'common.confirmDelete': {
    en: 'Confirm Delete',
    fr: 'Confirmer la suppression',
    ar: 'تأكيد الحذف',
  },
  'common.deleting': {
    en: 'Deleting...',
    fr: 'Suppression...',
    ar: 'جارٍ الحذف...',
  },
  'common.noRestaurant': {
    en: 'No restaurant selected',
    fr: 'Aucun restaurant sélectionné',
    ar: 'لم يتم تحديد مطعم',
  },
  'common.refresh': {
    en: 'Refresh',
    fr: 'Actualiser',
    ar: 'تحديث',
  },
  'common.created': {
    en: 'Created',
    fr: 'Créé',
    ar: 'تم الإنشاء',
  },
  'common.creating': {
    en: 'Creating...',
    fr: 'Création...',
    ar: 'جاري الإنشاء...',
  },
  'common.email': {
    en: 'Email',
    fr: 'E-mail',
    ar: 'البريد الإلكتروني',
  },
  'common.generating': {
    en: 'Generating...',
    fr: 'Génération...',
    ar: 'جاري التوليد...',
  },
  'common.loading': {
    en: 'Loading...',
    fr: 'Chargement...',
    ar: 'جاري التحميل...',
  },
  'common.name': {
    en: 'Name',
    fr: 'Nom',
    ar: 'الاسم',
  },
  'common.password': {
    en: 'Password',
    fr: 'Mot de passe',
    ar: 'كلمة المرور',
  },
  'common.rangeEnd': {
    en: 'End Date',
    fr: 'Date de fin',
    ar: 'تاريخ النهاية',
  },
  'common.rangeStart': {
    en: 'Start Date',
    fr: 'Date de début',
    ar: 'تاريخ البداية',
  },
  'common.restaurant': {
    en: 'Restaurant',
    fr: 'Restaurant',
    ar: 'المطعم',
  },
  'common.saving': {
    en: 'Saving...',
    fr: 'Enregistrement...',
    ar: 'جاري الحفظ...',
  },
  'common.required': {
    en: 'Required',
    fr: 'Requis',
    ar: 'مطلوب',
  },
  'common.invalidEmail': {
    en: 'Invalid email format',
    fr: 'Format d\'email invalide',
    ar: 'صيغة البريد الإلكتروني غير صحيحة',
  },
  'common.invalidPhone': {
    en: 'Invalid phone format',
    fr: 'Format de téléphone invalide',
    ar: 'صيغة الهاتف غير صحيحة',
  },
  'common.all': {
    en: 'All',
    fr: 'Tous',
    ar: 'الكل',
  },
  'common.status': {
    en: 'Status',
    fr: 'Statut',
    ar: 'الحالة',
  },
  'common.actions': {
    en: 'Actions',
    fr: 'Actions',
    ar: 'الإجراءات',
  },
  'common.edit': {
    en: 'Edit',
    fr: 'Modifier',
    ar: 'تعديل',
  },
  'common.invalidNumber': {
    en: 'Must be a positive number',
    fr: 'Doit être un nombre positif',
    ar: 'يجب أن يكون رقماً موجباً',
  },
  'customerTier.new': {
    en: 'New',
    fr: 'Nouveau',
    ar: 'جديد',
  },
  'customerTier.regular': {
    en: 'Regular',
    fr: 'Régulier',
    ar: 'منتظم',
  },
  'customerTier.vip': {
    en: 'VIP',
    fr: 'VIP',
    ar: 'VIP',
  },
  'customers.createDescription': {
    en: 'Create a new customer profile in the database.',
    fr: 'Créer un nouveau profil client dans la base de données.',
    ar: 'إنشاء ملف تعريف عميل جديد في قاعدة البيانات.',
  },
  'customers.notes': {
    en: 'Notes',
    fr: 'Notes',
    ar: 'ملاحظات',
  },
  'customers.ordersCount': {
    en: 'orders',
    fr: 'commandes',
    ar: 'طلب',
  },
  'customers.phone': {
    en: 'Phone',
    fr: 'Téléphone',
    ar: 'الهاتف',
  },
  'dashboard.completedCount': {
    en: 'completed',
    fr: 'terminées',
    ar: 'مكتمل',
  },
  'dashboard.heatmapDescription': {
    en: 'Hourly order volume peak indicators.',
    fr: 'Indicateurs de pic de volume de commandes par heure.',
    ar: 'مؤشرات ذروة حجم الطلبات في الساعة.',
  },
  'dashboard.identifiedCustomers': {
    en: 'identified customers',
    fr: 'clients identifiés',
    ar: 'عملاء تم تحديدهم',
  },
  'dashboard.latestOrderFlow': {
    en: 'Latest order activity stream.',
    fr: "Flux d'activité des dernières commandes.",
    ar: 'مجرى أحدث أنشطة الطلبات.',
  },
  'dashboard.needsReview': {
    en: 'needs manual review',
    fr: 'nécessite un examen manuel',
    ar: 'يحتاج مراجعة يدوية',
  },
  'dashboard.revenueLabel': {
    en: 'revenue',
    fr: 'revenu',
    ar: 'الإيرادات',
  },
  'dashboard.revenueMtd': {
    en: 'Revenue (MTD)',
    fr: 'Revenu (MTD)',
    ar: 'إيرادات الشهر الحالي',
  },
  'dashboard.soldCount': {
    en: 'sold',
    fr: 'vendus',
    ar: 'مباع',
  },
  'dashboard.sparklineDescription': {
    en: 'Visual revenue metrics comparison.',
    fr: 'Comparaison visuelle des métriques de revenus.',
    ar: 'مقارنة مرئية لمقاييس الإيرادات.',
  },
  'dashboard.statusSnapshot': {
    en: 'Status snapshot.',
    fr: "Aperçu de l'état.",
    ar: 'لقطة حالة.',
  },
  'dashboard.topDishesDescription': {
    en: 'Best performing items on the menu.',
    fr: 'Articles les plus performants du menu.',
    ar: 'الأطباق الأكثر مبيعاً في القائمة.',
  },
  'dashboard.weekRevenue': {
    en: 'Week:',
    fr: 'Semaine:',
    ar: 'الأسبوع:',
  },
  'inventory.createDescription': {
    en: 'Add a new inventory item to track stock.',
    fr: "Ajouter un nouvel article d'inventaire pour suivre le stock.",
    ar: 'إضافة عنصر مخزون جديد لتتبع الكميات.',
  },
  'inventory.minAlert': {
    en: 'Min. Alert Level',
    fr: "Niveau d'alerte min.",
    ar: 'الحد الأدنى للتنبيه',
  },
  'inventory.minimum': {
    en: 'Minimum',
    fr: 'Minimum',
    ar: 'الحد الأدنى',
  },
  'inventory.name': {
    en: 'Ingredient Name',
    fr: "Nom de l'ingrédient",
    ar: 'اسم المكون',
  },
  'inventory.stock': {
    en: 'Current Stock',
    fr: 'Stock actuel',
    ar: 'المخزون الحالي',
  },
  'inventory.supplier': {
    en: 'Supplier',
    fr: 'Fournisseur',
    ar: 'المورد',
  },
  'inventory.unit': {
    en: 'Unit',
    fr: 'Unité',
    ar: 'الوحدة',
  },
  'inventory.unitPrice': {
    en: 'Unit Price',
    fr: 'Prix unitaire',
    ar: 'سعر الوحدة',
  },
  'inventory.noSupplier': {
    en: 'No supplier',
    fr: 'Aucun fournisseur',
    ar: 'بدون مورد',
  },
  'inventory.unit.KG': {
    en: 'Kilogram',
    fr: 'Kilogramme',
    ar: 'كيلوغرام',
  },
  'inventory.unit.GRAM': {
    en: 'Gram',
    fr: 'Gramme',
    ar: 'غرام',
  },
  'inventory.unit.LITER': {
    en: 'Liter',
    fr: 'Litre',
    ar: 'لتر',
  },
  'inventory.unit.ML': {
    en: 'Milliliter',
    fr: 'Millilitre',
    ar: 'ميليلتر',
  },
  'inventory.unit.PIECE': {
    en: 'Piece',
    fr: 'Piece',
    ar: 'قطعة',
  },
  'inventory.unit.PACK': {
    en: 'Pack',
    fr: 'Paquet',
    ar: 'طرد',
  },
  'inventory.editItem': {
    en: 'Edit Inventory Item',
    fr: "Modifier l'article de stock",
    ar: 'تعديل عنصر المخزون',
  },
  'inventory.editDescription': {
    en: 'Update stock item details.',
    fr: "Mettre à jour les détails de l'article de stock.",
    ar: 'تحديث تفاصيل عنصر المخزون.',
  },
  'inventory.deleteConfirm': {
    en: 'Are you sure you want to delete this inventory item?',
    fr: 'Êtes-vous sûr de vouloir supprimer cet article de stock ?',
    ar: 'هل أنت متأكد من حذف عنصر المخزون هذا؟',
  },
  'inventory.search': {
    en: 'Search inventory...',
    fr: 'Rechercher dans le stock...',
    ar: 'بحث في المخزون...',
  },
  'inventory.noItems': {
    en: 'No inventory items found.',
    fr: 'Aucun article de stock trouvé.',
    ar: 'لم يتم العثور على عناصر مخزون.',
  },
  'inventory.delete': {
    en: 'Delete',
    fr: 'Supprimer',
    ar: 'حذف',
  },
  'inventory.save': {
    en: 'Save',
    fr: 'Enregistrer',
    ar: 'حفظ',
  },
  'inventory.lowStock': {
    en: 'Low Stock',
    fr: 'Stock Faible',
    ar: 'مخزون منخفض',
  },
  'inventory.inStock': {
    en: 'In Stock',
    fr: 'En Stock',
    ar: 'متوفر',
  },
  'inventory.critical': {
    en: 'Critical',
    fr: 'Critique',
    ar: 'حرج',
  },
  'inventory.supplyLogs': {
    en: 'Supply Logs',
    fr: 'Journal d\'approvisionnement',
    ar: 'سجل التوريد',
  },
  'inventory.supplyLogsSubtitle': {
    en: 'View all incoming stock shipments and purchase history.',
    fr: 'Consultez tous les arrivages de stock et l\'historique des achats.',
    ar: 'عرض جميع شحنات المخزون الواردة وتاريخ المشتريات.',
  },
  'inventory.itemName': {
    en: 'Item',
    fr: 'Article',
    ar: 'المادة',
  },
  'inventory.quantityAdded': {
    en: 'Quantity Added',
    fr: 'Quantité ajoutée',
    ar: 'الكمية المضافة',
  },
  'inventory.receivedAt': {
    en: 'Received At',
    fr: 'Reçu le',
    ar: 'تاريخ الاستلام',
  },
  'inventory.healthy': {
    en: 'Healthy',
    fr: 'Sain',
    ar: 'حالة ممتازة',
  },
  'inventory.monitoring': {
    en: 'Monitoring',
    fr: 'Surveillance',
    ar: 'مراقبة',
  },
  'inventory.requiresAction': {
    en: 'Requires Action',
    fr: 'Nécessite une action',
    ar: 'يتطلب إجراء',
  },
  'inventory.currentFifo': {
    en: 'Current FIFO',
    fr: 'FIFO actuel',
    ar: 'الوارد أولاً',
  },
  'inventory.inTransit': {
    en: 'In Transit',
    fr: 'En transit',
    ar: 'قيد النقل',
  },
  'inventory.pendingOrders': {
    en: 'Pending Orders',
    fr: 'Commandes en attente',
    ar: 'الطلبات المعلقة',
  },
  'inventory.addNewIngredient': {
    en: 'Add New Ingredient',
    fr: 'Ajouter un ingrédient',
    ar: 'إضافة مكون جديد',
  },
  'inventory.enterDetails': {
    en: 'Enter details for the new inventory item.',
    fr: "Entrez les détails du nouvel article d'inventaire.",
    ar: 'أدخل تفاصيل عنصر المخزون الجديد.',
  },
  'inventory.namePlaceholder': {
    en: 'e.g. Maldon Sea Salt',
    fr: 'ex. Sel de Mer Maldon',
    ar: 'مثال: ملح البحر',
  },
  'inventory.basicInformation': {
    en: 'Basic Information',
    fr: 'Informations de base',
    ar: 'المعلومات الأساسية',
  },
  'inventory.stockInformation': {
    en: 'Stock Information',
    fr: 'Informations sur le stock',
    ar: 'معلومات المخزون',
  },
  'inventory.supplierInformation': {
    en: 'Supplier Information',
    fr: 'Informations sur le fournisseur',
    ar: 'معلومات المورد',
  },
  'inventory.minStockInfo': {
    en: 'Min Stock Level',
    fr: 'Niveau de stock minimum',
    ar: 'الحد الأدنى للمخزون',
  },
  'inventory.minStockDescription': {
    en: 'Setting a proper Min Stock Level ensures automated reordering alerts appear on the dashboard when supplies run low during service hours.',
    fr: "La définition d'un niveau de stock minimum garantit que les alertes de réapprovisionnement automatiques apparaissent sur le tableau de bord lorsque les fournitures s'épuisent pendant les heures de service.",
    ar: 'يضمن تعيين الحد الأدنى المناسب للمخزون ظهور تنبيهات إعادة الطلب التلقائية على لوحة التحكم عندما تنخفض الإمدادات أثناء ساعات الخدمة.',
  },
  'inventory.saveIngredient': {
    en: 'SAVE INGREDIENT',
    fr: "ENREGISTRER L'INGRÉDIENT",
    ar: 'حفظ المكون',
  },
  'inventory.updateIngredient': {
    en: 'Update Ingredient',
    fr: "Mettre à jour l'ingrédient",
    ar: 'تحديث المكون',
  },
  'inventory.lastUpdated': {
    en: 'Last Updated',
    fr: 'Dernière mise à jour',
    ar: 'آخر تحديث',
  },
  'suppliers.title': {
    en: 'Suppliers',
    fr: 'Fournisseurs',
    ar: 'الموردون',
  },
  'suppliers.subtitle': {
    en: 'Manage your supplier directory and contact information.',
    fr: 'Gerez le repertoire des fournisseurs et les coordonnees.',
    ar: 'إدارة دليل الموردين ومعلومات الاتصال.',
  },
  'suppliers.totalSuppliers': {
    en: 'Total Suppliers',
    fr: 'Total fournisseurs',
    ar: 'إجمالي الموردين',
  },
  'suppliers.active': {
    en: 'Active',
    fr: 'Actif',
    ar: 'نشط',
  },
  'suppliers.inactive': {
    en: 'Inactive',
    fr: 'Inactif',
    ar: 'غير نشط',
  },
  'suppliers.addSupplier': {
    en: 'Add Supplier',
    fr: 'Ajouter fournisseur',
    ar: 'إضافة مورد',
  },
  'suppliers.createDescription': {
    en: 'Add a new supplier to your directory.',
    fr: 'Ajoutez un nouveau fournisseur au repertoire.',
    ar: 'إضافة مورد جديد إلى الدليل.',
  },
  'suppliers.name': {
    en: 'Supplier Name',
    fr: 'Nom du fournisseur',
    ar: 'اسم المورد',
  },
  'suppliers.contactName': {
    en: 'Contact Name',
    fr: 'Nom du contact',
    ar: 'اسم جهة الاتصال',
  },
  'suppliers.phone': {
    en: 'Phone',
    fr: 'Telephone',
    ar: 'الهاتف',
  },
  'suppliers.email': {
    en: 'Email',
    fr: 'E-mail',
    ar: 'البريد الإلكتروني',
  },
  'suppliers.address': {
    en: 'Address',
    fr: 'Adresse',
    ar: 'العنوان',
  },
  'suppliers.supplyingCategories': {
    en: 'Supplying Categories',
    fr: 'Categories',
    ar: 'الفئات',
  },
  'suppliers.add': {
    en: 'Add Supplier',
    fr: 'Ajouter',
    ar: 'إضافة مورد',
  },
  'suppliers.deactivate': {
    en: 'Deactivate',
    fr: 'Desactiver',
    ar: 'تعطيل',
  },
  'suppliers.activate': {
    en: 'Activate',
    fr: 'Activer',
    ar: 'تفعيل',
  },
  'suppliers.loading': {
    en: 'Loading suppliers...',
    fr: 'Chargement des fournisseurs...',
    ar: 'تحميل الموردين...',
  },
  'suppliers.editSupplier': {
    en: 'Edit Supplier',
    fr: 'Modifier le fournisseur',
    ar: 'تعديل المورد',
  },
  'suppliers.editDescription': {
    en: 'Update supplier details.',
    fr: 'Mettre à jour les coordonnées du fournisseur.',
    ar: 'تحديث بيانات المورد.',
  },
  'suppliers.deleteConfirm': {
    en: 'Are you sure you want to delete this supplier?',
    fr: 'Êtes-vous sûr de vouloir supprimer ce fournisseur ?',
    ar: 'هل أنت متأكد من حذف هذا المورد؟',
  },
  'suppliers.search': {
    en: 'Search by name or phone...',
    fr: 'Rechercher par nom ou téléphone...',
    ar: 'بحث بالاسم أو الهاتف...',
  },
  'suppliers.noSuppliers': {
    en: 'No suppliers found.',
    fr: 'Aucun fournisseur trouvé.',
    ar: 'لم يتم العثور على موردين.',
  },
  'suppliers.save': {
    en: 'Save',
    fr: 'Enregistrer',
    ar: 'حفظ',
  },
  'suppliers.categories': {
    en: 'Categories',
    fr: 'Catégories',
    ar: 'الفئات',
  },
  'suppliers.addCategory': {
    en: 'Add Category',
    fr: 'Ajouter une catégorie',
    ar: 'إضافة فئة',
  },
  'suppliers.categoryName': {
    en: 'Category Name',
    fr: 'Nom de la catégorie',
    ar: 'اسم الفئة',
  },
  'suppliers.categoryDeleteConfirm': {
    en: 'Are you sure you want to delete this category?',
    fr: 'Êtes-vous sûr de vouloir supprimer cette catégorie ?',
    ar: 'هل أنت متأكد من حذف هذه الفئة؟',
  },
  'suppliers.noCategory': {
    en: 'No category',
    fr: 'Aucune catégorie',
    ar: 'بدون فئة',
  },
  'suppliers.manageCategories': {
    en: 'Manage Categories',
    fr: 'Gérer les catégories',
    ar: 'إدارة الفئات',
  },
  'suppliers.companyName': {
    en: 'Company Name',
    fr: "Nom de l'entreprise",
    ar: 'اسم الشركة',
  },
  'suppliers.contactDetails': {
    en: 'Contact Details',
    fr: 'Coordonnées',
    ar: 'معلومات الاتصال',
  },
  'suppliers.logisticsStatus': {
    en: 'Logistics Status',
    fr: 'Statut logistique',
    ar: 'حالة الخدمات اللوجستية',
  },
  'suppliers.addNewSupplier': {
    en: 'Add New Supplier',
    fr: 'Ajouter un fournisseur',
    ar: 'إضافة مورد جديد',
  },
  'suppliers.registerVendor': {
    en: 'Register a new vendor in the system.',
    fr: 'Enregistrez un nouveau fournisseur dans le système.',
    ar: 'تسجيل مورد جديد في النظام.',
  },
  'suppliers.companyInformation': {
    en: 'Company Information',
    fr: "Informations sur l'entreprise",
    ar: 'معلومات الشركة',
  },
  'suppliers.primaryContact': {
    en: 'Primary Contact',
    fr: 'Contact principal',
    ar: 'جهة الاتصال الرئيسية',
  },
  'suppliers.operationalDetails': {
    en: 'Operational Details',
    fr: 'Détails opérationnels',
    ar: 'التفاصيل التشغيلية',
  },
  'suppliers.databaseCategories': {
    en: 'Database Categories',
    fr: 'Catégories de la base',
    ar: 'فئات قاعدة البيانات',
  },
  'suppliers.supplierStatus': {
    en: 'Supplier Status',
    fr: 'Statut du fournisseur',
    ar: 'حالة المورد',
  },
  'suppliers.statusDescription': {
    en: 'Set this supplier as active immediately.',
    fr: 'Activez ce fournisseur immédiatement.',
    ar: 'تعيين هذا المورد كنشط فوراً.',
  },
  'suppliers.createSupplier': {
    en: 'Create Supplier',
    fr: 'Créer un fournisseur',
    ar: 'إنشاء مورد',
  },
  'suppliers.all': {
    en: 'All',
    fr: 'Tous',
    ar: 'الكل',
  },
  'suppliers.networkStatus': {
    en: 'Network Operating at High Efficiency',
    fr: 'Réseau fonctionnant à haute efficacité',
    ar: 'الشبكة تعمل بكفاءة عالية',
  },
  'suppliers.logisticsDescription': {
    en: 'All primary supply chains report 0 delays in last 24h cycle.',
    fr: "Toutes les chaînes d'approvisionnement principales signalent 0 retard au cours des dernières 24h.",
    ar: 'جميع سلاسل التوريد الرئيسية تبلغ عن 0 تأخير في آخر 24 ساعة.',
  },
  'suppliers.id': {
    en: 'ID',
    fr: 'ID',
    ar: 'المعرف',
  },
  'menu.createDescription': {
    en: 'Create a new menu item in the database catalog.',
    fr: 'Créer un nouvel article de menu dans le catalogue.',
    ar: 'إنشاء عنصر قائمة جديد في دليل قاعدة البيانات.',
  },
  'menu.createItem': {
    en: 'Create Menu Item',
    fr: "Créer l'article",
    ar: 'إنشاء عنصر قائمة',
  },
  'menu.emptyDescription': {
    en: 'No description.',
    fr: 'Aucune description.',
    ar: 'لا يوجد وصف.',
  },
  'menu.invalidPrice': {
    en: 'Please provide a valid price.',
    fr: 'Veuillez fournir un prix valide.',
    ar: 'يرجى تقديم سعر صالح.',
  },
  'menu.requiredFields': {
    en: 'Please fill in all required fields.',
    fr: 'Veuillez remplir tous les champs obligatoires.',
    ar: 'يرجى ملء جميع الحقول المطلوبة.',
  },
  'menu.uncategorized': {
    en: 'Uncategorized',
    fr: 'Non catégorisé',
    ar: 'غير مصنف',
  },
  'monitoring.nestGateway': {
    en: 'NestJS Gateway',
    fr: 'Passerelle NestJS',
    ar: 'بوابة NestJS',
  },
  'monitoring.prismaPostgres': {
    en: 'Prisma PostgreSQL',
    fr: 'Prisma PostgreSQL',
    ar: 'قاعدة بيانات Prisma PostgreSQL',
  },
  'orders.activePreparation': {
    en: 'active preparation',
    fr: 'préparation active',
    ar: 'تحضير نشط',
  },
  'orders.awaitingRunner': {
    en: 'awaiting runner pickup',
    fr: 'en attente du serveur',
    ar: 'بانتظار الاستلام للتوصيل',
  },
  'orders.currentServiceFlow': {
    en: 'Current service flow tracking.',
    fr: 'Suivi actuel du flux de service.',
    ar: 'تتبع تدفق الخدمة الحالي.',
  },
  'orders.groupedByHour': {
    en: 'Grouped by hour of day.',
    fr: 'Groupé par heure de la journée.',
    ar: 'مجمعة حسب ساعة اليوم.',
  },
  'orders.liveAverage': {
    en: 'live average ticket',
    fr: 'ticket moyen en direct',
    ar: 'متوسط قيمة الفواتير الحية',
  },
  'orders.loadingQueue': {
    en: 'Loading live order queue...',
    fr: 'Chargement de la file des commandes...',
    ar: 'جاري تحميل قائمة الطلبات الحية...',
  },
  'orders.needsKitchenAttention': {
    en: 'needs kitchen attention',
    fr: "requiert l'attention de la cuisine",
    ar: 'يحتاج انتباه المطبخ',
  },
  'orders.realPressure': {
    en: 'real-time queue pressure',
    fr: 'pression de la file en temps réel',
    ar: 'ضغط طابور الطلبات بالوقت الفعلي',
  },
  'printers.createDescription': {
    en: 'Configure a new hardware thermal network printer.',
    fr: 'Configure une nouvelle imprimante thermique réseau.',
    ar: 'إعداد طابعة حرارية شبكية جديدة.',
  },
  'printers.ipAddress': {
    en: 'IP Address',
    fr: 'Adresse IP',
    ar: 'عنوان IP',
  },
  'printers.latestJobs': {
    en: 'Latest Print Jobs',
    fr: 'Dernières impressions',
    ar: 'أحدث مهام الطباعة',
  },
  'printers.liveRecords': {
    en: 'Live records from printers database.',
    fr: 'Enregistrements en direct de la base des imprimantes.',
    ar: 'سجلات مباشرة من قاعدة بيانات الطابعات.',
  },
  'printers.name': {
    en: 'Printer Name',
    fr: "Nom de l'imprimante",
    ar: 'اسم الطابعة',
  },
  'printers.port': {
    en: 'Port',
    fr: 'Port',
    ar: 'المنفذ',
  },
  'reports.archivedDescription': {
    en: 'Download or view historical CSV/JSON report jobs.',
    fr: 'Télécharger ou consulter les anciens rapports CSV/JSON.',
    ar: 'تنزيل أو عرض مهام التقارير المؤرشفة بصيغة CSV/JSON.',
  },
  'reports.defaultReportSuffix': {
    en: 'Report',
    fr: 'Rapport',
    ar: 'تقرير',
  },
  'reports.invalidDateRange': {
    en: 'Please provide a valid date range.',
    fr: 'Veuillez fournir une plage de dates valide.',
    ar: 'يرجى تقديم نطاق تاريخ صالح.',
  },
  'reports.reportName': {
    en: 'Report Name',
    fr: 'Nom du rapport',
    ar: 'اسم التقرير',
  },
  'reports.rows': {
    en: 'rows',
    fr: 'lignes',
    ar: 'سطر',
  },
  'reports.weeklyRevenueTotal': {
    en: 'Weekly Revenue Total',
    fr: 'Total des revenus hebdomadaires',
    ar: 'إجمالي الإيرادات الأسبوعية',
  },
  'staff.createDescription': {
    en: 'Create a new staff user account with role-based access.',
    fr: 'Créer un nouveau compte employé avec accès contrôlé.',
    ar: 'إنشاء حساب مستخدم موظف جديد بصلاحيات محددة.',
  },
  'staff.fullName': {
    en: 'Full Name',
    fr: 'Nom complet',
    ar: 'الاسم الكامل',
  },
  'staff.liveRecords': {
    en: 'Live records from employee database.',
    fr: 'Enregistrements en direct de la base des employés.',
    ar: 'سجلات مباشرة من قاعدة بيانات الموظفين.',
  },
  'staff.requiredFields': {
    en: 'Full name, staff code, and role are required. Password is required when creating a new account.',
    fr: "Le nom complet, le code employé et le rôle sont obligatoires. Le mot de passe est obligatoire à la création.",
    ar: 'الاسم الكامل والرقم الخاص والدور مطلوبة، وكلمة المرور مطلوبة عند إنشاء حساب جديد.',
  },
  'staff.editAccount': {
    en: 'Edit Staff Member',
    fr: 'Modifier employe',
    ar: 'تعديل الموظف',
  },
  'staff.editDescription': {
    en: 'Update employee details, access data, payroll, and active status.',
    fr: "Mettre a jour les informations, l'acces, la paie et le statut actif.",
    ar: 'تحديث بيانات الموظف وصلاحيات الدخول والراتب وحالة التفعيل.',
  },
  'staff.personalInfo': {
    en: 'Personal Information',
    fr: 'Informations personnelles',
    ar: 'المعلومات الشخصية',
  },
  'staff.personalInfoDescription': {
    en: 'Identity and contact details used in daily operations.',
    fr: "Identite et coordonnees utilisees au quotidien.",
    ar: 'بيانات الهوية والتواصل المستعملة في العمل اليومي.',
  },
  'staff.securityAccess': {
    en: 'Security & Access',
    fr: 'Securite et acces',
    ar: 'الأمان والدخول',
  },
  'staff.securityAccessDescription': {
    en: 'Login credentials, role permissions, and staff access code.',
    fr: "Identifiants, permissions et code d'accès employé.",
    ar: 'بيانات تسجيل الدخول والصلاحيات والرقم الخاص للموظف.',
  },
  'staff.payroll': {
    en: 'Payroll',
    fr: 'Paie',
    ar: 'الراتب',
  },
  'staff.payrollDescription': {
    en: 'Monthly or daily compensation used by management.',
    fr: 'Remuneration mensuelle ou journaliere utilisee par la direction.',
    ar: 'الأجر الشهري أو اليومي المعتمد في الإدارة.',
  },
  'staff.additionalInfo': {
    en: 'Additional Information',
    fr: 'Informations supplementaires',
    ar: 'معلومات إضافية',
  },
  'staff.additionalInfoDescription': {
    en: 'Emergency contacts and internal notes for follow-up.',
    fr: "Contacts d'urgence et notes internes de suivi.",
    ar: 'جهات الاتصال الطارئة والملاحظات الداخلية للمتابعة.',
  },
  'staff.phone': {
    en: 'Phone Number',
    fr: 'Numero de telephone',
    ar: 'رقم الهاتف',
  },
  'staff.nationalId': {
    en: 'National ID',
    fr: 'Numero national',
    ar: 'رقم التعريف الوطني',
  },
  'staff.birthDate': {
    en: 'Birth Date',
    fr: 'Date de naissance',
    ar: 'تاريخ الميلاد',
  },
  'staff.hireDate': {
    en: 'Hire Date',
    fr: "Date d'embauche",
    ar: 'تاريخ التوظيف',
  },
  'staff.address': {
    en: 'Address',
    fr: 'Adresse',
    ar: 'العنوان',
  },
  'staff.staffCode': {
    en: 'Staff Code',
    fr: 'Code employe',
    ar: 'الرقم الخاص',
  },
  'staff.pinCode': {
    en: 'PIN Code',
    fr: 'Code PIN',
    ar: 'الرقم السري',
  },
  'staff.salaryType': {
    en: 'Salary Type',
    fr: 'Type de salaire',
    ar: 'نوع الراتب',
  },
  'staff.salaryMonthly': {
    en: 'Monthly',
    fr: 'Mensuel',
    ar: 'شهري',
  },
  'staff.salaryDaily': {
    en: 'Daily',
    fr: 'Journalier',
    ar: 'يومي',
  },
  'staff.salaryAmount': {
    en: 'Salary Amount',
    fr: 'Montant du salaire',
    ar: 'قيمة الراتب',
  },
  'staff.emergencyContactName': {
    en: 'Emergency Contact Name',
    fr: "Nom du contact d'urgence",
    ar: 'اسم جهة الاتصال الطارئة',
  },
  'staff.emergencyContactPhone': {
    en: 'Emergency Contact Phone',
    fr: "Telephone du contact d'urgence",
    ar: 'هاتف جهة الاتصال الطارئة',
  },
  'staff.notes': {
    en: 'Notes',
    fr: 'Notes',
    ar: 'ملاحظات',
  },
  'staff.accountStatus': {
    en: 'Account Status',
    fr: 'Statut du compte',
    ar: 'حالة الحساب',
  },
  'staff.active': {
    en: 'Active',
    fr: 'Actif',
    ar: 'نشط',
  },
  'staff.inactive': {
    en: 'Inactive',
    fr: 'Inactif',
    ar: 'غير نشط',
  },
  'staff.activeMembers': {
    en: 'Active Members',
    fr: 'Employes actifs',
    ar: 'الموظفون النشطون',
  },
  'staff.noStaff': {
    en: 'No staff members have been created yet.',
    fr: "Aucun employe n'a encore ete cree.",
    ar: 'لا يوجد موظفون مضافون بعد.',
  },
  'staff.selectStaffPrompt': {
    en: 'Select a staff member to review and update the full profile.',
    fr: 'Selectionnez un employe pour consulter et modifier son profil complet.',
    ar: 'اختر موظفًا لمراجعة ملفه الكامل وتعديله.',
  },
  'staff.saveChanges': {
    en: 'Save Changes',
    fr: 'Enregistrer les modifications',
    ar: 'حفظ التعديلات',
  },
  'staff.lastUpdated': {
    en: 'Last Updated',
    fr: 'Derniere mise a jour',
    ar: 'آخر تحديث',
  },
  'staff.newPassword': {
    en: 'New Password',
    fr: 'Nouveau mot de passe',
    ar: 'كلمة مرور جديدة',
  },
  'staff.noStaffCode': {
    en: 'No staff code',
    fr: 'Aucun code employe',
    ar: 'لا يوجد رقم خاص',
  },
  'staff.noSalaryDefined': {
    en: 'Salary not defined',
    fr: 'Salaire non defini',
    ar: 'الراتب غير محدد',
  },
  'tables.capacity': {
    en: 'Capacity',
    fr: 'Capacité',
    ar: 'السعة',
  },
  'tables.createDescription': {
    en: 'Add a new table to the restaurant floor plan.',
    fr: 'Ajouter une nouvelle table au plan de salle.',
    ar: 'إضافة طاولة جديدة إلى مخطط الصالة.',
  },
  'tables.createTitle': {
    en: 'Add Seating Table',
    fr: 'Ajouter une table',
    ar: 'إضافة طاولة جلوس',
  },
  'tables.currentAdminContext': {
    en: 'current admin context',
    fr: 'contexte admin actuel',
    ar: 'سياق المسؤول الحالي',
  },
  'tables.downloadPng': {
    en: 'Download PNG',
    fr: 'Télécharger PNG',
    ar: 'تنزيل PNG',
  },
  'tables.editDescription': {
    en: 'Modify capacity and current status of this table.',
    fr: "Modifier la capacité et l'état actuel de cette table.",
    ar: 'تعديل سعة وحالة هذه الطاولة.',
  },
  'tables.editTitle': {
    en: 'Edit Table',
    fr: 'Modifier la table',
    ar: 'تعديل الطاولة',
  },
  'tables.floorLoadingDescription': {
    en: 'Loading floor map and tables visual registry...',
    fr: 'Chargement du plan de salle et du registre visuel...',
    ar: 'جاري تحميل مخطط الصالة والسجل المرئي للطاولات...',
  },
  'tables.mainBarArea': {
    en: 'Main Dining Room / Bar Area',
    fr: 'Salle principale / Zone Bar',
    ar: 'قاعة الطعام الرئيسية / منطقة البار',
  },
  'tables.number': {
    en: 'Table Number',
    fr: 'Numéro de table',
    ar: 'رقم الطاولة',
  },
  'tables.printA4': {
    en: 'Print A4 Sheet',
    fr: 'Imprimer feuille A4',
    ar: 'طباعة ورقة A4',
  },
  'tables.qrPreview': {
    en: 'QR code preview',
    fr: 'Aperçu du QR code',
    ar: 'معاينة رمز QR',
  },
  'tables.scanToOrder': {
    en: 'SCAN TO ORDER',
    fr: 'SCANNER POUR COMMANDER',
    ar: 'امسح للطلب',
  },
  'tables.seats': {
    en: 'seats',
    fr: 'places',
    ar: 'مقاعد',
  },
  'tables.table': {
    en: 'Table',
    fr: 'Table',
    ar: 'طاولة',
  },
  'sidebar.expand': {
    en: 'Expand Sidebar',
    fr: 'Agrandir la barre latérale',
    ar: 'توسيع الشريط الجانبي',
  },
  'sidebar.collapse': {
    en: 'Collapse Sidebar',
    fr: 'Réduire la barre latérale',
    ar: 'تقليص الشريط الجانبي',
  },
  'profile.name': {
    en: 'Alex Rivera',
    fr: 'Alex Rivera',
    ar: 'أليكس ريفيرا',
  },
  'profile.role': {
    en: 'Chief Operating Officer',
    fr: 'Directeur des opérations',
    ar: 'مدير العمليات التنفيذي',
  },
  'notifications.readAll': {
    en: 'Read All',
    fr: 'Tout lire',
    ar: 'قراءة الكل',
  },
  'notifications.clear': {
    en: 'Clear',
    fr: 'Effacer',
    ar: 'مسح',
  },
  'settings.ltr': {
    en: 'Left to Right (LTR)',
    fr: 'Gauche à droite (LTR)',
    ar: 'من اليسار إلى اليمين (LTR)',
  },
  'settings.rtl': {
    en: 'Right to Left (RTL)',
    fr: 'Droite à gauche (RTL)',
    ar: 'من اليمين إلى اليسار (RTL)',
  },
  'settings.error.load': {
    en: 'Failed to load settings.',
    fr: 'Échec du chargement des paramètres.',
    ar: 'فشل في تحميل الإعدادات.',
  },
  'settings.error.save': {
    en: 'Failed to save settings.',
    fr: 'Échec de l\'enregistrement des paramètres.',
    ar: 'فشل في حفظ الإعدادات.',
  },
  'kitchen.completionByNode': {
    en: 'Completion by Node',
    fr: 'Complétion par section',
    ar: 'الإنجاز حسب القسم',
  },
  'kitchen.totalDishesClosed': {
    en: 'Total Dishes Closed',
    fr: 'Total des plats fermés',
    ar: 'إجمالي الأطباق المكتملة',
  },
  'kitchen.mains': {
    en: 'Mains',
    fr: 'Plats principaux',
    ar: 'الرئيسية',
  },
  'kitchen.desserts': {
    en: 'Desserts',
    fr: 'Desserts',
    ar: 'الحلويات',
  },
  'kitchen.drinks': {
    en: 'Drinks',
    fr: 'Boissons',
    ar: 'المشروبات',
  },
  'kitchen.mainLineCapacity': {
    en: 'Main Line Capacity',
    fr: 'Capacité ligne principale',
    ar: 'قدرة الخط الرئيسي',
  },
  'kitchen.bakeDessertLine': {
    en: 'Bake/Dessert Line',
    fr: 'Ligne Cuisson/Dessert',
    ar: 'خط المخبوزات/الحلويات',
  },
  'kitchen.warning.cookingTime': {
    en: 'KDS WARNING: Ticket #{id} for {table} has been cooking for over 15 minutes! Please dispatch immediately.',
    fr: 'AVERTISSEMENT KDS : Le ticket #{id} pour {table} est en cuisson depuis plus de 15 minutes ! Veuillez l\'envoyer immédiatement.',
    ar: 'تحذير المطبخ: الطلب #{id} للطاولة {table} قيد التحضير منذ أكثر من 15 دقيقة! يرجى إرساله فوراً.',
  },
  'kitchen.notification.dispatched': {
    en: 'Order #{id} ({table}) successfully dispatched and marked completed.',
    fr: 'La commande #{id} ({table}) a été expédiée et marquée comme terminée.',
    ar: 'تم إرسال الطلب #{id} ({table}) بنجاح وتحديده كمكتمل.',
  },
  'kitchen.notification.totalTime': {
    en: 'Total time: {time}',
    fr: 'Temps total: {time}',
    ar: 'الوقت الإجمالي: {time}',
  },
  'kitchen.status.cooking': {
    en: 'began cooking',
    fr: 'a commencé à cuire',
    ar: 'بدأ الطبخ',
  },
  'kitchen.status.ready': {
    en: 'is ready for pickup',
    fr: 'est prêt à être retiré',
    ar: 'جاهز للاستلام',
  },
  'kitchen.notification.dispatch': {
    en: 'Khalou-Fodil Kitchen Dispatch: Order #{id} for {table} {statusText}.',
    fr: 'Envoi cuisine Khalou-Fodil : La commande #{id} pour {table} {statusText}.',
    ar: 'إرسال مطبخ Khalou-Fodil: الطلب #{id} للطاولة {table} {statusText}.',
  },
  'kitchen.notification.newTicket': {
    en: 'New Khalou-Fodil Kitchen Ticket: Order #{id} received for {table}.',
    fr: 'Nouveau ticket cuisine Khalou-Fodil : Commande #{id} reçue pour {table}.',
    ar: 'تذكرة مطبخ Khalou-Fodil جديدة: تم استلام الطلب #{id} للطاولة {table}.',
  },
  'common.role': {
    en: 'Role',
    fr: 'Rôle',
    ar: 'الدور',
  },
  'status.in_stock': {
    en: 'In Stock',
    fr: 'En stock',
    ar: 'متوفر',
  },
  'status.out_of_stock': {
    en: 'Out of Stock',
    fr: 'Rupture de stock',
    ar: 'نفذ من المخزون',
  },
  'monitoring.activeConnections': {
    en: 'active',
    fr: 'actives',
    ar: 'نشطة',
  },
  'monitoring.usage': {
    en: 'usage',
    fr: 'utilisation',
    ar: 'استخدام',
  },
  'monitoring.channels': {
    en: 'channels',
    fr: 'canaux',
    ar: 'قنوات',
  },
  'monitoring.printerReported': {
    en: 'Network Printer "Kitchen Ticket Printer 01" reported ',
    fr: 'L\'imprimante réseau "Kitchen Ticket Printer 01" a signalé ',
    ar: 'أبلغت طابعة الشبكة "طابعة تذاكر المطبخ 01" عن ',
  },
};

Object.assign(dictionary, {
  'logs.visibleRecords': {
    en: 'Visible audit records',
    fr: 'Enregistrements d audit visibles',
    ar: 'سجلات التدقيق الظاهرة',
  },
  'logs.waiterCashierActions': {
    en: 'Waiter and cashier actions',
    fr: 'Actions du serveur et du caissier',
    ar: 'عمليات النادل والكاشير',
  },
  'logs.recordsForReview': {
    en: 'Records marked for review',
    fr: 'Enregistrements a verifier',
    ar: 'سجلات تحتاج مراجعة',
  },
  'logs.filtersTitle': {
    en: 'Audit filters',
    fr: 'Filtres d audit',
    ar: 'فلاتر التدقيق',
  },
  'logs.filtersSubtitle': {
    en: 'Filter by waiter, cashier, date, employee name, action, and module.',
    fr: 'Filtrer par serveur, caissier, date, employe, action et module.',
    ar: 'فلترة حسب النادل والكاشير والتاريخ واسم الموظف والإجراء والوحدة.',
  },
  'logs.allRoles': {
    en: 'All roles',
    fr: 'Tous les roles',
    ar: 'كل الأدوار',
  },
  'logs.waiterNotifications': {
    en: 'Waiter notifications',
    fr: 'Notifications serveur',
    ar: '??????? ??????',
  },
  'logs.allModules': {
    en: 'All modules',
    fr: 'Tous les modules',
    ar: 'كل الوحدات',
  },
  'logs.allStatuses': {
    en: 'All statuses',
    fr: 'Tous les statuts',
    ar: 'كل الحالات',
  },
  'logs.employeeName': {
    en: 'Employee name',
    fr: 'Nom de l employe',
    ar: 'اسم الموظف',
  },
  'logs.actionContains': {
    en: 'Action contains',
    fr: 'Action contient',
    ar: 'الإجراء يحتوي على',
  },
  'logs.applyFilters': {
    en: 'Apply filters',
    fr: 'Appliquer les filtres',
    ar: 'تطبيق الفلاتر',
  },
  'logs.review': {
    en: 'Review',
    fr: 'Verification',
    ar: 'مراجعة',
  },
  'logs.order': {
    en: 'Order',
    fr: 'Commande',
    ar: 'الطلب',
  },
  'logs.table': {
    en: 'Table',
    fr: 'Table',
    ar: 'الطاولة',
  },
  'logs.takeaway': {
    en: 'Takeaway',
    fr: 'A emporter',
    ar: 'سفري',
  },
  'logs.type': {
    en: 'Type',
    fr: 'Type',
    ar: 'النوع',
  },
  'logs.statusBlock': {
    en: 'Status',
    fr: 'Statut',
    ar: 'الحالة',
  },
  'logs.itemsSummary': {
    en: 'Items',
    fr: 'Articles',
    ar: 'العناصر',
  },
  'logs.payment': {
    en: 'Payment',
    fr: 'Paiement',
    ar: 'الدفع',
  },
  'logs.financial': {
    en: 'Financial',
    fr: 'Financier',
    ar: 'المالي',
  },
  'logs.before': {
    en: 'Before',
    fr: 'Avant',
    ar: 'قبل',
  },
  'logs.after': {
    en: 'After',
    fr: 'Apres',
    ar: 'بعد',
  },
  'logs.delta': {
    en: 'Delta',
    fr: 'Variation',
    ar: 'الفرق',
  },
  'logs.notes': {
    en: 'Notes',
    fr: 'Notes',
    ar: 'ملاحظات',
  },
  'logs.itemFallback': {
    en: 'Item',
    fr: 'Article',
    ar: 'عنصر',
  },

  // Date presets
  'logs.today': {
    en: 'Today',
    fr: "Aujourd'hui",
    ar: 'اليوم',
  },
  'logs.yesterday': {
    en: 'Yesterday',
    fr: 'Hier',
    ar: 'الأمس',
  },
  'logs.thisWeek': {
    en: 'This Week',
    fr: 'Cette semaine',
    ar: 'هذا الأسبوع',
  },
  'logs.thisMonth': {
    en: 'This Month',
    fr: 'Ce mois',
    ar: 'هذا الشهر',
  },
  'logs.customRange': {
    en: 'Custom range',
    fr: 'Plage personnalisée',
    ar: 'نطاق مخصص',
  },
  'logs.fromDate': {
    en: 'From date',
    fr: 'Date de début',
    ar: 'من تاريخ',
  },
  'logs.toDate': {
    en: 'To date',
    fr: 'Date de fin',
    ar: 'إلى تاريخ',
  },
  'logs.filterByUser': {
    en: 'Filter by user',
    fr: 'Filtrer par utilisateur',
    ar: 'فلترة حسب المستخدم',
  },
  'logs.allUsers': {
    en: 'All users',
    fr: 'Tous les utilisateurs',
    ar: 'كل المستخدمين',
  },
  // Pagination
  'logs.previous': {
    en: 'Previous',
    fr: 'Précédent',
    ar: 'السابق',
  },
  'logs.next': {
    en: 'Next',
    fr: 'Suivant',
    ar: 'التالي',
  },
  'logs.pageInfo': {
    en: 'Page {current} of {total}',
    fr: 'Page {current} sur {total}',
    ar: 'الصفحة {current} من {total}',
  },
  'logs.noResults': {
    en: 'No audit records found for the selected filters.',
    fr: 'Aucun enregistrement d\'audit trouvé pour les filtres sélectionnés.',
    ar: 'لم يتم العثور على سجلات تدقيق للفلاتر المحددة.',
  },
  // Role-specific stats
  'logs.cashierStats': {
    en: 'Cashier Statistics',
    fr: 'Statistiques du caissier',
    ar: 'إحصائيات الكاشير',
  },
  'logs.waiterStats': {
    en: 'Waiter Statistics',
    fr: 'Statistiques du serveur',
    ar: 'إحصائيات النادل',
  },
  'logs.chefStats': {
    en: 'Chef Statistics',
    fr: 'Statistiques du chef',
    ar: 'إحصائيات الشيف',
  },
  'logs.takeawayOrders': {
    en: 'Takeaway orders',
    fr: 'Commandes à emporter',
    ar: 'طلبات سفري',
  },
  'logs.totalCashReceived': {
    en: 'Total cash received',
    fr: 'Total encaissé en espèces',
    ar: 'إجمالي المبالغ النقدية المستلمة',
  },
  'logs.totalCardReceived': {
    en: 'Total card received',
    fr: 'Total encaissé par carte',
    ar: 'إجمالي المبالغ البطاقية المستلمة',
  },
  'logs.ordersCreated': {
    en: 'Orders created',
    fr: 'Commandes créées',
    ar: 'الطلبات المنشأة',
  },
  'logs.ordersDelivered': {
    en: 'Orders delivered',
    fr: 'Commandes livrées',
    ar: 'الطلبات المسلمة',
  },
  'logs.dishesPrepared': {
    en: 'Dishes prepared',
    fr: 'Plats préparés',
    ar: 'الأطباق المعدة',
  },
  'logs.ordersPrepared': {
    en: 'Orders prepared',
    fr: 'Commandes préparées',
    ar: 'الطلبات المحضرة',
  },
  // PDF export
  'logs.exportPdf': {
    en: 'Export PDF',
    fr: 'Exporter PDF',
    ar: 'تصدير PDF',
  },
  'logs.exportingPdf': {
    en: 'Generating PDF...',
    fr: 'Génération du PDF...',
    ar: 'جاري إنشاء PDF...',
  },
  'logs.exportCsv': {
    en: 'Export CSV',
    fr: 'Exporter CSV',
    ar: 'تصدير CSV',
  },
  'logs.pdfTitle': {
    en: 'Audit Logs Report',
    fr: 'Rapport des journaux d\'audit',
    ar: 'تقرير سجلات التدقيق',
  },
  'logs.pdfSubtitle': {
    en: 'Comprehensive audit trail report',
    fr: 'Rapport complet de la piste d\'audit',
    ar: 'تقرير شامل لمسار التدقيق',
  },
  'logs.pdfReportLanguage': {
    en: 'Report language',
    fr: 'Langue du rapport',
    ar: 'لغة التقرير',
  },
  'logs.pdfReportType': {
    en: 'Report type',
    fr: 'Type de rapport',
    ar: 'نوع التقرير',
  },
  'logs.pdfSummaryReport': {
    en: 'Summary Report',
    fr: 'Rapport sommaire',
    ar: 'تقرير مختصر',
  },
  'logs.pdfSummaryDesc': {
    en: 'Statistics and role-specific summary only',
    fr: 'Statistiques et résumé par rôle uniquement',
    ar: 'الإحصائيات والملخص حسب الدور فقط',
  },
  'logs.pdfDetailedReport': {
    en: 'Detailed Report',
    fr: 'Rapport détaillé',
    ar: 'تقرير تفصيلي',
  },
  'logs.pdfDetailedDesc': {
    en: 'Full log table with all translated details',
    fr: 'Tableau complet des journaux avec tous les détails traduits',
    ar: 'جدول كامل للسجلات مع جميع التفاصيل المترجمة',
  },
  'logs.pdfGenerate': {
    en: 'Generate PDF',
    fr: 'Générer le PDF',
    ar: 'إنشاء PDF',
  },
  'logs.pdfCancel': {
    en: 'Cancel',
    fr: 'Annuler',
    ar: 'إلغاء',
  },
  'logs.pdfTotalRecords': {
    en: 'Total records',
    fr: 'Total des enregistrements',
    ar: 'إجمالي السجلات',
  },
  'logs.pdfWaiterCashierActions': {
    en: 'Waiter & cashier actions',
    fr: 'Actions serveur et caissier',
    ar: 'عمليات النادل والكاشير',
  },
  'logs.pdfRecordsForReview': {
    en: 'Records for review',
    fr: 'Enregistrements à vérifier',
    ar: 'سجلات للمراجعة',
  },
  'logs.pdfEmployeeTarget': {
    en: 'Employee',
    fr: 'Employé',
    ar: 'الموظف',
  },
  'logs.pdfPeriod': {
    en: 'Period',
    fr: 'Période',
    ar: 'الفترة',
  },
  'logs.pdfGeneratedAt': {
    en: 'Generated on',
    fr: 'Généré le',
    ar: 'تم التوليد في',
  },
  'logs.pdfAuthError': {
    en: 'Authentication session expired. Please sign in again.',
    fr: 'Session d\'authentification expirée. Veuillez vous reconnecter.',
    ar: 'انتهت جلسة المصادقة. الرجاء تسجيل الدخول مرة أخرى.',
  },
  'logs.pdfEmployeeFilter': {
    en: 'Filtered by employee',
    fr: 'Filtré par employé',
    ar: 'مصفى حسب الموظف',
  },
  'logs.pdfTotalCash': {
    en: 'Total cash',
    fr: 'Total espèces',
    ar: 'إجمالي النقدي',
  },
  'logs.pdfTotalCard': {
    en: 'Total card',
    fr: 'Total carte',
    ar: 'إجمالي البطاقي',
  },
  'logs.pdfLangAr': {
    en: 'العربية',
    fr: 'العربية',
    ar: 'العربية',
  },
  'logs.pdfLangFr': {
    en: 'Français',
    fr: 'Français',
    ar: 'Français',
  },
  'logs.pdfLangEn': {
    en: 'English',
    fr: 'English',
    ar: 'English',
  },
  'logs.csv.createdAt': {
    en: 'Created At',
    fr: 'Date de création',
    ar: 'تاريخ الإنشاء',
  },
  'logs.csv.userName': {
    en: 'User Name',
    fr: "Nom d'utilisateur",
    ar: 'اسم المستخدم',
  },
  'logs.csv.role': {
    en: 'Role',
    fr: 'Rôle',
    ar: 'الدور',
  },
  'logs.csv.action': {
    en: 'Action',
    fr: 'Action',
    ar: 'الإجراء',
  },
  'logs.csv.module': {
    en: 'Module',
    fr: 'Module',
    ar: 'الوحدة',
  },
  'logs.csv.status': {
    en: 'Status',
    fr: 'Statut',
    ar: 'الحالة',
  },
  'logs.csv.orderId': {
    en: 'Order ID',
    fr: 'ID commande',
    ar: 'رقم الطلب',
  },
  'logs.csv.dailyOrderNumber': {
    en: 'Daily Order #',
    fr: 'N° commande journalier',
    ar: 'رقم الطلب اليومي',
  },
  'logs.csv.tableNumber': {
    en: 'Table #',
    fr: 'N° table',
    ar: 'رقم الطاولة',
  },
  'logs.csv.orderType': {
    en: 'Order Type',
    fr: 'Type de commande',
    ar: 'نوع الطلب',
  },
  'logs.csv.previousStatus': {
    en: 'Previous Status',
    fr: 'Statut précédent',
    ar: 'الحالة السابقة',
  },
  'logs.csv.nextStatus': {
    en: 'Next Status',
    fr: 'Statut suivant',
    ar: 'الحالة التالية',
  },
  'logs.csv.previousTotal': {
    en: 'Previous Total',
    fr: 'Total précédent',
    ar: 'الإجمالي السابق',
  },
  'logs.csv.nextTotal': {
    en: 'Next Total',
    fr: 'Total suivant',
    ar: 'الإجمالي التالي',
  },
  'logs.csv.totalDelta': {
    en: 'Total Delta',
    fr: 'Écart total',
    ar: 'فرق الإجمالي',
  },
  'logs.csv.riskFlags': {
    en: 'Risk Flags',
    fr: 'Drapeaux de risque',
    ar: 'علامات المخاطر',
  },
  'logs.csv.paymentMethod': {
    en: 'Payment Method',
    fr: 'Moyen de paiement',
    ar: 'طريقة الدفع',
  },

  'employeeRisk.title': {
    en: 'Employee Risk Profile',
    fr: 'Profil de risque des employes',
    ar: 'ملف مخاطر الموظفين',
  },
  'employeeRisk.subtitle': {
    en: 'Per-employee operational risk based on edits, cancellations, refunds, and high-risk actions.',
    fr: 'Risque operationnel par employe base sur les modifications, annulations, remboursements et actions a risque.',
    ar: 'مخاطر تشغيلية لكل موظف بناء على التعديلات والإلغاءات والاسترجاعات والإجراءات عالية الخطورة.',
  },
  'employeeRisk.exportCsv': {
    en: 'Export CSV',
    fr: 'Exporter CSV',
    ar: 'تصدير CSV',
  },
  'employeeRisk.noStaffCode': {
    en: 'No Staff Code',
    fr: 'Sans code employe',
    ar: 'بدون رمز موظف',
  },
  'employeeRisk.riskScore': {
    en: 'Risk Score',
    fr: 'Score de risque',
    ar: 'درجة المخاطر',
  },
  'employeeRisk.edits': {
    en: 'Edits',
    fr: 'Modifications',
    ar: 'التعديلات',
  },
  'employeeRisk.cancellations': {
    en: 'Cancellations',
    fr: 'Annulations',
    ar: 'الإلغاءات',
  },
  'employeeRisk.refunds': {
    en: 'Refunds',
    fr: 'Remboursements',
    ar: 'الاسترجاعات',
  },
  'employeeRisk.discounts': {
    en: 'Discounts',
    fr: 'Remises',
    ar: 'الخصومات',
  },
  'employeeRisk.highRisk': {
    en: 'High-risk',
    fr: 'Haut risque',
    ar: 'عالي الخطورة',
  },
  'employeeRisk.affected': {
    en: 'Affected',
    fr: 'Montant affecte',
    ar: 'المبلغ المتأثر',
  },
  'payments.title': {
    en: 'Payments Management',
    fr: 'Gestion des paiements',
    ar: 'إدارة المدفوعات',
  },
  'payments.subtitle': {
    en: 'Track settlement, refunds, payment method changes, and financial history.',
    fr: 'Suivez les paiements, remboursements, changements de moyen de paiement et l historique financier.',
    ar: 'تابع التسويات والاسترجاعات وتغييرات وسيلة الدفع والسجل المالي.',
  },
  'payments.totalRevenue': {
    en: 'Total Revenue',
    fr: 'Revenu total',
    ar: 'إجمالي الإيرادات',
  },
  'payments.totalRefunds': {
    en: 'Total Refunds',
    fr: 'Total des remboursements',
    ar: 'إجمالي الاسترجاعات',
  },
  'payments.outstandingBalance': {
    en: 'Outstanding Balance',
    fr: 'Solde restant',
    ar: 'الرصيد المتبقي',
  },
  'payments.searchPlaceholder': {
    en: 'Search payment / order',
    fr: 'Rechercher paiement / commande',
    ar: 'ابحث عن دفعة أو طلب',
  },
  'payments.allMethods': {
    en: 'All methods',
    fr: 'Toutes les methodes',
    ar: 'كل الوسائل',
  },
  'payments.method.cash': {
    en: 'Cash',
    fr: 'Especes',
    ar: 'نقدا',
  },
  'payments.method.card': {
    en: 'Card',
    fr: 'Carte',
    ar: 'بطاقة',
  },
  'payments.method.bankTransfer': {
    en: 'Bank transfer',
    fr: 'Virement bancaire',
    ar: 'تحويل بنكي',
  },
  'payments.method.mobilePayment': {
    en: 'Mobile payment',
    fr: 'Paiement mobile',
    ar: 'دفع عبر الهاتف',
  },
  'payments.allStatuses': {
    en: 'All status',
    fr: 'Tous les statuts',
    ar: 'كل الحالات',
  },
  'payments.applyFilters': {
    en: 'Apply Filters',
    fr: 'Appliquer les filtres',
    ar: 'تطبيق الفلاتر',
  },
  'payments.loading': {
    en: 'Loading payments...',
    fr: 'Chargement des paiements...',
    ar: 'جاري تحميل المدفوعات...',
  },
  'payments.orderShort': {
    en: 'Order',
    fr: 'Commande',
    ar: 'طلب',
  },
  'payments.viewDetails': {
    en: 'View Details',
    fr: 'Voir les details',
    ar: 'عرض التفاصيل',
  },
  'payments.refund': {
    en: 'Refund',
    fr: 'Rembourser',
    ar: 'استرجاع',
  },
  'payments.changeMethod': {
    en: 'Change Method',
    fr: 'Changer la methode',
    ar: 'تغيير الوسيلة',
  },
  'payments.historyTitle': {
    en: 'Payment History',
    fr: 'Historique des paiements',
    ar: 'سجل المدفوعات',
  },
  'payments.reason': {
    en: 'Reason',
    fr: 'Raison',
    ar: 'السبب',
  },
  'payments.unknown': {
    en: 'Unknown',
    fr: 'Inconnu',
    ar: 'غير معروف',
  },
  'payments.refundReasonPrompt': {
    en: 'Refund reason',
    fr: 'Raison du remboursement',
    ar: 'سبب الاسترجاع',
  },
  'payments.newMethodPrompt': {
    en: 'New method: CASH, CARD, BANK_TRANSFER, MOBILE_PAYMENT',
    fr: 'Nouvelle methode : CASH, CARD, BANK_TRANSFER, MOBILE_PAYMENT',
    ar: 'الوسيلة الجديدة: CASH, CARD, BANK_TRANSFER, MOBILE_PAYMENT',
  },
  'payments.changeReasonPrompt': {
    en: 'Reason',
    fr: 'Raison',
    ar: 'السبب',
  },
  'discounts.title': {
    en: 'Discounts Management',
    fr: 'Gestion des remises',
    ar: 'إدارة الخصومات',
  },
  'discounts.subtitle': {
    en: 'Review approval flow, creator activity, and discount reasons across orders.',
    fr: 'Suivez les approbations, l activite du createur et les raisons des remises.',
    ar: 'راجع دورة الموافقة ونشاط منشئ الخصم وأسباب الخصومات عبر الطلبات.',
  },
  'discounts.searchPlaceholder': {
    en: 'Search order / reason',
    fr: 'Rechercher commande / raison',
    ar: 'ابحث عن طلب أو سبب',
  },
  'discounts.allApprovals': {
    en: 'All approvals',
    fr: 'Toutes les validations',
    ar: 'كل الموافقات',
  },
  'discounts.pendingApproval': {
    en: 'Pending approval',
    fr: 'En attente de validation',
    ar: 'بانتظار الموافقة',
  },
  'discounts.approved': {
    en: 'Approved',
    fr: 'Approuve',
    ar: 'تمت الموافقة',
  },
  'discounts.rejected': {
    en: 'Rejected',
    fr: 'Rejete',
    ar: 'مرفوض',
  },
  'discounts.allTypes': {
    en: 'All types',
    fr: 'Tous les types',
    ar: 'كل الأنواع',
  },
  'discounts.typePercentage': {
    en: 'Percentage',
    fr: 'Pourcentage',
    ar: 'نسبة مئوية',
  },
  'discounts.typeFixedAmount': {
    en: 'Fixed amount',
    fr: 'Montant fixe',
    ar: 'قيمة ثابتة',
  },
  'discounts.applyFilters': {
    en: 'Apply Filters',
    fr: 'Appliquer les filtres',
    ar: 'تطبيق الفلاتر',
  },
  'discounts.recordsTitle': {
    en: 'Discount Records',
    fr: 'Enregistrements des remises',
    ar: 'سجلات الخصومات',
  },
  'discounts.records': {
    en: 'records',
    fr: 'enregistrements',
    ar: 'سجلات',
  },
  'discounts.loading': {
    en: 'Loading discounts...',
    fr: 'Chargement des remises...',
    ar: 'جاري تحميل الخصومات...',
  },
  'discounts.orderShort': {
    en: 'Order',
    fr: 'Commande',
    ar: 'طلب',
  },
  'discounts.reason': {
    en: 'Reason',
    fr: 'Raison',
    ar: 'السبب',
  },
  'discounts.createdBy': {
    en: 'Created by',
    fr: 'Cree par',
    ar: 'أُنشئ بواسطة',
  },
  'discounts.approvedBy': {
    en: 'Approved by',
    fr: 'Approuve par',
    ar: 'تمت الموافقة بواسطة',
  },
  'discounts.pending': {
    en: 'Pending',
    fr: 'En attente',
    ar: 'بانتظار',
  },
  'discounts.unknown': {
    en: 'Unknown',
    fr: 'Inconnu',
    ar: 'غير معروف',
  },
  'discounts.approve': {
    en: 'Approve',
    fr: 'Approuver',
    ar: 'موافقة',
  },
  'discounts.reject': {
    en: 'Reject',
    fr: 'Rejeter',
    ar: 'رفض',
  },
  'discounts.viewAudit': {
    en: 'View Audit',
    fr: 'Voir l audit',
    ar: 'عرض التدقيق',
  },
  'discounts.approvalReasonPrompt': {
    en: 'Approval reason',
    fr: 'Raison de validation',
    ar: 'سبب الموافقة',
  },
  'discounts.rejectionReasonPrompt': {
    en: 'Rejection reason',
    fr: 'Raison du rejet',
    ar: 'سبب الرفض',
  },
  'payments.staffFilter': {
    en: 'Staff member',
    fr: 'Employe',
    ar: 'الموظف',
  },
  'payments.allStaff': {
    en: 'All staff',
    fr: 'Tous les employes',
    ar: 'كل الموظفين',
  },

  'employeeRisk.staffFilter': {
    en: 'Staff member',
    fr: 'Employe',
    ar: 'الموظف',
  },
  'employeeRisk.allStaff': {
    en: 'All staff',
    fr: 'Tous les employes',
    ar: 'كل الموظفين',
  },
  'employeeRisk.empty': {
    en: 'No employee risk records found.',
    fr: 'Aucun profil de risque trouve.',
    ar: 'لا توجد سجلات مخاطر للموظفين.',
  },
  'employeeRisk.totalEdits': {
    en: 'Total cashier edits',
    fr: 'Total des modifications caissier',
    ar: 'إجمالي تعديلات الكاشير',
  },
  'employeeRisk.highRiskCases': {
    en: 'High-risk cases',
    fr: 'Cas a haut risque',
    ar: 'الحالات عالية الخطورة',
  },
  'employeeRisk.totalFlags': {
    en: 'Risk flags',
    fr: 'Signaux de risque',
    ar: 'رايات المخاطر',
  },
  'employeeRisk.financialImpact': {
    en: 'Financial impact',
    fr: 'Impact financier',
    ar: 'الأثر المالي',
  },
  'employeeRisk.filterTitle': {
    en: 'Investigation filters',
    fr: 'Filtres d investigation',
    ar: 'فلاتر التحقيق',
  },
  'employeeRisk.filterSubtitle': {
    en: 'Filter cashier order edits by employee, time, severity, and exact risk signal.',
    fr: 'Filtrer les modifications caissier par employe, date, gravite et signal de risque.',
    ar: 'فلترة تعديلات الكاشير حسب الموظف والتاريخ ومستوى الخطورة وراية الخطر.',
  },
  'employeeRisk.resetFilters': {
    en: 'Reset filters',
    fr: 'Reinitialiser',
    ar: 'إعادة ضبط الفلاتر',
  },
  'employeeRisk.searchPlaceholder': {
    en: 'Search by cashier, order, item, reason...',
    fr: 'Rechercher caissier, commande, article, raison...',
    ar: 'ابحث باسم الكاشير أو الطلب أو الصنف أو السبب...',
  },
  'employeeRisk.allSeverities': {
    en: 'All severities',
    fr: 'Toutes les gravites',
    ar: 'كل مستويات الخطورة',
  },
  'employeeRisk.severityHigh': {
    en: 'High',
    fr: 'Elevee',
    ar: 'مرتفعة',
  },
  'employeeRisk.severityMedium': {
    en: 'Medium',
    fr: 'Moyenne',
    ar: 'متوسطة',
  },
  'employeeRisk.severityLow': {
    en: 'Low',
    fr: 'Faible',
    ar: 'منخفضة',
  },
  'employeeRisk.allRiskFlags': {
    en: 'All risk flags',
    fr: 'Tous les signaux',
    ar: 'كل رايات المخاطر',
  },
  'employeeRisk.statusTransition': {
    en: 'Status transition',
    fr: 'Transition de statut',
    ar: 'انتقال الحالة',
  },
  'employeeRisk.beforeTotal': {
    en: 'Before total',
    fr: 'Total avant',
    ar: 'الإجمالي قبل',
  },
  'employeeRisk.afterTotal': {
    en: 'After total',
    fr: 'Total apres',
    ar: 'الإجمالي بعد',
  },
  'employeeRisk.itemsCount': {
    en: 'Items count',
    fr: 'Nombre d articles',
    ar: 'عدد العناصر',
  },
  'employeeRisk.addedItems': {
    en: 'Added items',
    fr: 'Articles ajoutes',
    ar: 'العناصر المضافة',
  },
  'employeeRisk.removedItems': {
    en: 'Removed items',
    fr: 'Articles supprimes',
    ar: 'العناصر المحذوفة',
  },
  'employeeRisk.changedItems': {
    en: 'Changed items',
    fr: 'Articles modifies',
    ar: 'العناصر المعدلة',
  },
  'employeeRisk.versionChange': {
    en: 'Version',
    fr: 'Version',
    ar: 'الإصدار',
  },
  'employeeRisk.reasonLabel': {
    en: 'Reason',
    fr: 'Raison',
    ar: 'السبب',
  },
  'employeeRisk.showDetails': {
    en: 'Show full order details',
    fr: 'Afficher les details complets',
    ar: 'عرض تفاصيل الطلب كاملة',
  },
  'employeeRisk.hideDetails': {
    en: 'Hide full order details',
    fr: 'Masquer les details',
    ar: 'إخفاء التفاصيل الكاملة',
  },
  'employeeRisk.beforeOrder': {
    en: 'Before edit',
    fr: 'Avant modification',
    ar: 'قبل التعديل',
  },
  'employeeRisk.afterOrder': {
    en: 'After edit',
    fr: 'Apres modification',
    ar: 'بعد التعديل',
  },
  'employeeRisk.changeSummary': {
    en: 'Exact change summary',
    fr: 'Resume exact du changement',
    ar: 'ملخص التغيير الدقيق',
  },
  'employeeRisk.none': {
    en: 'None',
    fr: 'Aucun',
    ar: 'لا يوجد',
  },
  'employeeRisk.modifiersLabel': {
    en: 'Modifiers',
    fr: 'Options',
    ar: 'الإضافات',
  },
  'employeeRisk.rangeToday': {
    en: 'Today',
    fr: 'Aujourd hui',
    ar: 'اليوم',
  },
  'employeeRisk.rangeWeek': {
    en: 'This week',
    fr: 'Cette semaine',
    ar: 'هذا الأسبوع',
  },
  'employeeRisk.rangeCustom': {
    en: 'Custom range',
    fr: 'Plage personnalisee',
    ar: 'فترة مخصصة',
  },
  'employeeRisk.totalReduced': {
    en: 'Total reduced',
    fr: 'Total diminue',
    ar: 'إجمالي ما نُقص',
  },
  'employeeRisk.totalAdded': {
    en: 'Total added',
    fr: 'Total ajoute',
    ar: 'إجمالي ما أُضيف',
  },
  'employeeRisk.netImpact': {
    en: 'Net impact',
    fr: 'Impact net',
    ar: 'الأثر الصافي',
  },
  'employeeRisk.noReason': {
    en: 'No reason provided',
    fr: 'Aucune raison fournie',
    ar: 'لم يتم إدخال سبب',
  },
  'employeeRisk.reason.cashierPosUpdate': {
    en: 'Cashier updated the order from the POS payment screen',
    fr: 'Le caissier a modifie la commande depuis l ecran de paiement POS',
    ar: 'قام الكاشير بتعديل الطلب من شاشة الدفع في نقطة البيع',
  },
  'employeeRisk.reason.orderSettled': {
    en: 'Order was settled through payments',
    fr: 'La commande a ete reglee via les paiements',
    ar: 'تمت تسوية الطلب عبر المدفوعات',
  },
  'employeeRisk.editSource': {
    en: 'Edit Source',
    fr: "Source d'édition",
    ar: 'مصدر التعديل',
  },
  'employeeRisk.editSourceHistory': {
    en: 'Order History',
    fr: "Historique des commandes",
    ar: 'سجل الطلبات',
  },
  'employeeRisk.editSourceCheckout': {
    en: 'Checkout Page',
    fr: 'Page de paiement',
    ar: 'صفحة الدفع',
  },
  'employeeRisk.editSourceTables': {
    en: 'Table Screen',
    fr: "Écran de table",
    ar: 'شاشة الطاولة',
  },
  'employeeRisk.editSourceBoard': {
    en: 'Order Board',
    fr: 'Tableau des commandes',
    ar: 'لوحة الطلبات',
  },
  'employeeRisk.reason.posHistoryAr': {
    en: 'Order modified from POS history',
    fr: 'Commande modifiée depuis l\'historique POS',
    ar: 'تم تعديل الطلب من سجل الطلبات',
  },
  'employeeRisk.reason.paymentScreenAr': {
    en: 'Order modified from payment screen',
    fr: 'Commande modifiée depuis la page de paiement',
    ar: 'تم تعديل الطلب من صفحة الدفع',
  },
  'employeeRisk.reason.orderBoardAr': {
    en: 'Order modified from order board',
    fr: 'Commande modifiée depuis le tableau des commandes',
    ar: 'تم تعديل الطلب من لوحة الطلبات',
  },
  'employeeRisk.reason.tableScreenAr': {
    en: 'Order modified from table screen',
    fr: 'Commande modifiée depuis l\'écran de table',
    ar: 'تم تعديل الطلب من شاشة الطاولة',
  },
  'employeeRisk.createdAtLabel': {
    en: 'Ordered at',
    fr: 'Commande creee a',
    ar: 'وقت إنشاء الطلب',
  },
  'employeeRisk.editedAtLabel': {
    en: 'Cashier edited at',
    fr: 'Modification caissier a',
    ar: 'وقت تعديل الكاشير',
  },
  'payments.empty': {
    en: 'No payments found.',
    fr: 'Aucun paiement trouve.',
    ar: 'لا توجد مدفوعات.',
  },
  'discounts.empty': {
    en: 'No discounts found.',
    fr: 'Aucune remise trouvee.',
    ar: 'لا توجد خصومات.',
  },
  'paymentMethod.cash': {
    en: 'Cash',
    fr: 'Especes',
    ar: 'نقدا',
  },
  'paymentMethod.card': {
    en: 'Card',
    fr: 'Carte',
    ar: 'بطاقة',
  },
  'paymentMethod.bank_transfer': {
    en: 'Bank transfer',
    fr: 'Virement bancaire',
    ar: 'تحويل بنكي',
  },
  'paymentMethod.mobile_payment': {
    en: 'Mobile payment',
    fr: 'Paiement mobile',
    ar: 'دفع عبر الهاتف',
  },
  'discountType.percentage': {
    en: 'Percentage',
    fr: 'Pourcentage',
    ar: 'نسبة مئوية',
  },
  'discountType.fixed_amount': {
    en: 'Fixed amount',
    fr: 'Montant fixe',
    ar: 'قيمة ثابتة',
  },
  'riskFlag.modified_after_preparation_started': {
    en: 'Edited after kitchen start',
    fr: 'Modifie apres debut cuisine',
    ar: 'تم تعديله بعد بدء المطبخ',
  },
  'riskFlag.cashier_item_edit': {
    en: 'Cashier edited items',
    fr: 'Le caissier a modifie les articles',
    ar: 'الكاشير عدل العناصر',
  },
  'riskFlag.waiter_item_edit': {
    en: 'Waiter edited items',
    fr: 'Le serveur a modifie les articles',
    ar: 'النادل عدل العناصر',
  },
  'riskFlag.total_reduced': {
    en: 'Order total reduced',
    fr: 'Total de commande reduit',
    ar: 'تم تخفيض إجمالي الطلب',
  },
  'riskFlag.items_removed': {
    en: 'Items removed from order',
    fr: 'Articles supprimes de la commande',
    ar: 'تم حذف عناصر من الطلب',
  },
  'riskFlag.order_cancelled': {
    en: 'Order cancelled',
    fr: 'Commande annulee',
    ar: 'تم إلغاء الطلب',
  },
  'riskFlag.cashier_status_change': {
    en: 'Cashier changed status',
    fr: 'Le caissier a change le statut',
    ar: 'الكاشير غيّر الحالة',
  },
  'riskFlag.waiter_status_change': {
    en: 'Waiter changed status',
    fr: 'Le serveur a change le statut',
    ar: 'النادل غيّر الحالة',
  },
  'riskFlag.large_discount': {
    en: 'Large discount',
    fr: 'Remise importante',
    ar: 'خصم كبير',
  },

  'nav.employeeRisk': {
    en: 'Employee Risk',
    fr: 'Risque employe',
    ar: 'مخاطر الموظفين',
  },
  'nav.payments': {
    en: 'Payments',
    fr: 'Paiements',
    ar: 'المدفوعات',
  },
  'nav.discounts': {
    en: 'Discounts',
    fr: 'Remises',
    ar: 'الخصومات',
  },
  'status.partially_refunded': {
    en: 'Partially Refunded',
    fr: 'Partiellement rembourse',
    ar: 'استرجاع جزئي',
  },
  'status.refunded': {
    en: 'Refunded',
    fr: 'Rembourse',
    ar: 'مسترجع',
  },
  'status.pending_approval': {
    en: 'Pending Approval',
    fr: 'En attente de validation',
    ar: 'بانتظار الموافقة',
  },
  'status.rejected': {
    en: 'Rejected',
    fr: 'Rejete',
    ar: 'مرفوض',
  },
  'status.active': {
    en: 'Active',
    fr: 'Actif',
    ar: 'نشط',
  },
  'status.inactive': {
    en: 'Inactive',
    fr: 'Inactif',
    ar: 'غير نشط',
  },
  'menu.createMenu': {
    en: 'Create Menu',
    fr: 'Creer un menu',
    ar: 'إنشاء منيو',
  },
  'menu.createMenuSubtitle': {
    en: 'Add a simple menu with Arabic, English, images, and theme settings.',
    fr: 'Ajoutez un menu simple avec arabe, anglais, images et theme.',
    ar: 'أضف منيو بشكل بسيط مع العربية والإنجليزية والصور وإعدادات الشكل.',
  },
  'menu.menuCatalog': {
    en: 'Menus',
    fr: 'Menus',
    ar: 'المنيوهات',
  },
  'menu.menuCatalogSubtitle': {
    en: 'Choose a menu to edit its details and products.',
    fr: 'Choisissez un menu pour modifier ses details et produits.',
    ar: 'اختر منيو لتعديل تفاصيله وأصنافه.',
  },
  'menu.menuDetails': {
    en: 'Menu Details',
    fr: 'Details du menu',
    ar: 'تفاصيل المنيو',
  },
  'menu.menuDetailsSubtitle': {
    en: 'Professional editing for names, descriptions, and images.',
    fr: 'Edition professionnelle des noms, descriptions et images.',
    ar: 'تعديل احترافي للأسماء والوصف والصور.',
  },
  'menu.menuName': {
    en: 'Main menu name',
    fr: 'Nom principal du menu',
    ar: 'اسم المنيو الرئيسي',
  },
  'menu.menuNameAr': {
    en: 'Arabic menu name',
    fr: 'Nom arabe du menu',
    ar: 'اسم المنيو بالعربية',
  },
  'menu.menuNameEn': {
    en: 'English menu name',
    fr: 'Nom anglais du menu',
    ar: 'اسم المنيو بالإنجليزية',
  },
  'menu.menuNameFr': {
    en: 'French menu name',
    fr: 'Nom francais du menu',
    ar: 'اسم المنيو بالفرنسية',
  },
  'menu.menuDescription': {
    en: 'Main menu description',
    fr: 'Description principale du menu',
    ar: 'وصف المنيو الرئيسي',
  },
  'menu.menuDescriptionAr': {
    en: 'Arabic menu description',
    fr: 'Description arabe du menu',
    ar: 'وصف المنيو بالعربية',
  },
  'menu.menuDescriptionEn': {
    en: 'English menu description',
    fr: 'Description anglaise du menu',
    ar: 'وصف المنيو بالإنجليزية',
  },
  'menu.menuDescriptionFr': {
    en: 'French menu description',
    fr: 'Description francaise du menu',
    ar: 'وصف المنيو بالفرنسية',
  },
  'menu.themeKey': {
    en: 'Theme key',
    fr: 'Cle du theme',
    ar: 'مفتاح الثيم',
  },
  'menu.coverImage': {
    en: 'Cover image URL',
    fr: 'URL image de couverture',
    ar: 'رابط صورة الغلاف',
  },
  'menu.heroImage': {
    en: 'Hero image URL',
    fr: 'URL image hero',
    ar: 'رابط صورة الواجهة',
  },
  'menu.imagePreview': {
    en: 'Image preview',
    fr: 'Apercu image',
    ar: 'معاينة الصورة',
  },
  'menu.heroPreview': {
    en: 'Hero preview',
    fr: 'Apercu hero',
    ar: 'معاينة صورة الواجهة',
  },
  'menu.noImage': {
    en: 'No image added yet.',
    fr: 'Aucune image pour le moment.',
    ar: 'لا توجد صورة مضافة بعد.',
  },
  'menu.localizedNames': {
    en: 'Translated names',
    fr: 'Noms traduits',
    ar: 'الأسماء المترجمة',
  },
  'menu.localizedDescriptions': {
    en: 'Translated descriptions',
    fr: 'Descriptions traduites',
    ar: 'الأوصاف المترجمة',
  },
  'menu.tabGeneral': {
    en: 'General',
    fr: 'General',
    ar: 'عام',
  },
  'menu.tabTranslations': {
    en: 'Translations',
    fr: 'Traductions',
    ar: 'الترجمات',
  },
  'menu.tabImages': {
    en: 'Images',
    fr: 'Images',
    ar: 'الصور',
  },
  'menu.tabModifiers': {
    en: 'Modifiers',
    fr: 'Options',
    ar: 'الإضافات',
  },
  'menu.tabPreviewHint': {
    en: 'Open the Images tab to preview uploaded visuals.',
    fr: 'Ouvrez l onglet Images pour voir l apercu.',
    ar: 'افتح تبويب الصور لمعاينة الصور المضافة.',
  },
  'menu.sectionMenus': {
    en: 'Menus',
    fr: 'Menus',
    ar: 'المنيوهات',
  },
  'menu.sectionItems': {
    en: 'Items',
    fr: 'Articles',
    ar: 'الأصناف',
  },
  'menu.sectionModifiers': {
    en: 'Modifiers',
    fr: 'Options',
    ar: 'الإضافات',
  },
  'menu.sectionThemes': {
    en: 'Themes',
    fr: 'Themes',
    ar: 'الثيمات',
  },
  'menu.sectionThemesSubtitle': {
    en: 'Choose the visual identity for the selected menu.',
    fr: 'Choisissez l identite visuelle du menu selectionne.',
    ar: 'اختر الهوية البصرية للمنيو المحدد.',
  },
  'menu.workspaceLabel': {
    en: 'Menu Workspace',
    fr: 'Espace Menu',
    ar: 'مساحة عمل المنيو',
  },
  'menu.workspaceTitle': {
    en: 'Choose the task you want to manage',
    fr: 'Choisissez la tache a gerer',
    ar: 'اختر المهمة التي تريد إدارتها',
  },
  'menu.workspaceSubtitle': {
    en: 'Move between menus, items, modifiers, and themes without one crowded page.',
    fr: 'Passez entre menus, articles, options et themes sans page surchargee.',
    ar: 'تنقل بين المنيوهات والأصناف والإضافات والثيمات بدون صفحة مزدحمة واحدة.',
  },
  'menu.modifiersSubtitleStatic': {
    en: 'Choose an item, then manage its modifier groups and options.',
    fr: 'Choisissez un article puis gerez ses groupes et options.',
    ar: 'اختر صنفًا ثم أدِر مجموعات الإضافات وخياراتها.',
  },
  'menu.saveMenu': {
    en: 'Save Menu',
    fr: 'Enregistrer le menu',
    ar: 'حفظ المنيو',
  },
  'menu.deleteMenu': {
    en: 'Archive Menu',
    fr: 'Archiver le menu',
    ar: 'أرشفة المنيو',
  },
  'menu.createFirstMenu': {
    en: 'Create your first menu to start organizing food categories.',
    fr: 'Creez votre premier menu pour organiser les categories.',
    ar: 'أنشئ أول منيو لبدء تنظيم أصناف الطعام.',
  },
  'menu.itemsCount': {
    en: 'items',
    fr: 'articles',
    ar: 'أصناف',
  },
  'menu.noThemeKey': {
    en: 'No theme selected',
    fr: 'Aucun theme choisi',
    ar: 'لا يوجد ثيم محدد',
  },
  'menu.noMenus': {
    en: 'No menus yet. Start by creating one.',
    fr: 'Aucun menu pour le moment. Commencez par en creer un.',
    ar: 'لا توجد منيوهات بعد. ابدأ بإنشاء واحدة.',
  },
  'menu.createItemSubtitle': {
    en: 'Add a food item to the selected menu with bilingual names and image.',
    fr: 'Ajoutez un plat au menu choisi avec noms bilingues et image.',
    ar: 'أضف صنف طعام إلى المنيو المحدد مع أسماء بلغتين وصورة.',
  },
  'menu.menuItems': {
    en: 'Menu Items',
    fr: 'Articles du menu',
    ar: 'أصناف المنيو',
  },
  'menu.menuItemsSubtitle': {
    en: 'Select an item to edit price, text, image, and modifiers.',
    fr: 'Choisissez un article pour modifier prix, texte, image et options.',
    ar: 'اختر صنفًا لتعديل السعر والنص والصورة والإضافات.',
  },
  'menu.itemNameAr': {
    en: 'Arabic item name',
    fr: 'Nom arabe de l article',
    ar: 'اسم الصنف بالعربية',
  },
  'menu.itemNameEn': {
    en: 'English item name',
    fr: 'Nom anglais de l article',
    ar: 'اسم الصنف بالإنجليزية',
  },
  'menu.itemNameFr': {
    en: 'French item name',
    fr: 'Nom francais de l article',
    ar: 'اسم الصنف بالفرنسية',
  },
  'menu.itemDescriptionAr': {
    en: 'Arabic item description',
    fr: 'Description arabe de l article',
    ar: 'وصف الصنف بالعربية',
  },
  'menu.itemDescriptionEn': {
    en: 'English item description',
    fr: 'Description anglaise de l article',
    ar: 'وصف الصنف بالإنجليزية',
  },
  'menu.itemDescriptionFr': {
    en: 'French item description',
    fr: 'Description francaise de l article',
    ar: 'وصف الصنف بالفرنسية',
  },
  'menu.itemImage': {
    en: 'Item image URL',
    fr: 'URL image de l article',
    ar: 'رابط صورة الصنف',
  },
  'menu.itemDetails': {
    en: 'Item Details',
    fr: 'Details de l article',
    ar: 'تفاصيل الصنف',
  },
  'menu.itemDetailsSubtitle': {
    en: 'Update the selected dish in one clean form.',
    fr: 'Mettez a jour le plat choisi dans un formulaire clair.',
    ar: 'عدّل الطبق المحدد من خلال نموذج واضح ومرتب.',
  },
  'menu.saveItem': {
    en: 'Save Item',
    fr: 'Enregistrer l article',
    ar: 'حفظ الصنف',
  },
  'menu.deleteItem': {
    en: 'Archive Item',
    fr: 'Archiver l article',
    ar: 'أرشفة الصنف',
  },
  'menu.noItemsYet': {
    en: 'No items in this menu yet.',
    fr: 'Aucun article dans ce menu pour le moment.',
    ar: 'لا توجد أصناف في هذا المنيو بعد.',
  },
  'menu.selectItemPrompt': {
    en: 'Select an item to edit its details and modifiers.',
    fr: 'Choisissez un article pour modifier ses details et options.',
    ar: 'اختر صنفًا لتعديل تفاصيله وإضافاته.',
  },
  'menu.modifiers': {
    en: 'Modifiers',
    fr: 'Options',
    ar: 'الإضافات',
  },
  'menu.modifiersSubtitle': {
    en: 'Manage add-ons for',
    fr: 'Gerer les ajouts pour',
    ar: 'إدارة إضافات الطبق',
  },
  'menu.modifierGroupsCount': {
    en: 'modifier groups',
    fr: 'groupes d options',
    ar: 'مجموعات إضافات',
  },
  'menu.modifierGroupName': {
    en: 'Modifier group name',
    fr: 'Nom du groupe',
    ar: 'اسم مجموعة الإضافات',
  },
  'menu.modifierGroupNameAr': {
    en: 'Arabic group name',
    fr: 'Nom arabe du groupe',
    ar: 'اسم المجموعة بالعربية',
  },
  'menu.modifierGroupNameEn': {
    en: 'English group name',
    fr: 'Nom anglais du groupe',
    ar: 'اسم المجموعة بالإنجليزية',
  },
  'menu.modifierGroupNameFr': {
    en: 'French group name',
    fr: 'Nom francais du groupe',
    ar: 'اسم المجموعة بالفرنسية',
  },
  'menu.requiredToggle': {
    en: 'Required selection',
    fr: 'Selection obligatoire',
    ar: 'اختيار إجباري',
  },
  'menu.minSelections': {
    en: 'Minimum selections',
    fr: 'Selections minimum',
    ar: 'أقل عدد اختيارات',
  },
  'menu.maxSelections': {
    en: 'Maximum selections',
    fr: 'Selections maximum',
    ar: 'أقصى عدد اختيارات',
  },
  'menu.createGroup': {
    en: 'Create Group',
    fr: 'Creer le groupe',
    ar: 'إنشاء مجموعة',
  },
  'menu.saveGroup': {
    en: 'Save Group',
    fr: 'Enregistrer le groupe',
    ar: 'حفظ المجموعة',
  },
  'menu.deleteGroup': {
    en: 'Delete Group',
    fr: 'Supprimer le groupe',
    ar: 'حذف المجموعة',
  },
  'menu.noModifierGroups': {
    en: 'No modifier groups yet for this item.',
    fr: 'Aucun groupe d options pour cet article.',
    ar: 'لا توجد مجموعات إضافات لهذا الصنف بعد.',
  },
  'menu.addOption': {
    en: 'Add Option',
    fr: 'Ajouter une option',
    ar: 'إضافة خيار',
  },
  'menu.optionName': {
    en: 'Option name',
    fr: 'Nom de l option',
    ar: 'اسم الخيار',
  },
  'menu.optionNameAr': {
    en: 'Arabic option name',
    fr: 'Nom arabe de l option',
    ar: 'اسم الخيار بالعربية',
  },
  'menu.optionNameEn': {
    en: 'English option name',
    fr: 'Nom anglais de l option',
    ar: 'اسم الخيار بالإنجليزية',
  },
  'menu.optionNameFr': {
    en: 'French option name',
    fr: 'Nom francais de l option',
    ar: 'اسم الخيار بالفرنسية',
  },
  'menu.priceDelta': {
    en: 'Price increase',
    fr: 'Supplement prix',
    ar: 'زيادة السعر',
  },
  'menu.saveOption': {
    en: 'Save Option',
    fr: 'Enregistrer l option',
    ar: 'حفظ الخيار',
  },
  'menu.deleteOption': {
    en: 'Archive Option',
    fr: 'Archiver l option',
    ar: 'أرشفة الخيار',
  },
  'menu.validationMenuName': {
    en: 'Menu name is required.',
    fr: 'Le nom du menu est obligatoire.',
    ar: 'اسم المنيو مطلوب.',
  },
  'menu.validationItemFields': {
    en: 'Menu, item name, and valid price are required.',
    fr: 'Le menu, le nom et un prix valide sont obligatoires.',
    ar: 'المنيو واسم الصنف وسعر صالح مطلوبة.',
  },
  'menu.validationGroupName': {
    en: 'Modifier group name is required.',
    fr: 'Le nom du groupe est obligatoire.',
    ar: 'اسم مجموعة الإضافات مطلوب.',
  },
  'menu.validationOptionName': {
    en: 'Modifier option name is required.',
    fr: 'Le nom de l option est obligatoire.',
    ar: 'اسم خيار الإضافة مطلوب.',
  },
  'menu.requireAllLanguages': {
    en: 'Please enter the name in all three languages (Arabic, English, French) before saving.',
    fr: 'Veuillez saisir le nom dans les trois langues (arabe, anglais, français) avant de sauvegarder.',
    ar: 'يرجى إدخال الاسم باللغات الثلاث (العربية، الإنجليزية، الفرنسية) قبل الحفظ.',
  },
  'menu.addSectionSubtitle': {
    en: 'Create new records using the existing workflow and current validation rules.',
    fr: 'Creez de nouveaux elements avec le workflow et les validations actuelles.',
    ar: 'أنشئ عناصر جديدة باستخدام نفس مسار العمل الحالي ونفس قواعد التحقق الحالية.',
  },
  'menu.manageSectionSubtitle': {
    en: 'Manage existing records with the same production behavior already used in the system.',
    fr: 'Gerez les elements existants avec le meme comportement deja utilise dans le systeme.',
    ar: 'أدر العناصر الحالية بنفس السلوك المستخدم حاليًا داخل النظام.',
  },
  'menu.addMenuPageTitle': {
    en: 'Add Menu',
    fr: 'Ajouter un menu',
    ar: 'إضافة منيو',
  },
  'menu.addItemPageTitle': {
    en: 'Add Item',
    fr: 'Ajouter un article',
    ar: 'إضافة صنف',
  },
  'menu.addAddonPageTitle': {
    en: 'Add Addon',
    fr: 'Ajouter une option',
    ar: 'إضافة إضافة',
  },
  'menu.manageMenuPageTitle': {
    en: 'Manage Menu',
    fr: 'Gerer le menu',
    ar: 'إدارة المنيو',
  },
  'menu.manageItemPageTitle': {
    en: 'Manage Item',
    fr: 'Gerer les articles',
    ar: 'إدارة الأصناف',
  },
  'menu.manageAddonPageTitle': {
    en: 'Manage Addon',
    fr: 'Gerer les options',
    ar: 'إدارة الإضافات',
  },
  'nav.networks': {
    en: 'Networks',
    fr: 'Reseaux',
    ar: 'الشبكات',
  },
  'menu.modeAdd': {
    en: 'Add',
    fr: 'Ajouter',
    ar: 'إضافة',
  },
  'menu.modeEdit': {
    en: 'Manage',
    fr: 'Gerer',
    ar: 'إدارة',
  },
  'menu.addMenu': {
    en: 'Menu',
    fr: 'Menu',
    ar: 'منيو',
  },
  'menu.editMenu': {
    en: 'Menu',
    fr: 'Menu',
    ar: 'منيو',
  },
  'menu.addItemShortcut': {
    en: 'Item',
    fr: 'Article',
    ar: 'صنف',
  },
  'menu.editItemShortcut': {
    en: 'Item',
    fr: 'Article',
    ar: 'صنف',
  },
  'menu.addModifierShortcut': {
    en: 'Addon',
    fr: 'Option',
    ar: 'إضافة',
  },
  'menu.editModifierShortcut': {
    en: 'Addon',
    fr: 'Option',
    ar: 'إضافة',
  },
  'menu.backToGroups': {
    en: 'Back to groups',
    fr: 'Retour aux groupes',
    ar: 'عودة إلى المجموعات',
  },

  'networks.title': {
    en: 'Network Settings',
    fr: 'Paramètres réseau',
    ar: 'إعدادات الشبكة',
  },
  'networks.subtitle': {
    en: 'Manage local network links for all restaurant screens.',
    fr: 'Gérez les liens réseau locaux pour tous les écrans du restaurant.',
    ar: 'إدارة روابط الشبكة المحلية لجميع شاشات المطعم.',
  },
  'networks.refresh': {
    en: 'Refresh current network',
    fr: 'Actualiser le réseau actuel',
    ar: 'تحديث الشبكة الحالية',
  },
  'networks.infoTitle': {
    en: 'Network Info',
    fr: 'Informations réseau',
    ar: 'معلومات الشبكة',
  },
  'networks.infoSubtitle': {
    en: 'When the network changes, refresh to rebuild all links using the new IP address.',
    fr: 'Si le réseau change, actualisez pour reconstruire tous les liens avec la nouvelle IP.',
    ar: 'عند تغيير الشبكة اضغط تحديث لتتغير كل الروابط تلقائياً حسب IP الجديد.',
  },
  'networks.loading': {
    en: 'Loading network info...',
    fr: 'Chargement des informations réseau...',
    ar: 'جارٍ تحميل معلومات الشبكة...',
  },
  'networks.serverIp': {
    en: 'Server IP',
    fr: 'IP du serveur',
    ar: 'IP الخادم',
  },
  'networks.hostname': {
    en: 'Hostname',
    fr: "Nom d'hôte",
    ar: 'اسم المضيف',
  },
  'networks.localDomain': {
    en: 'Local Domain',
    fr: 'Domaine local',
    ar: 'النطاق المحلي',
  },
  'networks.previousIp': {
    en: 'Previous IP',
    fr: 'IP précédente',
    ar: 'IP السابق',
  },
  'networks.notFound': {
    en: 'Not Found',
    fr: 'Introuvable',
    ar: 'غير موجود',
  },
  'networks.linkMode': {
    en: 'Link Mode',
    fr: 'Mode des liens',
    ar: 'وضع الروابط',
  },
  'networks.autoIp': {
    en: 'Dynamic LAN IP',
    fr: 'IP locale dynamique',
    ar: 'IP محلي ديناميكي',
  },
  'networks.autoHostname': {
    en: 'Hostname .local',
    fr: "Nom d'hôte .local",
    ar: 'اسم مضيف .local',
  },
  'networks.customMode': {
    en: 'Custom Host',
    fr: 'Hôte personnalisé',
    ar: 'مضيف مخصص',
  },
  'networks.customHost': {
    en: 'Custom Host',
    fr: 'Hôte personnalisé',
    ar: 'المضيف المخصص',
  },
  'networks.resolvedHost': {
    en: 'Resolved Host',
    fr: 'Hôte retenu',
    ar: 'المضيف المعتمد',
  },
  'networks.linksTitle': {
    en: 'Screen Links',
    fr: 'Liens des écrans',
    ar: 'روابط الشاشات',
  },
  'networks.linksSubtitle': {
    en: 'These links change based on the current network IP or the host you choose.',
    fr: 'Ces liens changent selon l\'IP actuelle du réseau ou l\'hôte choisi.',
    ar: 'هذه الروابط تتغير حسب IP الشبكة الحالية أو حسب المضيف الذي تختاره.',
  },
  'networks.appCustomer': {
    en: 'Customer App',
    fr: 'Écran client',
    ar: 'واجهة الزبون',
  },
  'networks.appPos': {
    en: 'POS',
    fr: 'Écran POS',
    ar: 'واجهة الكاشير',
  },
  'networks.appKitchen': {
    en: 'Kitchen',
    fr: 'Écran cuisine',
    ar: 'واجهة المطبخ',
  },
  'networks.appAdmin': {
    en: 'Admin',
    fr: 'Écran admin',
    ar: 'واجهة الأدمن',
  },
  'networks.appWaiter': {
    en: 'Waiter',
    fr: 'Écran serveur',
    ar: 'واجهة النادل',
  },
  'networks.appBackend': {
    en: 'Backend',
    fr: 'Backend',
    ar: 'الباكند',
  },
  'consumptionLogs.title': {
    en: 'Consumption Logs',
    fr: 'Suivi de consommation',
    ar: 'سجلات الاستهلاك',
  },
  'consumptionLogs.subtitle': {
    en: 'Live audit of inventory usage from every paid order',
    fr: "Audit en direct de l'utilisation des stocks à partir de chaque commande payée",
    ar: 'تدقيق مباشر لاستخدام المخزون من كل طلب مدفوع',
  },
  'consumptionLogs.exportCsv': {
    en: 'Export CSV',
    fr: 'Exporter CSV',
    ar: 'تصدير CSV',
  },
  'consumptionLogs.refresh': {
    en: 'Refresh',
    fr: 'Actualiser',
    ar: 'تحديث',
  },
  'consumptionLogs.filter': {
    en: 'Filter',
    fr: 'Filtrer',
    ar: 'تصفية',
  },
  'consumptionLogs.item': {
    en: 'Item',
    fr: 'Article',
    ar: 'المادة',
  },
  'consumptionLogs.allItems': {
    en: 'All Items',
    fr: 'Tous les articles',
    ar: 'جميع المواد',
  },
  'consumptionLogs.type': {
    en: 'Type',
    fr: 'Type',
    ar: 'النوع',
  },
  'consumptionLogs.allTypes': {
    en: 'All Types',
    fr: 'Tous les types',
    ar: 'جميع الأنواع',
  },
  'consumptionLogs.auto': {
    en: 'Auto',
    fr: 'Auto',
    ar: 'تلقائي',
  },
  'consumptionLogs.manual': {
    en: 'Manual',
    fr: 'Manuel',
    ar: 'يدوي',
  },
  'consumptionLogs.recordsFound': {
    en: '{count} records found',
    fr: '{count} enregistrements trouvés',
    ar: 'تم العثور على {count} سجل',
  },
  'consumptionLogs.loading': {
    en: 'Loading...',
    fr: 'Chargement...',
    ar: 'تحميل...',
  },
  'consumptionLogs.empty': {
    en: 'No consumption records yet',
    fr: 'Aucun enregistrement de consommation pour le moment',
    ar: 'لا توجد سجلات استهلاك بعد',
  },
  'consumptionLogs.qtyUsed': {
    en: 'Qty Used',
    fr: 'Qté utilisée',
    ar: 'الكمية المستخدمة',
  },
  'consumptionLogs.orderRef': {
    en: 'Order Ref',
    fr: 'Réf. commande',
    ar: 'رقم الطلب',
  },
  'consumptionLogs.date': {
    en: 'Date',
    fr: 'Date',
    ar: 'التاريخ',
  },
  'consumptionLogs.consumptionDate': {
    en: 'Consumption Date',
    fr: 'Date de consommation',
    ar: 'تاريخ الاستهلاك',
  },
  'consumptionLogs.deductedQty': {
    en: 'Deducted Quantity',
    fr: 'Quantité déduite',
    ar: 'الكمية المخصومة',
  },
  'consumptionLogs.consumptionType': {
    en: 'Consumption Type',
    fr: 'Type de déduction',
    ar: 'نوع الاستهلاك',
  },
  'consumptionLogs.autoDeduction': {
    en: 'Auto Deduction',
    fr: 'Déduction automatique',
    ar: 'خصم تلقائي',
  },
  'consumptionLogs.csvHeaders': {
    en: 'Item,Quantity Used,Type,Order #,Date',
    fr: 'Article,Quantité utilisée,Type,N° Commande,Date',
    ar: 'المادة,الكمية المستخدمة,النوع,رقم الطلب,التاريخ',
  },
  'consumptionLogs.exportPdf': {
    en: 'Export Daily Report (PDF)',
    fr: 'Exporter le rapport quotidien (PDF)',
    ar: 'تصدير التقرير اليومي (PDF)',
  },
  'consumptionLogs.exportingPdf': {
    en: 'Generating PDF...',
    fr: 'Génération du PDF...',
    ar: 'جاري إنشاء PDF...',
  },
  'consumptionLogs.dateRange': {
    en: 'Date Range',
    fr: 'Période',
    ar: 'نطاق التاريخ',
  },
  'consumptionLogs.today': {
    en: 'Today',
    fr: "Aujourd'hui",
    ar: 'اليوم',
  },
  'consumptionLogs.yesterday': {
    en: 'Yesterday',
    fr: 'Hier',
    ar: 'الأمس',
  },
  'consumptionLogs.last7Days': {
    en: 'Last 7 Days',
    fr: '7 derniers jours',
    ar: 'آخر 7 أيام',
  },
  'consumptionLogs.customRange': {
    en: 'Custom Range',
    fr: 'Plage personnalisée',
    ar: 'نطاق مخصص',
  },
  'consumptionLogs.fromDate': {
    en: 'From Date',
    fr: 'Date de début',
    ar: 'من تاريخ',
  },
  'consumptionLogs.toDate': {
    en: 'To Date',
    fr: 'Date de fin',
    ar: 'إلى تاريخ',
  },
  'consumptionLogs.orderType': {
    en: 'Order Type',
    fr: 'Type de commande',
    ar: 'نوع الطلب',
  },
  'consumptionLogs.allOrderTypes': {
    en: 'All Types',
    fr: 'Tous les types',
    ar: 'جميع الأنواع',
  },
  'consumptionLogs.dineIn': {
    en: 'Dine In',
    fr: 'Sur place',
    ar: 'صالة',
  },
  'consumptionLogs.takeaway': {
    en: 'Take Away',
    fr: 'À emporter',
    ar: 'سفري',
  },
  'consumptionLogs.delivery': {
    en: 'Delivery',
    fr: 'Livraison',
    ar: 'توصيل',
  },
  'consumptionLogs.table': {
    en: 'Table',
    fr: 'Table',
    ar: 'طاولة',
  },
  'consumptionLogs.unit': {
    en: 'Unit',
    fr: 'Unité',
    ar: 'الوحدة',
  },
  'consumptionLogs.orderNumber': {
    en: 'Order #',
    fr: 'N° commande',
    ar: 'رقم الطلب',
  },
  'consumptionLogs.orderInfo': {
    en: 'Order Info',
    fr: 'Infos commande',
    ar: 'معلومات الطلب',
  },
  'consumptionLogs.pdfTitle': {
    en: 'Daily Consumption Report',
    fr: 'Rapport quotidien de consommation',
    ar: 'تقرير الاستهلاك اليومي',
  },
  'consumptionLogs.pdfSubtitle': {
    en: 'Detailed inventory usage from all prepared orders',
    fr: "Utilisation détaillée des stocks de toutes les commandes préparées",
    ar: 'استخدام المخزون المفصل من جميع الطلبات المحضرة',
  },
  'consumptionLogs.totalItems': {
    en: 'Total Items Consumed',
    fr: 'Total des articles consommés',
    ar: 'إجمالي المواد المستهلكة',
  },
  'consumptionLogs.totalQuantity': {
    en: 'Total Quantity',
    fr: 'Quantité totale',
    ar: 'الكمية الإجمالية',
  },
  'consumptionLogs.noOrdersYet': {
    en: 'No consumption records found for the selected filters',
    fr: 'Aucun enregistrement de consommation trouvé pour les filtres sélectionnés',
    ar: 'لم يتم العثور على سجلات استهلاك للفلاتر المحددة',
  },
  'consumptionLogs.dineInTable': {
    en: 'Table {name}',
    fr: 'Table {name}',
    ar: 'طاولة {name}',
  },
  'nav.recipeMapper': {
    en: 'Recipe & Modifiers',
    fr: 'Recettes et modificateurs',
    ar: 'الوصفات والمعدلات',
  },
  'recipeMapper.title': {
    en: 'Recipe & Modifiers Mapper',
    fr: 'Gestionnaire de recettes et modificateurs',
    ar: 'مدير الوصفات والمعدلات',
  },
  'recipeMapper.subtitle': {
    en: 'Manage ingredient requirements for menu items and their modifiers',
    fr: "Gérez les ingrédients requis pour les articles du menu et leurs modificateurs",
    ar: 'إدارة المكونات المطلوبة لعناصر القائمة ومعدلاتها',
  },
  'recipeMapper.selectMenuItem': {
    en: 'Select a menu item to manage its recipe and modifiers',
    fr: 'Sélectionnez un article du menu pour gérer sa recette et ses modificateurs',
    ar: 'اختر عنصر قائمة لإدارة وصفتها ومعدلاتها',
  },
  'recipeMapper.recipe': {
    en: 'Recipe',
    fr: 'Recette',
    ar: 'الوصفة',
  },
  'recipeMapper.modifiers': {
    en: 'Modifiers',
    fr: 'Modificateurs',
    ar: 'المعدلات',
  },
  'recipeMapper.ingredients': {
    en: 'Ingredients',
    fr: 'Ingrédients',
    ar: 'المكونات',
  },
  'recipeMapper.addIngredient': {
    en: 'Add Ingredient',
    fr: 'Ajouter un ingrédient',
    ar: 'إضافة مكون',
  },
  'recipeMapper.editIngredient': {
    en: 'Edit Ingredient',
    fr: 'Modifier l\'ingrédient',
    ar: 'تعديل المكون',
  },
  'recipeMapper.noIngredients': {
    en: 'No ingredients defined for this item',
    fr: 'Aucun ingrédient défini pour cet article',
    ar: 'لا توجد مكونات محددة لهذا العنصر',
  },
  'recipeMapper.noModifierIngredients': {
    en: 'No ingredients defined for this modifier option',
    fr: 'Aucun ingrédient défini pour cette option de modificateur',
    ar: 'لا توجد مكونات محددة لخيار المعدل هذا',
  },
  'recipeMapper.noModifiers': {
    en: 'No modifier groups defined for this item',
    fr: 'Aucun groupe de modificateurs défini pour cet article',
    ar: 'لا توجد مجموعات معدلات محددة لهذا العنصر',
  },
  'recipeMapper.quantity': {
    en: 'Quantity Required',
    fr: 'Quantité requise',
    ar: 'الكمية المطلوبة',
  },
  'recipeMapper.inventoryItem': {
    en: 'Inventory Item',
    fr: 'Article d\'inventaire',
    ar: 'عنصر المخزون',
  },
  'recipeMapper.selectInventoryItem': {
    en: 'Select an inventory item',
    fr: 'Sélectionnez un article d\'inventaire',
    ar: 'اختر عنصر مخزون',
  },
  'recipeMapper.noMenus': {
    en: 'No menus found',
    fr: 'Aucun menu trouvé',
    ar: 'لم يتم العثور على قوائم',
  },
  'recipeMapper.searchMenus': {
    en: 'Search menus...',
    fr: 'Rechercher des menus...',
    ar: 'البحث عن القوائم...',
  },
  'recipeMapper.saveError': {
    en: 'Failed to save ingredient',
    fr: 'Échec de l\'enregistrement de l\'ingrédient',
    ar: 'فشل حفظ المكون',
  },
  'recipeMapper.loadError': {
    en: 'Failed to load data',
    fr: 'Échec du chargement des données',
    ar: 'فشل تحميل البيانات',
  },
  'recipeMapper.deleteConfirm': {
    en: 'Are you sure you want to remove this ingredient?',
    fr: 'Êtes-vous sûr de vouloir supprimer cet ingrédient ?',
    ar: 'هل أنت متأكد من إزالة هذا المكون؟',
  },
});


export function translate(language: AdminLanguage, key: string) {
  return dictionary[key]?.[language] ?? dictionary[key]?.en ?? key;
}

export function isRtl(language: AdminLanguage) {
  return language === 'ar';
}

export function defaultLocale(language: AdminLanguage) {
  if (language === 'fr') return 'fr-FR';
  if (language === 'ar') return 'ar-DZ';
  return 'en-US';
}

function normalizeKey(input: string) {
  return input
    .trim()
    .toUpperCase()
    .replace(/[\s/-]+/g, '_');
}

export function translateStatus(language: AdminLanguage, status: string) {
  const key = `status.${normalizeKey(status).toLowerCase()}`;
  return translate(language, key);
}

export function translateRole(language: AdminLanguage, role: string) {
  const key = `role.${normalizeKey(role).toLowerCase()}`;
  return translate(language, key);
}

export function translatePrinterType(language: AdminLanguage, type: string) {
  const key = `printerType.${normalizeKey(type).toLowerCase()}`;
  return translate(language, key);
}

export function translateReportType(language: AdminLanguage, type: string) {
  const key = `reportType.${normalizeKey(type).toLowerCase()}`;
  return translate(language, key);
}

export function translatePaymentMethod(language: AdminLanguage, method: string) {
  const key = `paymentMethod.${normalizeKey(method).toLowerCase()}`;
  return translate(language, key);
}

export function translateDiscountType(language: AdminLanguage, type: string) {
  const key = `discountType.${normalizeKey(type).toLowerCase()}`;
  return translate(language, key);
}

export function translateRiskFlag(language: AdminLanguage, flag: string) {
  const key = `riskFlag.${normalizeKey(flag).toLowerCase()}`;
  return translate(language, key);
}
