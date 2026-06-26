import type {
  OrderResponse,
  OrderStatus as ApiOrderStatus,
  TableBillingDTO,
  TablePaymentTimelineEntryDTO,
} from '@repo/shared-types';

export type PosScreen =
  | 'orders'
  | 'tables'
  | 'table-billing'
  | 'external-orders'
  | 'orders-history'
  | 'order-compose'
  | 'order-detail'
  | 'checkout'
  | 'receipt';

export type NavItem = {
  id: PosScreen;
  label: string;
  shortLabel: string;
};

export type ActivityItem = {
  id: string;
  title: string;
  detail: string;
  time: string;
  tone: 'primary' | 'success' | 'warning' | 'muted';
};

export type OrderStatus = 'Pending' | 'Preparing' | 'Ready' | 'Delivered';

export type OrderTicket = {
  id: string;
  shortId: string;
  displayId: string;
  table: string;
  tableNumber: number;
  guestName: string;
  guestSessionId: string | null;
  guestCount: number;
  itemCount: number;
  grandTotal: number;
  paidAmount: number;
  remainingAmount: number;
  financialStatus: OrderResponse['financialStatus'];
  status: OrderStatus;
  apiStatus: ApiOrderStatus;
  openedAt: string;
  createdAt: string;
  tableId: string;
  isWalkIn: boolean;
};

export type OrderLine = {
  id: string;
  menuItemId: string;
  name: string;
  quantity: number;
  price: number;
  unitPrice: number;
  category: string;
  modifiers?: string[];
  status?: 'sent' | 'preparing' | 'ready';
};

export type TableOrderSummary = {
  orderId: string;
  shortId: string;
  displayId: string;
  guestLabel: string;
  guestSessionId: string | null;
  grandTotal: number;
  paidAmount: number;
  remainingAmount: number;
  financialStatus: OrderResponse['financialStatus'];
  status: ApiOrderStatus;
  itemCount: number;
  createdAt: string;
};

export type DiningTable = {
  id: string;
  label: string;
  seats: number;
  floorId: string | null;
  floorName: string;
  area: string;
  x: number;
  y: number;
  shape: 'round' | 'square';
  status: 'available' | 'occupied' | 'reserved' | 'preparing';
  activeOrders: TableOrderSummary[];
  orderCount: number;
  grandTotalAmount: number;
  paidAmount: number;
  remainingAmount: number;
};

export type PaymentMethod = {
  id: string;
  label: string;
  hint: string;
  backendMethod: 'CASH' | 'CARD' | 'BANK_TRANSFER' | 'MOBILE_PAYMENT';
};

export type MenuItemOption = {
  id: string;
  name: string;
  price: number;
  menuId: string;
  available: boolean;
};

export type CheckoutTarget =
  | { type: 'order'; orderId: string }
  | { type: 'table'; tableId: string };

export type ReceiptBundle = {
  mode: 'single' | 'table';
  orderIds: string[];
  tableLabel: string;
  guestLabel: string;
  itemCount: number;
  total: number;
  orders: OrderResponse[];
  summary?: TableBillingDTO['summary'];
  payments?: TablePaymentTimelineEntryDTO[];
  cashierName?: string;
  createdAt?: string;
};

export type ReceiptLanguage = 'ar' | 'fr' | 'en';
