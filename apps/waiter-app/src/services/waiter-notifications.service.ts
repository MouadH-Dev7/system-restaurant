import type { WaiterNotificationDTO } from '@repo/shared-types';
import { http } from '@/lib/http';

export async function listWaiterNotifications(signal?: AbortSignal) {
  const { data } = await http.get<WaiterNotificationDTO[]>('/tables/waiter-notifications/list', { signal });
  return data;
}

export async function acceptWaiterNotification(notificationId: string) {
  const { data } = await http.patch<WaiterNotificationDTO>(`/tables/waiter-notifications/${notificationId}`, {
    status: 'ACCEPTED',
  });
  return data;
}

export async function resolveWaiterNotification(notificationId: string) {
  const { data } = await http.patch<WaiterNotificationDTO>(`/tables/waiter-notifications/${notificationId}`, {
    status: 'RESOLVED',
  });
  return data;
}
