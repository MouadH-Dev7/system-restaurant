'use client';

import type { ReactNode } from 'react';
import { useEffect } from 'react';
import { useAuthStore } from '@/auth/store';
import { usePosBootstrap } from '@/hooks/use-pos-bootstrap';
import { usePosTableSync } from '@/hooks/use-pos-table-sync';
import { posDir, posT } from '@/lib/i18n';
import { usePosDataStore } from '@/store/pos-data.store';
import { usePosUiStore } from '@/store/pos-ui.store';

type PosProviderProps = {
  children: ReactNode;
};

export function PosProvider({ children }: PosProviderProps) {
  const session = useAuthStore((state) => state.session);
  const status = useAuthStore((state) => state.status);
  const resetData = usePosDataStore((state) => state.reset);
  const resetUi = usePosUiStore((state) => state.reset);
  const canAccess =
    session?.user.role === 'ADMIN' ||
    session?.user.role === 'CASHIER';
  const restaurantId = session?.user.restaurantId;

  usePosBootstrap({ enabled: canAccess, restaurantId });
  usePosTableSync(canAccess, restaurantId);
  const language = usePosUiStore((state) => state.language);
  const loading = usePosDataStore((state) => state.loading);
  const error = usePosDataStore((state) => state.error);
  const socketStatus = usePosDataStore((state) => state.socketStatus);
  const t = posT(language);
  const dir = posDir(language);

  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = dir;
  }, [dir, language]);

  useEffect(() => {
    if (status !== 'authenticated') {
      resetData();
      resetUi();
    }
  }, [resetData, resetUi, status]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f6f0e7] text-slate-700">
        <div className="rounded-[28px] border border-white/70 bg-white/80 px-8 py-6 text-center shadow-lg">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#a73308]">
            {t.posHub}
          </p>
          <p className="mt-3 text-lg font-bold">{t.loadingServiceData}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f6f0e7] px-6 text-slate-700">
        <div className="max-w-md rounded-[28px] border border-rose-200 bg-white/90 px-8 py-6 text-center shadow-lg">
          <p className="text-lg font-bold text-rose-700">{t.connectionError}</p>
          <p className="mt-2 text-sm text-slate-600">{error}</p>
          <p className="mt-4 text-xs text-slate-500">
            Socket: {socketStatus} - {t.ensureBackend}
          </p>
        </div>
      </div>
    );
  }

  return children;
}
