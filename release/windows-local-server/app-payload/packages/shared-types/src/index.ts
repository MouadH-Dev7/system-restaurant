// Core enums and string unions

export type UserRole = 'ADMIN' | 'MANAGER' | 'CHEF' | 'CASHIER' | 'WAITER';

export type TableStatus = 'AVAILABLE' | 'OCCUPIED' | 'RESERVED';

export type OrderStatus =
  | 'PENDING'
  | 'PREPARING'
  | 'READY'
  | 'DELIVERED'
  | 'PAID'
  | 'CANCELLED';

export enum OrderType {
  DINE_IN = 'DINE_IN',
  TAKEAWAY = 'TAKEAWAY',
  DELIVERY = 'DELIVERY',
}

export type OrderSource = 'CUSTOMER' | 'STAFF';

export type PaymentMethod = 'CASH' | 'CARD' | 'BANK_TRANSFER' | 'MOBILE_PAYMENT';

export type ReceiptLanguage = 'ar' | 'fr' | 'en';

export type PaymentStatus = 'PENDING' | 'COMPLETED' | 'FAILED';
export type FinancialPaymentStatus =
  | 'PENDING'
  | 'PAID'
  | 'PARTIALLY_REFUNDED'
  | 'REFUNDED'
  | 'CANCELLED';

export type DiscountType = 'PERCENTAGE' | 'FIXED_AMOUNT';

export type DiscountApprovalStatus = 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED';

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type PrintJobType =
  | 'RECEIPT'
  | 'KITCHEN_TICKET'
  | 'ORDER_UPDATE_TICKET'
  | 'TEST_PAGE';

export type PrintJobStatus = 'WAITING' | 'ACTIVE' | 'COMPLETED' | 'FAILED';

export type PrinterType = 'RECEIPT' | 'KITCHEN' | 'BAR';

export type PrinterStatus = 'ONLINE' | 'OFFLINE' | 'LOW_PAPER';

export type ReportType =
  | 'FINANCIAL'
  | 'OPERATIONS'
  | 'PRINTING'
  | 'INVENTORY'
  | 'CUSTOMERS'
  | 'PAYMENTS'
  | 'DISCOUNTS'
  | 'FINANCIAL_AUDIT';

export type ReportStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';

export type QueueName =
  | 'PRINTING'
  | 'NOTIFICATIONS'
  | 'ANALYTICS'
  | 'EXPORTS'
  | 'BACKUPS'
  | 'FAILED_PRINT_JOBS';

export type QueueJobStatus = 'WAITING' | 'ACTIVE' | 'COMPLETED' | 'FAILED';

export type QueueJobType =
  | 'PRINT_RECEIPT'
  | 'PRINT_KITCHEN_TICKET'
  | 'PRINT_ORDER_UPDATE_TICKET'
  | 'PRINT_TEST_PAGE'
  | 'NOTIFY_ORDER_CREATED'
  | 'NOTIFY_ORDER_PREPARING'
  | 'NOTIFY_ORDER_READY'
  | 'NOTIFY_ORDER_DELIVERED'
  | 'NOTIFY_ORDER_PAID'
  | 'ANALYTICS_SALES_AGGREGATION'
  | 'ANALYTICS_DAILY_METRICS'
  | 'ANALYTICS_DASHBOARD_CALCULATION'
  | 'EXPORT_SALES_REPORT'
  | 'EXPORT_INVENTORY'
  | 'EXPORT_CUSTOMERS'
  | 'BACKUP_DATABASE'
  | 'BACKUP_REPORTS'
  | 'BACKUP_SETTINGS';

export type InventoryStatus = 'HEALTHY' | 'LOW_STOCK' | 'CRITICAL';

export type CustomerTier = 'NEW' | 'REGULAR' | 'VIP';

export type AuditLogStatus = 'SUCCESS' | 'WARNING' | 'FAILED';

export type AuditLogModule =
  | 'ORDERS'
  | 'MENU'
  | 'SYSTEM'
  | 'STAFF'
  | 'PRINTING'
  | 'INVENTORY'
  | 'SETTINGS'
  | 'WAITER_NOTIFICATIONS';

export type WaiterNotificationType =
  | 'CALL_WAITER'
  | 'ORDER_READY_FOR_DELIVERY'
  | 'ORDER_READY_FOR_PICKUP';

export type WaiterNotificationStatus = 'PENDING' | 'ACCEPTED' | 'RESOLVED';

export type WaiterNotificationItemModifierDTO = {
  groupName: string;
  groupNameEn?: string | null;
  groupNameFr?: string | null;
  groupNameAr?: string | null;
  optionName: string;
  optionNameEn?: string | null;
  optionNameFr?: string | null;
  optionNameAr?: string | null;
};

export type WaiterNotificationItemDTO = {
  quantity: number;
  name: string;
  nameEn?: string | null;
  nameFr?: string | null;
  nameAr?: string | null;
  notes?: string | null;
  modifiers?: WaiterNotificationItemModifierDTO[];
};

export type WaiterNotificationMetadata = {
  requestedAt?: string;
  dailyOrderNumber?: number;
  displayOrderId?: string;
  orderStatus?: OrderStatus;
  totalItems?: number;
  items?: WaiterNotificationItemDTO[];
};

// Core entities

export type RestaurantDTO = {
  id: string;
  name: string;
  address: string;
  createdAt: string;
};

export type TableDTO = {
  id: string;
  number: number;
  capacity: number;
  status: TableStatus;
  floorId: string | null;
  floorName: string | null;
  posX: number | null;
  posY: number | null;
  shape: 'round' | 'square' | null;
  restaurantId: string;
  qrPayload: string;
  qrCodeUrl: string;
  createdAt: string;
};

export type FloorDTO = {
  id: string;
  name: string;
  sortOrder: number;
  restaurantId: string;
  createdAt: string;
  updatedAt: string;
};

export type MenuDTO = {
  id: string;
  name: string;
  nameEn?: string | null;
  nameFr?: string | null;
  nameAr?: string | null;
  description: string | null;
  descriptionEn?: string | null;
  descriptionFr?: string | null;
  descriptionAr?: string | null;
  image: string | null;
  heroImage?: string | null;
  themeKey?: string | null;
  sortOrder: number;
  active: boolean;
  restaurantId: string;
};

export type ModifierOptionDTO = {
  id: string;
  name: string;
  nameEn?: string | null;
  nameFr?: string | null;
  nameAr?: string | null;
  description?: string | null;
  descriptionEn?: string | null;
  descriptionFr?: string | null;
  descriptionAr?: string | null;
  priceDelta: number;
  available: boolean;
  isDefault: boolean;
  sortOrder: number;
  groupId: string;
};

export type ModifierGroupDTO = {
  id: string;
  name: string;
  nameEn?: string | null;
  nameFr?: string | null;
  nameAr?: string | null;
  description?: string | null;
  descriptionEn?: string | null;
  descriptionFr?: string | null;
  descriptionAr?: string | null;
  required: boolean;
  minSelections: number;
  maxSelections: number;
  sortOrder: number;
  restaurantId: string;
  menuItemId: string;
  options: ModifierOptionDTO[];
};

export type MenuItemDTO = {
  id: string;
  name: string;
  nameEn?: string | null;
  nameFr?: string | null;
  nameAr?: string | null;
  description: string | null;
  descriptionEn?: string | null;
  descriptionFr?: string | null;
  descriptionAr?: string | null;
  price: number;
  image: string | null;
  available: boolean;
  featured?: boolean;
  badge?: string | null;
  badgeEn?: string | null;
  badgeFr?: string | null;
  badgeAr?: string | null;
  sortOrder?: number;
  menuId: string;
  restaurantId: string;
  modifierGroups?: ModifierGroupDTO[];
};

export type OrderContextDTO = {
  tableId?: string;
  restaurantId: string;
};

export type CartItemDTO = {
  menuItemId: string;
  quantity: number;
  notes?: string;
  cartLineId?: string;
  modifierOptionIds?: string[];
};

export type OrderItemModifierDTO = {
  id: string;
  modifierOptionId?: string | null;
  groupName: string;
  groupNameEn?: string | null;
  groupNameFr?: string | null;
  groupNameAr?: string | null;
  optionName: string;
  optionNameEn?: string | null;
  optionNameFr?: string | null;
  optionNameAr?: string | null;
  priceDelta: number;
};

export type OrderItemDTO = {
  id: string;
  quantity: number;
  price: number;
  notes: string | null;
  orderId: string;
  menuItemId: string;
  modifiers?: OrderItemModifierDTO[];
  menuItem?: MenuItemDTO;
};

export type OrderTableDTO = {
  id: string;
  number: number;
};

export type OrderFinancialStatus =
  | 'UNPAID'
  | 'PARTIALLY_PAID'
  | 'PAID'
  | 'REFUNDED'
  | 'CANCELLED';

export type OrderFinancialSummaryDTO = {
  subtotal: number;
  discountTotal: number;
  taxTotal: number;
  grandTotal: number;
  paidAmount: number;
  remainingAmount: number;
  financialStatus: OrderFinancialStatus;
};

export type OrderServiceTimesDTO = {
  createdAt: string;
  acceptedAt?: string | null;
  preparationStartedAt?: string | null;
  readyAt?: string | null;
  deliveredAt?: string | null;
};

export type OrderResponse = {
  id: string;
  displayOrderId?: string;
  status: OrderStatus;
  orderType: OrderType;
  source: OrderSource;
  parentOrderId?: string | null;
  total: number;
  subtotal: number;
  discountTotal: number;
  taxTotal: number;
  grandTotal: number;
  paidAmount: number;
  remainingAmount: number;
  financialStatus: OrderFinancialStatus;
  financialSummary: OrderFinancialSummaryDTO;
  businessDate: string;
  dailyOrderNumber: number;
  tableId: string;
  restaurantId: string;
  guestSessionId?: string | null;
  version: number;
  lockedAt?: string | null;
  serviceTimes: OrderServiceTimesDTO;
  table?: OrderTableDTO;
  items: OrderItemDTO[];
  createdAt: string;
  lastModifiedAt: string;
};

export type TableOrdersSummaryDTO = {
  tableId: string;
  tableNumber: number | null;
  totalOrders: number;
  totalAmount: number;
  preparingOrders: number;
  readyOrders: number;
  deliveredOrders: number;
};

export type TableOrdersGroupDTO = {
  summary: TableOrdersSummaryDTO;
  orders: OrderResponse[];
};

export type TableTimelineCategory =
  | 'ALL'
  | 'ORDERS'
  | 'PAYMENTS'
  | 'EDITS'
  | 'HIGH_RISK';

export type TableTimelineEntryDTO = {
  id: string;
  tableId: string;
  orderId?: string | null;
  paymentId?: string | null;
  actorName: string;
  actorRole: string;
  staffCode?: string | null;
  action: string;
  module: AuditLogModule | string;
  reason?: string | null;
  riskFlags: string[];
  createdAt: string;
  metadata?: Record<string, unknown> | null;
};

export type TablePaymentTimelineEntryDTO = {
  paymentId: string;
  orderId: string;
  amount: number;
  paymentMethod: PaymentMethod;
  status: FinancialPaymentStatus;
  createdBy: string | null;
  createdAt: string;
  refundedAmount: number;
  remainingAmount: number;
};

export type TableFinancialSummaryDTO = {
  tableId: string;
  tableNumber: number | null;
  subtotal: number;
  discountTotal: number;
  taxTotal: number;
  grandTotal: number;
  paidAmount: number;
  remainingAmount: number;
  ordersCount: number;
  paymentsCount: number;
};

export type TableBillingDTO = {
  summary: TableFinancialSummaryDTO;
  orders: OrderResponse[];
  payments: TablePaymentTimelineEntryDTO[];
  discounts: DiscountDTO[];
};

export type SplitBillMode = 'EQUAL' | 'ITEMS' | 'ORDERS';

export type PrintJobDTO = {
  id: string;
  jobId: string | null;
  orderId: string | null;
  restaurantId?: string | null;
  printerId?: string | null;
  type: PrintJobType;
  printerName: string;
  status: PrintJobStatus;
  attempts: number;
  payload?: unknown;
  result?: unknown;
  failedReason: string | null;
  errorMessage: string | null;
  processedAt: string | null;
  printedAt: string | null;
  createdAt: string;
};

export type PrinterConfigDTO = {
  id: string;
  name: string;
  ipAddress: string;
  port: number;
  type: PrinterType;
  status: PrinterStatus;
  restaurantId: string;
  createdAt: string;
  updatedAt: string;
};

export type StaffMemberDTO = {
  id: string;
  name: string;
  role: UserRole;
  phone: string | null;
  nationalId: string | null;
  birthDate: string | null;
  hireDate: string | null;
  address: string | null;
  staffCode: string;
  salaryType: 'MONTHLY' | 'DAILY' | null;
  salaryAmount: number | null;
  emergencyContactName: string | null;
  emergencyContactPhone: string | null;
  notes: string | null;
  isActive: boolean;
  restaurantId: string;
  createdAt: string;
  updatedAt: string;
};

export type ReportExportJobDTO = {
  id: string;
  restaurantId: string;
  type: ReportType;
  name: string;
  status: ReportStatus;
  format: 'CSV' | 'JSON';
  filePath?: string | null;
  errorMessage?: string | null;
  rangeStart: string;
  rangeEnd: string;
  rowCount: number;
  startedAt?: string | null;
  createdAt: string;
  completedAt: string | null;
  failedAt?: string | null;
};

export type QueueJobDTO = {
  id: string;
  bullJobId: string;
  queueName: QueueName;
  jobType: QueueJobType;
  restaurantId: string | null;
  status: QueueJobStatus;
  attempts: number;
  maxAttempts: number;
  payload: unknown;
  result: unknown;
  error: string | null;
  createdAt: string;
  updatedAt: string;
  processedAt: string | null;
  failedAt: string | null;
};

export type FailedPrintJobDTO = {
  id: string;
  queueJobId: string;
  printJobId: string | null;
  printerId: string | null;
  jobId: string;
  restaurantId: string;
  payload: unknown;
  error: string;
  attempts: number;
  failedAt: string;
};

export type InventoryItemDTO = {
  id: string;
  restaurantId: string;
  name: string;
  unit: string;
  stockLevel: number;
  minAlertLevel: number;
  unitPrice: number;
  supplier: string;
  status: InventoryStatus;
  createdAt: string;
  updatedAt: string;
};

export type CustomerProfileDTO = {
  id: string;
  restaurantId: string;
  name: string;
  phone: string;
  email: string | null;
  tier: CustomerTier;
  notes: string | null;
  totalOrders: number;
  totalSpent: number;
  lastVisitAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type AuditLogDTO = {
  id: string;
  restaurantId: string;
  userId: string | null;
  userName: string;
  role: string;
  action: string;
  details?: unknown;
  module: AuditLogModule;
  status: AuditLogStatus;
  createdAt: string;
};

export type EmployeeRiskProfileDTO = {
  userName: string;
  role: string;
  staffCode: string | null;
  editsCount: number;
  cancellationsCount: number;
  discountsCount: number;
  refundsCount: number;
  affectedAmount: number;
  riskScore: number;
  highRiskActions: number;
};

export type PaymentDTO = {
  id: string;
  orderId: string;
  amount: number;
  paymentMethod: PaymentMethod;
  status: FinancialPaymentStatus;
  referenceNumber: string | null;
  notes: string | null;
  reason: string | null;
  refundedAmount: number;
  remainingAmount: number;
  createdBy: string | null;
  updatedBy: string | null;
  createdAt: string;
  updatedAt: string;
};

export type DiscountDTO = {
  id: string;
  orderId: string;
  type: DiscountType;
  value: number;
  reason: string;
  approvalStatus: DiscountApprovalStatus;
  approvedBy: string | null;
  createdBy: string | null;
  createdAt: string;
};

export type PaymentReportRowDTO = {
  paymentId: string;
  orderId: string;
  dailyOrderNumber?: number | null;
  amount: number;
  refundedAmount: number;
  netAmount: number;
  paymentMethod: PaymentMethod;
  status: FinancialPaymentStatus;
  createdBy?: string | null;
  createdAt: string;
};

export type DiscountReportRowDTO = {
  discountId: string;
  orderId: string;
  dailyOrderNumber?: number | null;
  type: DiscountType;
  value: number;
  reason: string;
  approvalStatus: DiscountApprovalStatus;
  createdBy?: string | null;
  approvedBy?: string | null;
  createdAt: string;
};

export type SettingsDTO = {
  id: string;
  restaurantId: string;
  restaurantName: string;
  contactPhone: string;
  contactEmail: string | null;
  businessAddress: string;
  receiptLogoUrl: string | null;
  receiptFooterMessage: string | null;
  openingHours: string;
  closingHours: string;
  currency: string;
  salesTax: number;
  defaultDiscountLabel: string | null;
  maxAutoDiscountPercent: number;
  refundAlertThreshold: number;
  language: string;
  direction: 'ltr' | 'rtl';
  locale: string;
  dateFormat: string;
  acceptsCash: boolean;
  acceptsCard: boolean;
  acceptsQrOrdering: boolean;
  stripeEnabled: boolean;
  whatsappEnabled: boolean;
  smtpEnabled: boolean;
  createdAt: string;
  updatedAt: string;
};

export type WaiterNotificationDTO = {
  id: string;
  restaurantId: string;
  tableId: string | null;
  orderId: string | null;
  acceptedByUserId: string | null;
  type: WaiterNotificationType;
  status: WaiterNotificationStatus;
  message: string;
  metadata: WaiterNotificationMetadata | null;
  createdAt: string;
  updatedAt: string;
  acceptedAt: string | null;
  resolvedAt: string | null;
  tableNumber: number | null;
  acceptedByUserName: string | null;
};

// Input and DTO contracts

export type CreateTableInput = {
  restaurantId: string;
  number: number;
  capacity: number;
  status?: TableStatus;
  floorName?: string | null;
  floorId?: string | null;
  posX?: number | null;
  posY?: number | null;
  shape?: 'round' | 'square' | null;
};

export type CreateFloorInput = {
  restaurantId: string;
  name: string;
  sortOrder?: number;
};

export type UpdateFloorInput = {
  name?: string;
  sortOrder?: number;
};

export type UpdateTableInput = {
  number?: number;
  capacity?: number;
  status?: TableStatus;
  floorName?: string | null;
  floorId?: string | null;
  posX?: number | null;
  posY?: number | null;
  shape?: 'round' | 'square' | null;
};

export type CreateMenuInput = {
  restaurantId: string;
  name: string;
  nameEn?: string | null;
  nameFr?: string | null;
  nameAr?: string | null;
  description?: string | null;
  descriptionEn?: string | null;
  descriptionFr?: string | null;
  descriptionAr?: string | null;
  image?: string | null;
  heroImage?: string | null;
  themeKey?: string | null;
  sortOrder?: number;
  active?: boolean;
};

export type UpdateMenuInput = {
  name?: string;
  nameEn?: string | null;
  nameFr?: string | null;
  nameAr?: string | null;
  description?: string | null;
  descriptionEn?: string | null;
  descriptionFr?: string | null;
  descriptionAr?: string | null;
  image?: string | null;
  heroImage?: string | null;
  themeKey?: string | null;
  sortOrder?: number;
  active?: boolean;
};

export type CreateMenuItemInput = {
  restaurantId: string;
  menuId: string;
  name: string;
  nameEn?: string | null;
  nameFr?: string | null;
  nameAr?: string | null;
  description?: string | null;
  descriptionEn?: string | null;
  descriptionFr?: string | null;
  descriptionAr?: string | null;
  price: number;
  image?: string | null;
  available?: boolean;
  featured?: boolean;
  badge?: string | null;
  badgeEn?: string | null;
  badgeFr?: string | null;
  badgeAr?: string | null;
  sortOrder?: number;
};

export type UpdateMenuItemInput = {
  menuId?: string;
  name?: string;
  nameEn?: string | null;
  nameFr?: string | null;
  nameAr?: string | null;
  description?: string | null;
  descriptionEn?: string | null;
  descriptionFr?: string | null;
  descriptionAr?: string | null;
  price?: number;
  image?: string | null;
  available?: boolean;
  featured?: boolean;
  badge?: string | null;
  badgeEn?: string | null;
  badgeFr?: string | null;
  badgeAr?: string | null;
  sortOrder?: number;
};

export type CreateModifierGroupInput = {
  restaurantId: string;
  menuItemId: string;
  name: string;
  nameEn?: string | null;
  nameFr?: string | null;
  nameAr?: string | null;
  description?: string | null;
  descriptionEn?: string | null;
  descriptionFr?: string | null;
  descriptionAr?: string | null;
  required?: boolean;
  minSelections?: number;
  maxSelections?: number;
  sortOrder?: number;
};

export type UpdateModifierGroupInput = {
  name?: string;
  nameEn?: string | null;
  nameFr?: string | null;
  nameAr?: string | null;
  description?: string | null;
  descriptionEn?: string | null;
  descriptionFr?: string | null;
  descriptionAr?: string | null;
  required?: boolean;
  minSelections?: number;
  maxSelections?: number;
  sortOrder?: number;
};

export type CreateModifierOptionInput = {
  groupId: string;
  name: string;
  nameEn?: string | null;
  nameFr?: string | null;
  nameAr?: string | null;
  description?: string | null;
  descriptionEn?: string | null;
  descriptionFr?: string | null;
  descriptionAr?: string | null;
  priceDelta?: number;
  available?: boolean;
  isDefault?: boolean;
  sortOrder?: number;
};

export type UpdateModifierOptionInput = {
  name?: string;
  nameEn?: string | null;
  nameFr?: string | null;
  nameAr?: string | null;
  description?: string | null;
  descriptionEn?: string | null;
  descriptionFr?: string | null;
  descriptionAr?: string | null;
  priceDelta?: number;
  available?: boolean;
  isDefault?: boolean;
  sortOrder?: number;
};

export type CreateOrderInput = {
  tableId?: OrderContextDTO['tableId'];
  restaurantId: OrderContextDTO['restaurantId'];
  orderType?: OrderType;
  items: CartItemDTO[];
  guestSessionId?: string;
};

export type CreatePrinterConfigInput = {
  restaurantId: string;
  name: string;
  ipAddress: string;
  port: number;
  type: PrinterType;
  status?: PrinterStatus;
};

export type UpdatePrinterConfigInput = {
  name?: string;
  ipAddress?: string;
  port?: number;
  type?: PrinterType;
  status?: PrinterStatus;
};

export type CreateStaffInput = {
  restaurantId: string;
  name: string;
  staffCode: string;
  password: string;
  role: UserRole;
  phone?: string | null;
  nationalId?: string | null;
  birthDate?: string | null;
  hireDate?: string | null;
  address?: string | null;
  salaryType?: 'MONTHLY' | 'DAILY' | null;
  salaryAmount?: number | null;
  emergencyContactName?: string | null;
  emergencyContactPhone?: string | null;
  notes?: string | null;
  isActive?: boolean;
};

export type UpdateStaffInput = {
  name?: string;
  password?: string;
  role?: UserRole;
  phone?: string | null;
  nationalId?: string | null;
  birthDate?: string | null;
  hireDate?: string | null;
  address?: string | null;
  staffCode?: string;
  salaryType?: 'MONTHLY' | 'DAILY' | null;
  salaryAmount?: number | null;
  emergencyContactName?: string | null;
  emergencyContactPhone?: string | null;
  notes?: string | null;
  isActive?: boolean;
};

export type CreateReportExportJobInput = {
  restaurantId: string;
  type: ReportType;
  name: string;
  format: 'CSV' | 'JSON';
  rangeStart: string;
  rangeEnd: string;
};

export type CreateInventoryItemInput = {
  restaurantId: string;
  name: string;
  unit: string;
  stockLevel: number;
  minAlertLevel: number;
  unitPrice: number;
  supplier: string;
};

export type UpdateInventoryItemInput = {
  name?: string;
  unit?: string;
  stockLevel?: number;
  minAlertLevel?: number;
  unitPrice?: number;
  supplier?: string;
};

export type CreateCustomerProfileInput = {
  restaurantId: string;
  name: string;
  phone: string;
  email?: string | null;
  tier?: CustomerTier;
  notes?: string | null;
};

export type UpdateCustomerProfileInput = {
  name?: string;
  phone?: string;
  email?: string | null;
  tier?: CustomerTier;
  notes?: string | null;
};

export type UpsertSettingsInput = Omit<SettingsDTO, 'id' | 'createdAt' | 'updatedAt'>;

export type UpdateOrderStatusInput = {
  status: OrderStatus;
  reason?: string;
};

export type CreatePaymentInput = {
  orderId: string;
  amount: number;
  paymentMethod: PaymentMethod;
  referenceNumber?: string | null;
  notes?: string | null;
  reason: string;
};

export type UpdatePaymentInput = {
  amount?: number;
  referenceNumber?: string | null;
  notes?: string | null;
  reason: string;
};

export type RefundPaymentInput = {
  amount: number;
  reason: string;
  notes?: string | null;
};

export type ChangePaymentMethodInput = {
  paymentMethod: PaymentMethod;
  reason: string;
};

export type CreateDiscountInput = {
  orderId: string;
  type: DiscountType;
  value: number;
  reason: string;
};

export type UpdateDiscountInput = {
  value?: number;
  reason: string;
};

export type ApproveDiscountInput = {
  reason: string;
};

export type PrintReceiptInput = {
  language: ReceiptLanguage;
  printerName?: string;
};

// Analytics and realtime types

export type RevenueDataset = {
  label: string;
  data: number[];
  borderColor: string;
  backgroundColor: string;
};

export type RevenueChartResponse = {
  labels: string[];
  datasets: RevenueDataset[];
};

export type DashboardRevenueMetrics = {
  today: number;
  week: number;
  month: number;
};

export type DashboardOrdersMetrics = {
  total: number;
  completed: number;
  cancelled: number;
};

export type DashboardCustomersMetrics = {
  total: number;
  returning: number;
};

export type DashboardRecentOrder = {
  id: string;
  dailyOrderNumber: number;
  status: OrderStatus;
  grandTotal: number;
  paidAmount: number;
  remainingAmount: number;
  financialStatus: OrderFinancialStatus;
  tableLabel: string;
  createdAt: string;
};

export type TopDishDTO = {
  menuItemId: string;
  name: string;
  quantitySold: number;
  revenue: number;
};

export type BusyHourDTO = {
  hour: string;
  orders: number;
};

export type OrdersSummaryDTO = {
  total: number;
  pending: number;
  preparing: number;
  ready: number;
  delivered: number;
  paid: number;
  cancelled: number;
};

export type DashboardAnalyticsDTO = {
  revenue: DashboardRevenueMetrics;
  orders: DashboardOrdersMetrics;
  customers: DashboardCustomersMetrics;
  topDishes: TopDishDTO[];
  busyHours: BusyHourDTO[];
  recentOrders: DashboardRecentOrder[];
};

export const REALTIME_EVENTS = {
  ORDER_CREATED: 'ORDER_CREATED',
  ORDER_PREPARING: 'ORDER_PREPARING',
  ORDER_READY: 'ORDER_READY',
  ORDER_DELIVERED: 'ORDER_DELIVERED',
  ORDER_PAID: 'ORDER_PAID',
  CALL_WAITER: 'CALL_WAITER',
} as const;

export type RealtimeEvent = (typeof REALTIME_EVENTS)[keyof typeof REALTIME_EVENTS];

export const REDIS_ORDER_CHANNELS = {
  CREATED: 'orders.created',
  PREPARING: 'orders.preparing',
  READY: 'orders.ready',
  DELIVERED: 'orders.delivered',
  PAID: 'orders.paid',
} as const;

export type RedisOrderChannel = (typeof REDIS_ORDER_CHANNELS)[keyof typeof REDIS_ORDER_CHANNELS];

export type RealtimeOrderPayload = {
  event: RealtimeEvent;
  order: OrderResponse;
};

export type WaiterCallPayload = {
  restaurantId: string;
  tableId: string;
  tableNumber: number;
  requestedAt: string;
};

export type WaiterCallNotificationPayload = {
  event: 'CALL_WAITER';
  call: WaiterCallPayload;
};

export type WaiterNotificationRealtimePayload = {
  notification: WaiterNotificationDTO;
};

// Shared constants

/**
 * Legacy constant used to model walk-in/takeaway orders as a virtual table.
 * Keep temporarily for compatibility until OrderType migration is completed.
 */
export const WALK_IN_TABLE_ID = 'c9999999-9999-4999-8999-999999999999';

// Shared helpers

export function restaurantRoom(restaurantId: string) {
  return `restaurant:${restaurantId}`;
}

export function tableRoom(restaurantId: string, tableId: string) {
  return `restaurant:${restaurantId}:table:${tableId}`;
}

/**
 * Legacy helper based on the virtual walk-in table implementation.
 * Keep temporarily until OrderType replaces the takeaway model end-to-end.
 */
export function isWalkInOrder(
  order: Pick<OrderResponse, 'tableId' | 'table'> & Partial<Pick<OrderResponse, 'orderType'>>,
) {
  if (order.orderType) {
    return order.orderType === OrderType.TAKEAWAY;
  }

  return false;
}

/**
 * Legacy helper based on the virtual walk-in table implementation.
 * Keep temporarily until OrderType replaces the takeaway model end-to-end.
 */
export function getOrderTypeLabel(
  order: Pick<OrderResponse, 'tableId' | 'table'> & Partial<Pick<OrderResponse, 'orderType'>>,
) {
  if (order.orderType === OrderType.DELIVERY) {
    return {
      type: 'external' as const,
      label: 'Delivery',
      shortLabel: 'Delivery',
    };
  }

  if (isWalkInOrder(order)) {
    return {
      type: 'external' as const,
      label: 'Takeaway',
      shortLabel: 'Takeaway',
    };
  }

  const number = order.table?.number ?? 0;
  return {
    type: 'table' as const,
    label: `Table ${number}`,
    shortLabel: `T${number}`,
  };
}

export function formatDailyOrderNumber(order: Pick<OrderResponse, 'dailyOrderNumber'>) {
  return String(order.dailyOrderNumber);
}
