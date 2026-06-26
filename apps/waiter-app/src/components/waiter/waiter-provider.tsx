'use client';

import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import { logout } from '@/auth/service';
import { useAuthStore } from '@/auth/store';
import { useWaiterBootstrap } from '@/hooks/use-waiter-bootstrap';
import { waiterDir, waiterT } from '@/lib/i18n';
import { useWaiterStore } from '@/store/waiter.store';

type WaiterProviderProps = {
  children: ReactNode;
};

export function WaiterProvider({ children }: WaiterProviderProps) {
  const session = useAuthStore((state) => state.session);
  const canAccess =
    session?.user.role === 'ADMIN' ||
    session?.user.role === 'WAITER';
  const restaurantId = session?.user.restaurantId;
  const [reloadKey, setReloadKey] = useState(0);

  useWaiterBootstrap({ enabled: canAccess, restaurantId, reloadKey });
  const loading = useWaiterStore((state) => state.loading);
  const error = useWaiterStore((state) => state.error);
  const socketStatus = useWaiterStore((state) => state.socketStatus);
  const language = useWaiterStore((state) => state.language);
  const setLoading = useWaiterStore((state) => state.setLoading);
  const setError = useWaiterStore((state) => state.setError);
  const t = waiterT(language);
  const dir = waiterDir(language);

  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = dir;
  }, [dir, language]);

  function handleRetry() {
    setError(null);
    setLoading(true);
    setReloadKey((current) => current + 1);
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#fff8f2] px-6">
        <div className="rounded-[28px] border border-[#efd9c8] bg-white px-8 py-6 text-center shadow-[0_18px_60px_rgba(98,48,22,0.12)]">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#b55229]">
            {t.waiterService}
          </p>
          <p className="mt-3 text-lg font-semibold text-slate-900">{t.loadingFloorMenuTickets}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#fff8f2] px-6">
        <div className="max-w-md rounded-[28px] border border-rose-200 bg-white px-8 py-6 text-center shadow-[0_18px_60px_rgba(98,48,22,0.12)]">
          <p className="text-lg font-bold text-rose-700">{t.connectionError}</p>
          <p className="mt-2 text-sm text-slate-600">{error}</p>
          <p className="mt-4 text-xs text-slate-500">
            {t.socket}: {socketStatus}
          </p>
          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <button
              type="button"
              onClick={handleRetry}
              className="inline-flex h-11 items-center justify-center rounded-2xl bg-[#8d2d0e] px-5 text-sm font-semibold text-white transition hover:opacity-95"
            >
              {t.retryLoad}
            </button>
            <button
              type="button"
              onClick={() => void logout()}
              className="inline-flex h-11 items-center justify-center rounded-2xl border border-[#ead7c8] bg-white px-5 text-sm font-semibold text-slate-700 transition hover:bg-[#fff8f2]"
            >
              {t.signOut}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return children;
}
