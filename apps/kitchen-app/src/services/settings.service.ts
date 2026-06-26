import type { SettingsDTO } from '@repo/shared-types';
import { http } from '@/lib/http';

export async function getKitchenSettings() {
  const { data } = await http.get<SettingsDTO>('/settings');
  return data;
}

export async function updateKitchenPrintingEnabled(enabled: boolean) {
  const current = await getKitchenSettings();
  const { data } = await http.post<SettingsDTO>('/settings', {
    ...current,
    kitchenPrintingEnabled: enabled,
  });
  return data;
}
