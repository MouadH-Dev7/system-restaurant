import type { CartItemDTO, MenuItemDTO, ModifierOptionDTO } from '@repo/shared-types';

export type {
  CartItemDTO,
  CreateOrderInput,
  MenuItemDTO,
  OrderContextDTO,
  OrderItemDTO,
  OrderResponse,
  OrderStatus,
  RestaurantDTO,
  TableDTO,
} from '@repo/shared-types';

export type CartLine = CartItemDTO & {
  menuItem: MenuItemDTO;
  selectedModifiers: ModifierOptionDTO[];
  lineTotal: number;
};
