import { create } from 'zustand';

export type KitchenLanguage = 'en' | 'fr' | 'ar';

type AppState = {
  stationId?: string;
  language: KitchenLanguage;
  setStationId: (stationId: string) => void;
  setLanguage: (language: KitchenLanguage) => void;
};

export const useAppStore = create<AppState>((set) => ({
  language: 'ar',
  setStationId: (stationId) => set({ stationId }),
  setLanguage: (language) => set({ language }),
}));
