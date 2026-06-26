import type { SettingsDTO, UpsertSettingsInput } from '@repo/shared-types';
import { http } from '@/lib/http';

export async function getSettings(restaurantId: string) {
  const { data } = await http.get<SettingsDTO | null>('/settings');
  return data;
}

export async function saveSettings(input: UpsertSettingsInput) {
  const { data } = await http.post<SettingsDTO>('/settings', input);
  return data;
}
