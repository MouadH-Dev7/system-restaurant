import { create } from 'zustand';
import { defaultLocale, isRtl } from '@/lib/i18n';

const ADMIN_LANGUAGE_STORAGE_KEY = 'khalou-fodil:admin-language';

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
  setDirection: (direction: 'ltr' | 'rtl') => void;
  locale: string;
  setLocale: (locale: string) => void;
  dateFormat: string;
  setDateFormat: (dateFormat: string) => void;
  currency: string;
  setCurrency: (currency: string) => void;

  // Global Search
  searchQuery: string;
  setSearchQuery: (query: string) => void;

  // Notifications Center
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

  const value = window.localStorage.getItem(ADMIN_LANGUAGE_STORAGE_KEY);
  return value === 'en' || value === 'fr' || value === 'ar' ? value : 'ar';
}

const initialLanguage = readStoredLanguage();

export const useAppStore = create<AppState>((set) => ({
  restaurantId: undefined,
  setRestaurantId: (restaurantId) => set({ restaurantId }),
  language: initialLanguage,
  setLanguage: (language) => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(ADMIN_LANGUAGE_STORAGE_KEY, language);
    }
    set({
      language,
      direction: isRtl(language) ? 'rtl' : 'ltr',
      locale: defaultLocale(language),
    });
  },
  direction: isRtl(initialLanguage) ? 'rtl' : 'ltr',
  setDirection: (direction) => set({ direction }),
  locale: defaultLocale(initialLanguage),
  setLocale: (locale) => set({ locale }),
  dateFormat: 'dd/MM/yyyy',
  setDateFormat: (dateFormat) => set({ dateFormat }),
  currency: 'DZD',
  setCurrency: (currency) => set({ currency }),

  // Global Search
  searchQuery: '',
  setSearchQuery: (searchQuery) => set({ searchQuery }),

  // Notifications Center
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
