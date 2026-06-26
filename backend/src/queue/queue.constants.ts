import { QueueJobType, QueueName } from '@prisma/client';

export const QUEUE_RETRY_DELAYS_MS = [5_000, 15_000, 30_000] as const;
export const QUEUE_BACKOFF_TYPE = 'restaurant-platform-backoff';

export const QUEUE_DEFINITIONS = {
  PRINTING: {
    bullName: 'printing',
    dbName: QueueName.PRINTING,
    concurrency: 2,
  },
  NOTIFICATIONS: {
    bullName: 'notifications',
    dbName: QueueName.NOTIFICATIONS,
    concurrency: 4,
  },
  ANALYTICS: {
    bullName: 'analytics',
    dbName: QueueName.ANALYTICS,
    concurrency: 2,
  },
  EXPORTS: {
    bullName: 'exports',
    dbName: QueueName.EXPORTS,
    concurrency: 1,
  },
  BACKUPS: {
    bullName: 'backups',
    dbName: QueueName.BACKUPS,
    concurrency: 1,
  },
  FAILED_PRINT_JOBS: {
    bullName: 'failed-print-jobs',
    dbName: QueueName.FAILED_PRINT_JOBS,
    concurrency: 1,
  },
} as const;

export const PRINT_QUEUE_JOBS = {
  RECEIPT: {
    name: 'print-receipt',
    type: QueueJobType.PRINT_RECEIPT,
  },
  KITCHEN_TICKET: {
    name: 'print-kitchen-ticket',
    type: QueueJobType.PRINT_KITCHEN_TICKET,
  },
  ORDER_UPDATE_TICKET: {
    name: 'print-order-update-ticket',
    type: QueueJobType.PRINT_ORDER_UPDATE_TICKET,
  },
  TEST_PAGE: {
    name: 'print-test-page',
    type: QueueJobType.PRINT_TEST_PAGE,
  },
} as const;

export const NOTIFICATION_QUEUE_JOBS = {
  ORDER_CREATED: {
    name: 'order-created',
    type: QueueJobType.NOTIFY_ORDER_CREATED,
  },
  ORDER_PREPARING: {
    name: 'order-preparing',
    type: QueueJobType.NOTIFY_ORDER_PREPARING,
  },
  ORDER_READY: {
    name: 'order-ready',
    type: QueueJobType.NOTIFY_ORDER_READY,
  },
  ORDER_DELIVERED: {
    name: 'order-delivered',
    type: QueueJobType.NOTIFY_ORDER_DELIVERED,
  },
  ORDER_PAID: {
    name: 'order-paid',
    type: QueueJobType.NOTIFY_ORDER_PAID,
  },
} as const;

export const ANALYTICS_QUEUE_JOBS = {
  SALES_AGGREGATION: {
    name: 'sales-aggregation',
    type: QueueJobType.ANALYTICS_SALES_AGGREGATION,
  },
  DAILY_METRICS: {
    name: 'daily-metrics',
    type: QueueJobType.ANALYTICS_DAILY_METRICS,
  },
  DASHBOARD_CALCULATION: {
    name: 'dashboard-calculation',
    type: QueueJobType.ANALYTICS_DASHBOARD_CALCULATION,
  },
} as const;

export const EXPORT_QUEUE_JOBS = {
  SALES_REPORT: {
    name: 'sales-report-export',
    type: QueueJobType.EXPORT_SALES_REPORT,
  },
  INVENTORY: {
    name: 'inventory-export',
    type: QueueJobType.EXPORT_INVENTORY,
  },
  CUSTOMERS: {
    name: 'customer-export',
    type: QueueJobType.EXPORT_CUSTOMERS,
  },
} as const;

export const BACKUP_QUEUE_JOBS = {
  DATABASE: {
    name: 'database-backup',
    type: QueueJobType.BACKUP_DATABASE,
  },
  REPORTS: {
    name: 'report-backup',
    type: QueueJobType.BACKUP_REPORTS,
  },
  SETTINGS: {
    name: 'settings-backup',
    type: QueueJobType.BACKUP_SETTINGS,
  },
} as const;

export function getRetryDelay(attemptsMade: number) {
  return QUEUE_RETRY_DELAYS_MS[attemptsMade - 1] ?? QUEUE_RETRY_DELAYS_MS[QUEUE_RETRY_DELAYS_MS.length - 1];
}
