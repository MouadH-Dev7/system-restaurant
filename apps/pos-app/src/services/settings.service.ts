import type { SettingsDTO } from '@repo/shared-types';
import { http } from '@/lib/http';

export async function getSettings() {
  const { data } = await http.get<SettingsDTO | null>('/settings');
  return data;
}
