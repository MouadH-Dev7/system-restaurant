'use client';

import type { ReactNode } from 'react';
import { Activity, LogOut, ScrollText, ShoppingBag, TableProperties, UtensilsCrossed } from 'lucide-react';
import { logout } from '@/auth/service';
import { useAuthStore } from '@/auth/store';
import { getPosNavItems, posDir, posT } from '@/lib/i18n';
import { usePosDataStore } from '@/store/pos-data.store';
import { usePosUiStore } from '@/store/pos-ui.store';
import type { PosScreen } from '@/types/pos';

const iconMap: Record<PosScreen, ReactNode> = {
  orders: <ScrollText size={20} />,
  tables: <TableProperties size={20} />,
  'table-billing': <TableProperties size={20} />,
  'external-orders': <ShoppingBag size={20} />,
  'orders-history': <ScrollText size={20} />,
  'order-compose': <ScrollText size={20} />,
  'order-detail': <ScrollText size={20} />,
  checkout: <ScrollText size={20} />,
  receipt: <ScrollText size={20} />,
};

type PosShellProps = {
  title: string;
  subtitle: string;
  rightRail?: ReactNode;
  hideRightRail?: boolean;
  children: ReactNode;
};

export function PosShell({ title, subtitle, rightRail, hideRightRail = false, children }: PosShellProps) {
  const session = useAuthStore((state) => state.session);
  const activeScreen = usePosUiStore((state) => state.activeScreen);
  const composeReturnScreen = usePosUiStore((state) => state.composeReturnScreen);
  const language = usePosUiStore((state) => state.language);
  const setActiveScreen = usePosUiStore((state) => state.setActiveScreen);
  const startWalkInCompose = usePosUiStore((state) => state.startWalkInCompose);
  const setLanguage = usePosUiStore((state) => state.setLanguage);
  const socketStatus = usePosDataStore((state) => state.socketStatus);
  const t = posT(language);
  const direction = posDir(language);
  const navItems = getPosNavItems(language);

  const connectionLabel =
    socketStatus === 'connected'
      ? t.liveSync
      : socketStatus === 'connecting'
        ? t.connecting
        : t.offline;

  return (
    <div
      dir={direction}
      className="min-h-screen bg-[radial-gradient(circle_at_top_left,_#fff7f0,_#f6f0e7_40%,_#eef2f4)] text-slate-900"
    >
      <aside
        className={[
          'fixed inset-y-0 z-40 flex w-24 flex-col border-white/50 bg-white/75 px-3 py-5 backdrop-blur-xl',
          direction === 'rtl' ? 'right-0 border-l' : 'left-0 border-r',
        ].join(' ')}
      >
        <div className="mb-8 flex flex-col items-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#9f3308] text-white shadow-lg shadow-[#9f3308]/20">
            <UtensilsCrossed size={24} />
          </div>
          <span className="mt-3 text-[11px] font-semibold uppercase tracking-[0.28em] text-[#9f3308]">
            {t.brand}
          </span>
        </div>

        <nav className="flex flex-1 flex-col gap-3">
          {navItems.map((item) => {
            const active =
              item.id === activeScreen ||
              (item.id === 'external-orders' &&
                activeScreen === 'order-compose' &&
                composeReturnScreen === 'external-orders');
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  if (item.id === 'external-orders') {
                    startWalkInCompose('external-orders');
                    return;
                  }
                  setActiveScreen(item.id);
                }}
                className={[
                  'flex min-h-16 flex-col items-center justify-center rounded-2xl border text-[11px] font-semibold transition-all',
                  active
                    ? 'border-[#cf6d43] bg-[#a73308] text-white shadow-lg shadow-[#a73308]/20'
                    : 'border-transparent bg-white/20 text-slate-600 hover:border-white/60 hover:bg-white/70 hover:text-slate-900',
                ].join(' ')}
              >
                <span className="mb-1">{iconMap[item.id]}</span>
                <span>{item.shortLabel}</span>
              </button>
            );
          })}
        </nav>

        <div className="mt-6 rounded-2xl border border-white/60 bg-white/65 p-3 text-center">
          <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-[#dce8f8] text-[#39506b]">
            <Activity size={18} />
          </div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-500">
            {t.stationLabel}
          </p>
        </div>
      </aside>

      <div className={direction === 'rtl' ? 'pr-24' : 'pl-24'}>
        <header className="sticky top-0 z-30 border-b border-white/50 bg-white/70 backdrop-blur-xl">
          <div className="flex items-center justify-between px-8 py-5">
            <div>
              <h1 className="font-serif text-3xl font-bold tracking-tight text-slate-900">
                {title}
              </h1>
              <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
            </div>

            <div className="flex items-center gap-4">
              <label className="rounded-full border border-white/60 bg-white/80 px-3 py-2 text-sm text-slate-600 shadow-sm">
                <span className={language === 'ar' ? 'ml-2' : 'mr-2'}>{t.language}</span>
                <select
                  value={language}
                  onChange={(event) => setLanguage(event.target.value as typeof language)}
                  className="bg-transparent font-semibold outline-none"
                >
                  <option value="ar">{t.arabic}</option>
                  <option value="fr">{t.french}</option>
                  <option value="en">{t.english}</option>
                </select>
              </label>
              <div className="rounded-full border border-white/60 bg-white/80 px-4 py-2 text-sm text-slate-500 shadow-sm">
                {connectionLabel} - {t.kitchenLinked}
              </div>
              <div className="rounded-full border border-white/60 bg-[#18222f] px-4 py-2 text-sm font-medium text-white">
                {session?.user.name ?? t.operatorLabel}
              </div>
              <button
                type="button"
                onClick={() => void logout()}
                className="rounded-full border border-white/60 bg-white/80 p-3 text-slate-600 shadow-sm transition hover:text-slate-900"
                title="Logout"
              >
                <LogOut size={16} />
              </button>
            </div>
          </div>
        </header>

        <div
          className={
            hideRightRail
              ? 'min-h-[calc(100vh-92px)]'
              : 'grid min-h-[calc(100vh-92px)] grid-cols-[minmax(0,1fr)_360px]'
          }
        >
          <main className="px-8 py-8">{children}</main>
          {hideRightRail ? null : (
            <aside
              className={[
                'bg-white/65 p-6 backdrop-blur-xl',
                direction === 'rtl' ? 'border-r border-white/50' : 'border-l border-white/50',
              ].join(' ')}
            >
              {rightRail}
            </aside>
          )}
        </div>
      </div>
    </div>
  );
}
