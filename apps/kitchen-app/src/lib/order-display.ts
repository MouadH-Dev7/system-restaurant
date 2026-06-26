import type { OrderItemModifierDTO } from '@repo/shared-types';

export function localizeModifierName(modifier: OrderItemModifierDTO) {
  return modifier.groupName ? `${modifier.groupName}: ${modifier.optionName}` : modifier.optionName;
}
