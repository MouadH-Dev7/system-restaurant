'use client';

import { memo } from 'react';
import { BellRing, ChefHat, Clock3, LayoutDashboard, LogOut } from 'lucide-react';
import { waiterDir, waiterT } from '@/lib/i18n';
import type { WaiterLanguage } from '@/store/waiter.store';

interface WaiterSidebarProps {
  language: WaiterLanguage;
  activeView: 'service' | 'notifications' | 'tracking';
  socketStatus: string;
  unreadNotificationCount: number;
  onSetActiveView: (view: 'service' | 'notifications' | 'tracking') => void;
  onMarkAllNotificationsRead: () => void;
  onLogout: () => void;
}

export const WaiterSidebar = memo(function WaiterSidebar({
  language,
  activeView,
  socketStatus,
  unreadNotificationCount,
  onSetActiveView,
  onMarkAllNotificationsRead,
  onLogout,
}: WaiterSidebarProps) {
  const t = waiterT(language);
  const dir = waiterDir(language);
  const isRtl = dir === 'rtl';
  const mobileNotificationsLabel = language === 'ar' ? 'الإشعارات' : language === 'fr' ? 'Notifications' : 'Notifications';

  return (
    <aside className="hidden w-[88px] flex-col border-r border-[#ead4c2] bg-white/80 px-3 py-5 backdrop-blur xl:flex">
      <div className="flex h-14 w-14 items-center justify-center rounded-[20px] bg-[#8d2d0e] text-white shadow-[0_16px_28px_rgba(141,45,14,0.28)]">
        <ChefHat className="h-7 w-7" />
      </div>
      <nav className="mt-8 flex flex-1 flex-col gap-3">
        <button
          type="button"
          onClick={() => onSetActiveView('service')}
          className={`rounded-[18px] px-3 py-4 ${
            activeView === 'service'
              ? 'bg-[#fff0e8] text-[#8d2d0e] shadow-sm'
              : 'text-slate-500'
          }`}
        >
          <div className="flex justify-center">
            <LayoutDashboard className="h-5 w-5" />
          </div>
          <p className="mt-2 text-[11px] font-bold">{t.service}</p>
        </button>
        <button
          type="button"
          onClick={() => {
            onSetActiveView('notifications');
            onMarkAllNotificationsRead();
          }}
          className={`relative rounded-[18px] px-3 py-4 ${
            activeView === 'notifications'
              ? 'bg-[#fff0e8] text-[#8d2d0e] shadow-sm'
              : 'text-slate-500'
          }`}
        >
          <div className="flex justify-center">
            <BellRing className="h-5 w-5" />
          </div>
          <p className="mt-2 text-[11px] font-medium">{mobileNotificationsLabel}</p>
          {unreadNotificationCount > 0 ? (
            <span className="absolute right-2 top-2 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">
              {unreadNotificationCount}
            </span>
          ) : null}
        </button>
        <button
          type="button"
          onClick={() => onSetActiveView('tracking')}
          className={`rounded-[18px] px-3 py-4 ${
            activeView === 'tracking'
              ? 'bg-[#fff0e8] text-[#8d2d0e] shadow-sm'
              : 'text-slate-500'
          }`}
        >
          <div className="flex justify-center">
            <Clock3 className="h-5 w-5" />
          </div>
          <p className="mt-2 text-[11px] font-medium">{t.tracking}</p>
        </button>
      </nav>
      <div className="rounded-[22px] border border-[#edd9ca] bg-[#fff6ef] p-3 text-center">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#b55229]">{t.live}</p>
        <p className="mt-2 text-xs text-slate-500">{socketStatus}</p>
      </div>
      <button
        type="button"
        onClick={onLogout}
        className="mt-3 inline-flex items-center justify-center rounded-[18px] border border-[#edd9ca] bg-white px-3 py-3 text-[#8d2d0e] transition hover:bg-[#fff2e8]"
      >
        <LogOut className="h-4 w-4" />
      </button>
    </aside>
  );
});
