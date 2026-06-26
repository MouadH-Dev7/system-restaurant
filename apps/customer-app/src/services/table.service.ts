import type { OrderContextDTO } from '@/types/order';
import { http } from '@/lib/http';

export async function callWaiter(context: OrderContextDTO) {
  const { data } = await http.post(
    `/tables/${context.tableId}/call-waiter`,
    undefined,
    {
      params: {
        restaurantId: context.restaurantId,
      },
    },
  );

  return data;
}
