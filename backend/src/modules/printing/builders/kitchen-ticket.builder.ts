import { getOrderTypeLabel, type OrderResponse } from '@repo/shared-types';

export type KitchenTicketContent = {
  title: string;
  lines: string[];
};

export class KitchenTicketBuilder {
  build(order: OrderResponse): KitchenTicketContent {
    const tableLabel = order.table?.number
      ? `Table ${order.table.number}`
      : getOrderTypeLabel(order).label;
    const lines: string[] = [
      `Order #${order.displayOrderId ?? order.dailyOrderNumber}`,
      tableLabel,
      `Type: ${getOrderTypeLabel(order).label}`,
      `Created: ${new Date(order.createdAt).toLocaleTimeString()}`,
      '',
      'ITEMS',
      ...order.items.flatMap((item) => {
        const name = item.menuItem?.name ?? item.menuItemId;
        const lines = [`${item.quantity}x ${name}`];

        if (item.modifiers?.length) {
          lines.push(
            ...item.modifiers.map((modifier) => {
              const group = modifier.groupName ? `${modifier.groupName}: ` : '';
              const price =
                modifier.priceDelta > 0 ? ` (+${modifier.priceDelta.toFixed(2)})` : '';
              return `  + ${group}${modifier.optionName}${price}`;
            }),
          );
        }

        if (item.notes) {
          lines.push(`  Note: ${item.notes}`);
        }

        return lines;
      }),
    ];

    return {
      title: 'KITCHEN TICKET',
      lines,
    };
  }
}
