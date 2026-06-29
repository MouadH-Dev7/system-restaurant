'use client';

import { memo } from 'react';
import { BellRing, Clock3, Globe, LayoutDashboard, LogOut, Wifi } from 'lucide-react';
import { localizeTableLabel, replaceTemplate, waiterDir, waiterT } from '@/lib/i18n';
import type { TableDTO } from '@repo/shared-types';
import type { WaiterLanguage } from '@/store/waiter.store';

interface WaiterHeaderProps {
  language: WaiterLanguage;
  selectedTable: TableDTO | null;
  readyOrders: number;
  unreadNotificationCount: number;
  activeView: 'service' | 'notifications' | 'tracking';
  socketStatus: string;
  onSetActiveView: (view: 'service' | 'notifications' | 'tracking') => void;
  onMarkAllNotificationsRead: () => void;
  onSetLanguage: (lang: WaiterLanguage) => void;
  onLogout: () => void;
}

export const WaiterHeader = memo(function WaiterHeader({
  language,
  selectedTable,
  readyOrders,
  unreadNotificationCount,
  activeView,
  socketStatus,
  onSetActiveView,
  onMarkAllNotificationsRead,
  onSetLanguage,
  onLogout,
}: WaiterHeaderProps) {
  const t = waiterT(language);
  const dir = waiterDir(language);
  const isRtl = dir === 'rtl';
  const mobileNotificationsLabel = language === 'ar' ? 'الإشعارات' : language === 'fr' ? 'Notifications' : 'Notifications';

  return (
    <header className="sticky top-0 z-20 border-b border-[#ead4c2] bg-white/85 px-4 py-4 backdrop-blur md:px-5">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-[#b55229]">
            {t.restaurantWaiterConsole}
          </p>
          <h1 className="mt-2 text-2xl font-black text-slate-950 md:text-3xl">
            {selectedTable ? localizeTableLabel(selectedTable.number, language) : t.selectTable}
          </h1>
          <p className="mt-2 text-sm text-slate-500">{t.waiterDescription}</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="inline-flex items-center gap-2 rounded-full bg-[#fff1e8] px-4 py-2 text-sm font-semibold text-[#8d2d0e]">
            <BellRing className="h-4 w-4" />
            {readyOrders > 0
              ? replaceTemplate(t.readyForPickup, { count: readyOrders })
              : t.noReadyAlerts}
          </div>
          <div className="inline-flex items-center gap-2 rounded-full bg-white px-2 py-2 text-sm text-slate-600 ring-1 ring-[#ead4c2]">
            <Globe className="h-4 w-4" />
            {(['en', 'fr', 'ar'] as WaiterLanguage[]).map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => onSetLanguage(value)}
                className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                  language === value
                    ? 'bg-[#8d2d0e] text-white'
                    : 'text-slate-600 hover:bg-[#f7eee7]'
                }`}
              >
                {value === 'en' ? t.english : value === 'fr' ? t.french : t.arabic}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 xl:hidden">
        <button
          type="button"
          onClick={() => onSetActiveView('service')}
          className={`inline-flex min-h-12 items-center justify-center gap-2 rounded-[18px] px-4 py-3 text-sm font-semibold transition ${
            activeView === 'service'
              ? 'bg-[#8d2d0e] text-white shadow-[0_12px_24px_rgba(141,45,14,0.18)]'
              : 'bg-white text-slate-700 ring-1 ring-[#ead4c2]'
          }`}
        >
          <LayoutDashboard className="h-4 w-4" />
          {t.service}
        </button>
        <button
          type="button"
          onClick={() => {
            onSetActiveView('notifications');
            onMarkAllNotificationsRead();
          }}
          className={`relative inline-flex min-h-12 items-center justify-center gap-2 rounded-[18px] px-4 py-3 text-sm font-semibold transition ${
            activeView === 'notifications'
              ? 'bg-[#8d2d0e] text-white shadow-[0_12px_24px_rgba(141,45,14,0.18)]'
              : 'bg-white text-slate-700 ring-1 ring-[#ead4c2]'
          }`}
        >
          <BellRing className="h-4 w-4" />
          {mobileNotificationsLabel}
          {unreadNotificationCount > 0 ? (
            <span className="absolute right-2 top-2 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">
              {unreadNotificationCount}
            </span>
          ) : null}
        </button>
        <button
          type="button"
          onClick={() => onSetActiveView('tracking')}
          className={`inline-flex min-h-12 items-center justify-center gap-2 rounded-[18px] px-4 py-3 text-sm font-semibold transition ${
            activeView === 'tracking'
              ? 'bg-[#8d2d0e] text-white shadow-[0_12px_24px_rgba(141,45,14,0.18)]'
              : 'bg-white text-slate-700 ring-1 ring-[#ead4c2]'
          }`}
        >
          <Clock3 className="h-4 w-4" />
          {t.tracking}
        </button>
        <div className="col-span-2 flex items-center justify-between rounded-[18px] bg-[#fff6ef] px-4 py-3 text-sm text-slate-600">
          <div className="flex items-center gap-2">
            <Wifi className="h-4 w-4 text-[#8d2d0e]" />
            <span>{socketStatus}</span>
          </div>
          <button
            type="button"
            onClick={onLogout}
            className="inline-flex items-center gap-2 rounded-full border border-[#edd9ca] bg-white px-3 py-2 text-[#8d2d0e]"
          >
            <LogOut className="h-4 w-4" />
            {t.signOut}
          </button>
        </div>
      </div>
    </header>
  );
});
