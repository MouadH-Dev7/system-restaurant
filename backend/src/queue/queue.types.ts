import type { QueueJobType, QueueName } from '@prisma/client';
import type {
  OrderResponse,
  ReportType,
  RealtimeEvent,
} from '@repo/shared-types';

export type QueueDefinition = {
  bullName: string;
  dbName: QueueName;
  concurrency: number;
};

export type PrintQueuePayload = {
  printJobId: string;
  restaurantId: string;
  printerName: string;
  printerId?: string | null;
  orderId?: string | null;
  order?: OrderResponse | null;
  previousOrder?: OrderResponse | null;
  type: 'RECEIPT' | 'KITCHEN_TICKET' | 'ORDER_UPDATE_TICKET' | 'TEST_PAGE';
  document: {
    title: string;
    lines: string[];
  };
  rawDocument: string;
};

export type NotificationQueuePayload = {
  event: RealtimeEvent;
  order: OrderResponse;
};

export type AnalyticsQueuePayload = {
  restaurantId: string;
  scope: 'dashboard' | 'revenue:daily' | 'revenue:weekly' | 'revenue:monthly' | 'top-dishes' | 'busy-hours' | 'orders-summary';
};

export type ExportQueuePayload = {
  reportJobId: string;
  restaurantId: string;
  type: ReportType | 'INVENTORY' | 'CUSTOMERS';
  format: 'CSV' | 'JSON';
  name: string;
  rangeStart: string;
  rangeEnd: string;
};

export type BackupQueuePayload = {
  restaurantId: string;
  type: 'DATABASE' | 'REPORTS' | 'SETTINGS';
  requestedAt: string;
};

export type FailedPrintQueuePayload = {
  failedPrintJobId: string;
};

export type QueuePayloadMap = {
  PRINTING: PrintQueuePayload;
  NOTIFICATIONS: NotificationQueuePayload;
  ANALYTICS: AnalyticsQueuePayload;
  EXPORTS: ExportQueuePayload;
  BACKUPS: BackupQueuePayload;
  FAILED_PRINT_JOBS: FailedPrintQueuePayload;
};

export type QueuePayload = QueuePayloadMap[keyof QueuePayloadMap];

export type EnqueueJobInput<TPayload extends QueuePayload = QueuePayload> = {
  queueName: QueueName;
  jobType: QueueJobType;
  jobName: string;
  payload: TPayload;
  restaurantId?: string | null;
  attempts?: number;
};
