import type { AuditLogDTO } from '@repo/shared-types';

type OrderItemSnapshot = {
  menuItemId?: string;
  menuItemName?: string;
  menuItemNameEn?: string | null;
  menuItemNameFr?: string | null;
  menuItemNameAr?: string | null;
  quantity?: number;
  lineTotal?: number;
  notes?: string | null;
  modifiers?: Array<{
    groupName?: string;
    groupNameEn?: string | null;
    groupNameFr?: string | null;
    groupNameAr?: string | null;
    optionName?: string;
    optionNameEn?: string | null;
    optionNameFr?: string | null;
    optionNameAr?: string | null;
  }>;
};

type EmployeeRiskDetails = {
  orderId?: string;
  dailyOrderNumber?: number;
  displayOrderId?: string;
  tableId?: string | null;
  tableNumber?: number | null;
  orderType?: string;
  previousStatus?: string;
  nextStatus?: string;
  previousVersion?: number;
  nextVersion?: number;
  previousTotal?: number;
  nextTotal?: number;
  totalDelta?: number;
  previousItemCount?: number;
  nextItemCount?: number;
  previousItems?: OrderItemSnapshot[];
  nextItems?: OrderItemSnapshot[];
  before?: {
    status?: string;
    total?: number;
    version?: number;
    items?: OrderItemSnapshot[];
  };
  after?: {
    status?: string;
    total?: number;
    version?: number;
    items?: OrderItemSnapshot[];
  };
  reason?: string | null;
  sourceContext?: string | null;
  riskFlags?: string[];
  staffCode?: string | null;
  editedAt?: string;
  createdAt?: string;
};

export function asEmployeeRiskDetails(value: unknown): EmployeeRiskDetails | null {
  if (!value || typeof value !== 'object') {
    return null;
  }

  return value as EmployeeRiskDetails;
}

export function exportLogsCsv(rows: AuditLogDTO[]) {
  if (rows.length === 0) {
    return;
  }

  const headers = [
    'createdAt',
    'userName',
    'role',
    'action',
    'orderId',
    'displayOrderId',
    'dailyOrderNumber',
    'tableNumber',
    'previousStatus',
    'nextStatus',
    'previousTotal',
    'nextTotal',
    'totalDelta',
    'riskFlags',
    'reason',
  ];

  const encode = (value: unknown) => `"${String(value ?? '').replace(/"/g, '""')}"`;

  const lines = rows.map((row) => {
    const details = asEmployeeRiskDetails(row.details);
    return [
      row.createdAt,
      row.userName,
      row.role,
      row.action,
      details?.orderId ?? '',
      details?.displayOrderId ?? '',
      details?.dailyOrderNumber ?? '',
      details?.tableNumber ?? '',
      details?.previousStatus ?? '',
      details?.nextStatus ?? '',
      details?.previousTotal ?? '',
      details?.nextTotal ?? '',
      details?.totalDelta ?? '',
      (details?.riskFlags ?? []).join(' | '),
      details?.reason ?? '',
    ]
      .map(encode)
      .join(',');
  });

  const content = [headers.join(','), ...lines].join('\n');
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'cashier-order-edit-investigation.csv';
  link.click();
  URL.revokeObjectURL(url);
}
