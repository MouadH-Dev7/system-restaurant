import type { OrderItemDTO, OrderResponse } from '@repo/shared-types';
import { getOrderTypeLabel } from '@repo/shared-types';

export type OrderModificationTicketContent = {
  title: string;
  lines: string[];
};

type ItemLineKey = string;

type ItemLine = {
  key: ItemLineKey;
  label: string;
  quantity: number;
};

function buildItemKey(item: OrderItemDTO): ItemLineKey {
  const modifierIds = (item.modifiers ?? [])
    .map((modifier) => modifier.modifierOptionId ?? modifier.optionName)
    .sort()
    .join('|');

  return JSON.stringify({
    menuItemId: item.menuItemId,
    notes: item.notes?.trim() ?? '',
    modifierIds,
  });
}

function buildItemLabel(item: OrderItemDTO): string {
  const name = item.menuItem?.name ?? item.menuItemId;
  const modifierSuffix =
    item.modifiers?.length && item.modifiers.length > 0
      ? ` (${item.modifiers.map((modifier) => modifier.optionName).join(', ')})`
      : '';
  const notesSuffix = item.notes?.trim() ? ` [${item.notes.trim()}]` : '';

  return `${name}${modifierSuffix}${notesSuffix}`;
}

function aggregateItems(items: OrderItemDTO[]): Map<ItemLineKey, ItemLine> {
  const aggregated = new Map<ItemLineKey, ItemLine>();

  for (const item of items) {
    const key = buildItemKey(item);
    const existing = aggregated.get(key);

    if (existing) {
      existing.quantity += item.quantity;
      continue;
    }

    aggregated.set(key, {
      key,
      label: buildItemLabel(item),
      quantity: item.quantity,
    });
  }

  return aggregated;
}

export function generateOrderModificationTicket(
  oldOrder: OrderResponse,
  newOrder: OrderResponse,
): OrderModificationTicketContent | null {
  const oldLines = aggregateItems(oldOrder.items);
  const newLines = aggregateItems(newOrder.items);

  const added: string[] = [];
  const removed: string[] = [];
  const changed: string[] = [];

  for (const [key, newLine] of newLines) {
    const oldLine = oldLines.get(key);

    if (!oldLine) {
      added.push(`+ ${newLine.label} x${newLine.quantity}`);
      continue;
    }

    if (oldLine.quantity !== newLine.quantity) {
      changed.push(`${newLine.label} x${oldLine.quantity} -> ${newLine.label} x${newLine.quantity}`);
    }
  }

  for (const [key, oldLine] of oldLines) {
    if (!newLines.has(key)) {
      removed.push(`- ${oldLine.label} x${oldLine.quantity}`);
    }
  }

  if (added.length === 0 && removed.length === 0 && changed.length === 0) {
    return null;
  }

  const tableLabel = newOrder.table?.number
    ? `Table ${newOrder.table.number}`
    : getOrderTypeLabel(newOrder).label;

  const lines: string[] = [
    `ORDER UPDATE #${newOrder.displayOrderId ?? newOrder.dailyOrderNumber}`,
    tableLabel,
    '',
  ];

  if (added.length > 0) {
    lines.push('Added:', ...added, '');
  }

  if (removed.length > 0) {
    lines.push('Removed:', ...removed, '');
  }

  if (changed.length > 0) {
    lines.push('Changed:', ...changed);
  }

  return {
    title: 'ORDER UPDATE',
    lines: lines.map((line) => line.trimEnd()).filter((line, index, all) => {
      if (line !== '') {
        return true;
      }

      return index > 0 && all[index - 1] !== '';
    }),
  };
}
