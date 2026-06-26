'use client';

import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { AuthSession } from './types';

type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

type AuthState = {
  hydrated: boolean;
  status: AuthStatus;
  session: AuthSession | null;
  setSession: (session: AuthSession) => void;
  clearSession: () => void;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      hydrated: false,
      status: 'loading',
      session: null,
      setSession: (session) =>
        set({
          session,
          status: 'authenticated',
          hydrated: true,
        }),
      clearSession: () =>
        set({
          session: null,
          status: 'unauthenticated',
          hydrated: true,
        }),
    }),
    {
      name: 'khalou-fodil:admin-auth',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ session: state.session }),
      onRehydrateStorage: () => (state, error) => {
        if (error) {
          useAuthStore.setState({
            hydrated: true,
            status: 'unauthenticated',
            session: null,
          });
          return;
        }

        const session = state?.session ?? null;
        useAuthStore.setState({
          hydrated: true,
          status: session ? 'authenticated' : 'unauthenticated',
          session,
        });
      },
    },
  ),
);
