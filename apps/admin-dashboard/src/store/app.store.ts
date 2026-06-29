import { create } from 'zustand';
import { defaultLocale, isRtl } from '@/lib/i18n';
import { STORAGE_KEYS } from '@/lib/constants';

export type SystemNotification = {
  id: string;
  type: 'info' | 'warning' | 'error' | 'success';
  message: string;
  timestamp: Date;
  read: boolean;
};

type AppState = {
  restaurantId?: string;
  setRestaurantId: (restaurantId?: string) => void;
  language: 'en' | 'fr' | 'ar';
  setLanguage: (language: 'en' | 'fr' | 'ar') => void;
  direction: 'ltr' | 'rtl';
  locale: string;

  notifications: SystemNotification[];
  addNotification: (notification: Omit<SystemNotification, 'id' | 'timestamp' | 'read'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearNotifications: () => void;
};

function readStoredLanguage(): AppState['language'] {
  if (typeof window === 'undefined') {
    return 'ar';
  }

  const value = window.localStorage.getItem(STORAGE_KEYS.ADMIN_LANGUAGE);
  return value === 'en' || value === 'fr' || value === 'ar' ? value : 'ar';
}

const initialLanguage = readStoredLanguage();

export const useAppStore = create<AppState>((set) => ({
  restaurantId: undefined,
  setRestaurantId: (restaurantId) => set({ restaurantId }),
  language: initialLanguage,
  setLanguage: (language) => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEYS.ADMIN_LANGUAGE, language);
    }
    set({
      language,
      direction: isRtl(language) ? 'rtl' : 'ltr',
      locale: defaultLocale(language),
    });
  },
  direction: isRtl(initialLanguage) ? 'rtl' : 'ltr',
  locale: defaultLocale(initialLanguage),

  notifications: [],
  addNotification: (notification) =>
    set((state) => ({
      notifications: [
        {
          ...notification,
          id: `n-${Math.random().toString(36).slice(2, 9)}`,
          timestamp: new Date(),
          read: false,
        },
        ...state.notifications,
      ],
    })),
  markAsRead: (id) =>
    set((state) => ({
      notifications: state.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)),
    })),
  markAllAsRead: () =>
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, read: true })),
    })),
  clearNotifications: () => set({ notifications: [] }),
}));
